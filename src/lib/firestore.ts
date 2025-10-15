
'use client';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
  query,
  limit,
  orderBy,
  where,
  addDoc,
  updateDoc,
  onSnapshot, // Import onSnapshot
  type Unsubscribe,
  serverTimestamp,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { User as FirebaseUser } from 'firebase/auth';
import type { User, InvestmentPlan, Transaction, AppSettings, Announcement } from './data';

// USER FUNCTIONS
export async function getOrCreateUser(firestore: ReturnType<typeof getFirestore>, firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as User;
    } else {
        const isAdmin = firebaseUser.email === 'salmankhaskheli885@gmail.com';
        const isPartner = firebaseUser.email === 'vitalik@fynix.pro';
        const role = isAdmin ? 'admin' : isPartner ? 'partner' : 'user';

        // Check for referral
        let referredBy: string | undefined = undefined;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const refId = urlParams.get('ref');
    
            if (refId) {
                 const referrerQuery = query(collection(firestore, "users"), where("shortUid", "==", refId), limit(1));
                 const referrerSnap = await getDocs(referrerQuery);
                 if (!referrerSnap.empty) {
                     referredBy = referrerSnap.docs[0].id;
                 }
            }
        } catch (e) {
            console.error("Could not parse URL for referral", e)
        }


        const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: role,
            shortUid: firebaseUser.uid.substring(0, 8),
            balance: 0,
            currency: 'USD',
            vipLevel: 1,
            vipProgress: 0,
            kycStatus: 'unsubmitted',
            referralLink: `https://fynix.pro/ref/${firebaseUser.uid.substring(0, 8)}`,
            status: 'Active',
            referredBy: referredBy,
            totalDeposits: 0,
            lastWithdrawalDate: undefined
        };
        await setDoc(userRef, newUser);
        return newUser;
    }
}

export function listenToUser(firestore: ReturnType<typeof getFirestore>, userId: string, callback: (user: User | null) => void): Unsubscribe {
    const userRef = doc(firestore, 'users', userId);
    return onSnapshot(userRef, (doc) => {
        callback(doc.exists() ? doc.data() as User : null);
    });
}

export function listenToAllUsers(firestore: ReturnType<typeof getFirestore>, callback: (users: User[]) => void): Unsubscribe {
    const usersCollection = collection(firestore, 'users');
    return onSnapshot(usersCollection, (snapshot) => {
        const users = snapshot.docs.map(doc => ({...doc.data(), uid: doc.id } as User));
        callback(users);
    });
}

export async function updateUser(firestore: ReturnType<typeof getFirestore>, userId: string, updates: Partial<User>) {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, updates);
}

export async function deleteUser(firestore: ReturnType<typeof getFirestore>, userId: string) {
    const userRef = doc(firestore, 'users', userId);
    await deleteDoc(userRef);
}

export async function submitKyc(firestore: ReturnType<typeof getFirestore>, userId: string, kycData: Transaction['kycDetails']) {
    const userRef = doc(firestore, 'users', userId);
    // This is a simplified KYC submission. In a real app, you'd upload files to Firebase Storage and save the URLs.
    // For now, we'll just pass placeholder URLs and update the status.
    await updateDoc(userRef, {
        kycStatus: 'pending',
        // In a real app, you'd save file URLs from Firebase Storage here
        cnicFrontUrl: kycData?.cnicFrontUrl,
        cnicBackUrl: kycData?.cnicBackUrl,
        selfieUrl: kycData?.selfieUrl,
        mobileNumber: kycData?.mobileNumber,
    });
}

export async function updateKycStatus(firestore: ReturnType<typeof getFirestore>, userId: string, status: 'approved' | 'rejected') {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { kycStatus: status });
}


