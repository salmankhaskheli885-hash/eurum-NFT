
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
  runTransaction
} from 'firebase/firestore';
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
        const urlParams = new URLSearchParams(window.location.search);
        const refId = urlParams.get('ref');
        let referredBy: string | undefined = undefined;

        if (refId) {
             // In a real app, you'd query users collection to find user with this shortUid
             // For now, we assume refId is the full UID for simplicity
             const referrerQuery = query(collection(firestore, "users"), where("shortUid", "==", refId), limit(1));
             const referrerSnap = await getDocs(referrerQuery);
             if (!referrerSnap.empty) {
                 referredBy = referrerSnap.docs[0].id;
             }
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
            referredBy: referredBy
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
        const users = snapshot.docs.map(doc => doc.data() as User);
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


// TRANSACTION FUNCTIONS
// This function now handles all types of transactions including simulated auto-payout
export async function addTransaction(firestore: ReturnType<typeof getFirestore>, transactionData: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> {
    
    return await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', transactionData.userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found for transaction");
        }
        
        const user = userSnap.data() as User;
        
        let amountToDeduct = transactionData.amount;
        let finalTransactionData = { ...transactionData };

        if (transactionData.type === 'Withdrawal') {
            const settingsRef = doc(firestore, 'app', 'settings');
            const settingsSnap = await getDoc(settingsRef); // Cannot use transaction.get for this as it's outside the user's data tree
            const feePercentage = settingsSnap.exists() ? parseFloat(settingsSnap.data().withdrawalFee) : 2;
            const feeAmount = Math.abs(transactionData.amount) * (feePercentage / 100);
            
            // The amount to deduct from balance is the full requested amount
            const totalDeduction = Math.abs(transactionData.amount);

            if (user.balance < totalDeduction) {
                throw new Error(`Insufficient Balance. You need at least $${totalDeduction.toFixed(2)} to withdraw.`);
            }

            finalTransactionData.amount = -totalDeduction;
            amountToDeduct = -totalDeduction; // This is what is subtracted from balance
            
            finalTransactionData.withdrawalDetails = {
                ...transactionData.withdrawalDetails!,
                fee: feeAmount
            };

        } else if (transactionData.type === 'Investment') {
             const investmentAmount = Math.abs(transactionData.amount);
            if (user.balance < investmentAmount) {
                throw new Error("Insufficient Balance");
            }
            amountToDeduct = -investmentAmount;
        } else if (transactionData.type === 'Deposit') {
            // For deposits, the amount is positive and added to balance upon approval, not here.
            amountToDeduct = 0;
        } else {
             amountToDeduct = transactionData.amount;
        }
        
        // For non-deposit transactions, update balance immediately
        if (transactionData.type !== 'Deposit') {
            const newBalance = user.balance + amountToDeduct;
            transaction.update(userRef, { balance: newBalance });
        }


        const newTransactionDataWithDate: Omit<Transaction, 'id'> = {
            ...finalTransactionData,
            date: new Date().toISOString().split('T')[0]
        };
        
        const newDocRef = doc(collection(firestore, 'transactions'));
        transaction.set(newDocRef, newTransactionDataWithDate);
        
        const newTransaction = { ...newTransactionDataWithDate, id: newDocRef.id } as Transaction;

        // SIMULATE AUTOMATIC PAYOUT FOR INVESTMENTS - This part runs outside the transaction
        if (newTransaction.type === 'Investment' && newTransaction.investmentDetails) {
            const { maturityDate, investedAmount, dailyReturn, durationDays, planName } = newTransaction.investmentDetails;
            const profit = investedAmount * (dailyReturn / 100) * durationDays;
            const payoutAmount = investedAmount + profit;

            const maturityTimestamp = new Date(maturityDate).getTime();
            const nowTimestamp = new Date().getTime();
            const delay = maturityTimestamp - nowTimestamp;

            if (delay > 0) {
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
                        await addTransaction(firestore, payoutTransactionData);
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
            // Avoid re-processing
            console.log("Transaction already processed.");
            return false;
        }

        const userRef = doc(firestore, 'users', txData.userId);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) {
            throw new Error("User for transaction not found");
        }
        const user = userSnap.data() as User;
        
        // Update transaction status
        transaction.update(transactionRef, { status: newStatus });

        if (newStatus === 'Completed') {
            if (txData.type === 'Deposit') {
                // Add deposit amount to user's balance
                const newBalance = user.balance + txData.amount;
                transaction.update(userRef, { balance: newBalance });

                // --- COMMISSION LOGIC ---
                if (user.referredBy) {
                    const referrerRef = doc(firestore, 'users', user.referredBy);
                    const referrerSnap = await transaction.get(referrerRef);

                    if (referrerSnap.exists()) {
                        const referrer = referrerSnap.data() as User;
                        const commissionRate = referrer.role === 'partner' ? 0.10 : 0.05; // 10% for partners, 5% for users
                        const commissionAmount = txData.amount * commissionRate;

                        // Add commission to referrer's balance
                        const newReferrerBalance = referrer.balance + commissionAmount;
                        transaction.update(referrerRef, { balance: newReferrerBalance });

                        // Log commission transaction for the referrer
                        const commissionTransaction: Omit<Transaction, 'id'> = {
                            userId: referrer.uid,
                            userName: referrer.displayName || 'N/A',
                            type: 'Commission',
                            amount: commissionAmount,
                            status: 'Completed',
                            date: new Date().toISOString().split('T')[0],
                            details: `From ${user.displayName}'s deposit`
                        };
                        const commissionDocRef = doc(collection(firestore, 'transactions'));
                        transaction.set(commissionDocRef, commissionTransaction);
                    }
                }
            }
            // For withdrawals, balance is already deducted at request time. No action needed on completion.
        } else if (newStatus === 'Failed') {
            if (txData.type === 'Withdrawal' || txData.type === 'Investment') {
                // Refund the user if a withdrawal or investment fails (amount is negative, so we subtract)
                const newBalance = user.balance - txData.amount;
                transaction.update(userRef, { balance: newBalance });
            }
             // For deposits, no balance was changed, so no refund needed on failure.
        }
        
        return true;
    });
}


export function listenToAllTransactions(firestore: ReturnType<typeof getFirestore>, callback: (transactions: Transaction[]) => void): Unsubscribe {
    const transactionsCollection = collection(firestore, 'transactions');
    const q = query(transactionsCollection, orderBy("date", "desc"));
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
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
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
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
                withdrawalFee: "2"
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