// TRANSACTION FUNCTIONS
export async function addTransaction(
    firestore: ReturnType<typeof getFirestore>, 
    transactionData: Omit<Transaction, 'id' | 'date'> & { receiptFile?: File }
): Promise<Transaction | null> {
    
    // Handle receipt upload for deposits
    if (transactionData.type === 'Deposit' && transactionData.receiptFile) {
        const storage = getStorage();
        const receiptRef = ref(storage, `receipts/${transactionData.userId}/${Date.now()}_${transactionData.receiptFile.name}`);
        
        try {
            const snapshot = await uploadBytes(receiptRef, transactionData.receiptFile);
            transactionData.receiptUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Error uploading receipt:", error);
            throw new Error("Could not upload receipt image.");
        }
    }
    // Remove the file object before saving to Firestore
    const { receiptFile, ...dataToSave } = transactionData;

    return await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', dataToSave.userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found for transaction");
        }
        
        const user = userSnap.data() as User;
        let amountToChange = 0;

        if (dataToSave.type === 'Withdrawal') {
            const withdrawalAmount = Math.abs(dataToSave.amount);

            // Check daily withdrawal limit
            if (user.lastWithdrawalDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lastWithdrawal = new Date(user.lastWithdrawalDate);
                if (lastWithdrawal >= today) {
                    throw new Error("You can only make one withdrawal request per day.");
                }
            }


            // Fee calculation
            const appSettingsDoc = await getDoc(doc(firestore, 'app', 'settings'));
            const feePercentage = appSettingsDoc.data()?.withdrawalFee || 0;
            const feeAmount = withdrawalAmount * (feePercentage / 100);
            const totalDeduction = withdrawalAmount + feeAmount;

            if (user.balance < totalDeduction) {
                throw new Error(`Insufficient Balance. You need at least $${totalDeduction.toFixed(2)} (including fee) to withdraw $${withdrawalAmount}.`);
            }
            amountToChange = -totalDeduction;

            // Add fee info to withdrawal details
            if (dataToSave.withdrawalDetails) {
                 dataToSave.withdrawalDetails.fee = feeAmount;
            }

        } else if (dataToSave.type === 'Investment') {
            const investmentAmount = Math.abs(dataToSave.amount);
            if (user.balance < investmentAmount) {
                throw new Error(`Insufficient Balance. You need at least $${investmentAmount.toFixed(2)} to invest.`);
            }
            amountToChange = -investmentAmount;
        } else if (dataToSave.type === 'Deposit') {
            amountToChange = 0;
        } else {
             amountToChange = dataToSave.amount;
        }
        
        if (amountToChange !== 0) {
            const newBalance = user.balance + amountToChange;
            transaction.update(userRef, { balance: newBalance });
        }
        
        const newTransactionDataWithDate: Omit<Transaction, 'id'> = {
            ...dataToSave,
            date: new Date().toISOString()
        };
        const newDocRef = doc(collection(firestore, 'transactions'));
        transaction.set(newDocRef, newTransactionDataWithDate);
        
        const newTransaction = { ...newTransactionDataWithDate, id: newDocRef.id } as Transaction;

        if (newTransaction.type === 'Investment' && newTransaction.investmentDetails) {
            const { maturityDate, investedAmount, dailyReturn, durationDays, planName } = newTransaction.investmentDetails;
            const profit = investedAmount * (dailyReturn / 100) * durationDays;
            const payoutAmount = investedAmount + profit;
            const maturityTimestamp = new Date(maturityDate).getTime();
            const nowTimestamp = new Date().getTime();
            const delay = maturityTimestamp - nowTimestamp;

            if (delay > 0) {
                // This is a simulation of a server-side scheduled function (like a Cloud Function).
                // In a real production app, this logic should be on a server to guarantee execution.
                setTimeout(async () => {
                    try {
                        const payoutTransactionData: Omit<Transaction, 'id' | 'date'> = {
                            userId: newTransaction.userId,
                            userName: newTransaction.userName,
                            type: 'Payout',
                            amount: payoutAmount,
                            status: 'Completed',
                            details: `Matured investment from ${planName}`
                        };
                         // Use a transaction for the payout to ensure atomicity
                        await runTransaction(firestore, async (payoutTx) => {
                            const userForPayoutRef = doc(firestore, 'users', newTransaction.userId);
                            const userForPayoutSnap = await payoutTx.get(userForPayoutRef);
                            if (userForPayoutSnap.exists()) {
                                const newBalance = userForPayoutSnap.data().balance + payoutAmount;
                                payoutTx.update(userForPayoutRef, { balance: newBalance });

                                const payoutDocRef = doc(collection(firestore, 'transactions'));
                                payoutTx.set(payoutDocRef, { ...payoutTransactionData, date: new Date().toISOString() });
                            }
                        });
                    } catch(e) {
                        console.error("Failed to process automatic payout:", e);
                    }
                }, delay);
            }
        }
        
        return newTransaction;
    });
}


export async function updateTransactionStatus(firestore: ReturnType<typeof getFirestore>, transactionId: string, newStatus: 'Completed' | 'Failed') {
    
    return await runTransaction(firestore, async (transaction) => {
        const transactionRef = doc(firestore, 'transactions', transactionId);
        const transactionSnap = await transaction.get(transactionRef);

        if (!transactionSnap.exists()) {
            throw new Error("Transaction not found");
        }
        
        const txData = transactionSnap.data() as Transaction;
        const oldStatus = txData.status;

        if (oldStatus !== 'Pending') {
            console.log("Transaction already processed.");
            return false;
        }

        const userRef = doc(firestore, 'users', txData.userId);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) {
            throw new Error("User for transaction not found");
        }
        const user = userSnap.data() as User;
        
        transaction.update(transactionRef, { status: newStatus });

        if (newStatus === 'Completed') {
            // Logic for completed withdrawal: update last withdrawal date
            if (txData.type === 'Withdrawal') {
                transaction.update(userRef, { lastWithdrawalDate: new Date().toISOString() });
            }

            if (txData.type === 'Deposit') {
                const newTotalDeposits = (user.totalDeposits || 0) + txData.amount;
                const newBalance = user.balance + txData.amount;

                let newVipLevel = user.vipLevel;
                let vipProgress = user.vipProgress;

                // --- Corrected VIP Level Up Logic ---
                if (newTotalDeposits >= 500) {
                    newVipLevel = 3;
                    const nextLevelThreshold = 1000;
                    const currentLevelThreshold = 500;
                    const progressInRange = newTotalDeposits - currentLevelThreshold;
                    const range = nextLevelThreshold - currentLevelThreshold;
                    vipProgress = Math.min(100, (progressInRange / range) * 100);
                } else if (newTotalDeposits >= 100) {
                    newVipLevel = 2;
                    const nextLevelThreshold = 500;
                    const currentLevelThreshold = 100;
                    const progressInRange = newTotalDeposits - currentLevelThreshold;
                    const range = nextLevelThreshold - currentLevelThreshold;
                    vipProgress = Math.min(100, (progressInRange / range) * 100);
                } else {
                    newVipLevel = 1;
                    const nextLevelThreshold = 100;
                    vipProgress = (newTotalDeposits / nextLevelThreshold) * 100;
                }
                // --- End of Corrected VIP Level Up Logic ---

                transaction.update(userRef, { 
                    balance: newBalance, 
                    totalDeposits: newTotalDeposits, 
                    vipLevel: newVipLevel,
                    vipProgress: Math.max(0, vipProgress) // Ensure progress is not negative
                });

                if (user.referredBy) {
                    const referrerRef = doc(firestore, 'users', user.referredBy);
                    const referrerSnap = await transaction.get(referrerRef);

                    if (referrerSnap.exists()) {
                        const referrer = referrerSnap.data() as User;
                        const commissionRate = referrer.role === 'partner' ? 0.10 : 0.05;
                        const commissionAmount = txData.amount * commissionRate;
                        const newReferrerBalance = referrer.balance + commissionAmount;
                        transaction.update(referrerRef, { balance: newReferrerBalance });

                        const commissionTransactionData: Omit<Transaction, 'id' | 'date'> = {
                            userId: referrer.uid,
                            userName: referrer.displayName || 'N/A',
                            type: 'Commission',
                            amount: commissionAmount,
                            status: 'Completed',
                            date: new Date().toISOString(),
                            details: `From ${user.displayName}'s deposit`
                        };
                         const commissionDocRef = doc(collection(firestore, 'transactions'));
                         transaction.set(commissionDocRef, commissionTransactionData);
                    }
                }
            }
        } else if (newStatus === 'Failed') {
            if (txData.type === 'Withdrawal') {
                 const feeAmount = txData.withdrawalDetails?.fee || 0;
                 const refundAmount = Math.abs(txData.amount) + feeAmount;
                 const newBalance = user.balance + refundAmount;
                 transaction.update(userRef, { balance: newBalance });
            }
        }
        
        return true;
    });
}


export function listenToAllTransactions(firestore: ReturnType<typeof getFirestore>, callback: (transactions: Transaction[]) => void): Unsubscribe {
    const transactionsCollection = collection(firestore, 'transactions');
    const q = query(transactionsCollection, orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: new Date(doc.data().date).toLocaleDateString() } as Transaction));
        callback(transactions);
    });
}

export function listenToUserTransactions(firestore: ReturnType<typeof getFirestore>, userId: string, callback: (transactions: Transaction[]) => void, count?: number): Unsubscribe {
    const transactionsCollection = collection(firestore, 'transactions');
    let q;
    if (count) {
        q = query(transactionsCollection, where("userId", "==", userId), orderBy("date", "desc"), limit(count));
    } else {
        q = query(transactionsCollection, where("userId", "==", userId), orderBy("date", "desc"));
    }
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: new Date(doc.data().date).toLocaleDateString() } as Transaction));
        callback(transactions);
    });
}


// INVESTMENT PLAN FUNCTIONS
export async function addInvestmentPlan(firestore: ReturnType<typeof getFirestore>, plan: Omit<InvestmentPlan, 'id'>): Promise<InvestmentPlan> {
    const plansCollection = collection(firestore, 'investment_plans');
    const newDocRef = await addDoc(plansCollection, plan);
    return { ...plan, id: newDocRef.id };
}

export async function updateInvestmentPlan(firestore: ReturnType<typeof getFirestore>, planToUpdate: InvestmentPlan) {
    const planRef = doc(firestore, 'investment_plans', planToUpdate.id);
    const { id, ...planData } = planToUpdate;
    await setDoc(planRef, planData, { merge: true });
}

export async function deleteInvestmentPlan(firestore: ReturnType<typeof getFirestore>, planId: string) {
    const planRef = doc(firestore, 'investment_plans', planId);
    await deleteDoc(planRef);
}

export function listenToAllInvestmentPlans(firestore: ReturnType<typeof getFirestore>, callback: (plans: InvestmentPlan[]) => void): Unsubscribe {
    const plansCollection = collection(firestore, 'investment_plans');
    return onSnapshot(plansCollection, (snapshot) => {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentPlan));
        callback(plans);
    });
}

// APP SETTINGS FUNCTIONS
export function listenToAppSettings(firestore: ReturnType<typeof getFirestore>, callback: (settings: AppSettings) => void): Unsubscribe {
    const settingsRef = doc(firestore, 'app', 'settings');
    return onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as AppSettings);
        } else {
            callback({
                adminWalletNumber: "0300-1234567",
                adminWalletName: "JazzCash",
                adminAccountHolderName: "Fynix Pro Admin",
                withdrawalFee: 2
            });
        }
    });
}

export async function updateAppSettings(firestore: ReturnType<typeof getFirestore>, newSettings: Partial<AppSettings>) {
    const settingsRef = doc(firestore, 'app', 'settings');
    await setDoc(settingsRef, newSettings, { merge: true });
}

// ANNOUNCEMENT FUNCTIONS
export async function addAnnouncement(firestore: ReturnType<typeof getFirestore>, message: string): Promise<Announcement> {
    const announcementsCollection = collection(firestore, 'announcements');
    const newAnnouncement = {
        message,
        date: new Date().toISOString(),
    };
    const newDocRef = await addDoc(announcementsCollection, newAnnouncement);
    return { ...newAnnouncement, id: newDocRef.id };
}

export function listenToLatestAnnouncement(firestore: ReturnType<typeof getFirestore>, callback: (announcement: Announcement | null) => void): Unsubscribe {
    const announcementsCollection = collection(firestore, 'announcements');
    const q = query(announcementsCollection, orderBy("date", "desc"), limit(1));
    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(null);
        } else {
            const doc = snapshot.docs[0];
            callback({ id: doc.id, ...doc.data() } as Announcement);
        }
    });
}
