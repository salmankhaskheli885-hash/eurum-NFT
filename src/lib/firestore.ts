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
        const userData = userSnap.data() as User;
        const updates: Partial<User> = {};
        if (userData.failedDepositCount === undefined) {
             updates.failedDepositCount = 0;
        }
         if (userData.totalDeposits === undefined) {
            updates.totalDeposits = 0;
        }
        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
            return { ...userData, ...updates };
        }
        return userData;
    } else {
        const isAdmin = firebaseUser.email === 'salmankhaskheli885@gmail.com';
        const isPartner = firebaseUser.email === 'vitalik@fynix.pro';
        const role = isAdmin ? 'admin' : isPartner ? 'partner' : 'user';

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
            lastWithdrawalDate: undefined,
            failedDepositCount: 0,
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
    await updateDoc(userRef, {
        kycStatus: 'pending',
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


// New, simplified, and robust transaction function
export async function addTransaction(
  firestore: ReturnType<typeof getFirestore>,
  transactionData: Omit<Transaction, 'id' | 'date'> & { receiptFile?: File }
) {
  const { receiptFile, ...dataToSave } = transactionData;

  // Step 1: Create a new transaction document reference with an auto-generated ID.
  const transactionDocRef = doc(collection(firestore, 'transactions'));
  
  let receiptUrl: string | undefined = undefined;

  // Step 2: If it's a deposit with a receipt, upload the file first.
  if (dataToSave.type === 'Deposit' && receiptFile) {
    try {
      const storage = getStorage();
      // Use the new transaction ID in the file path for easy association.
      const receiptPath = `receipts/${dataToSave.userId}/${transactionDocRef.id}_${receiptFile.name}`;
      const storageRef = ref(storage, receiptPath);
      const snapshot = await uploadBytes(storageRef, receiptFile);
      receiptUrl = await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      // Throw an error to stop the process and inform the user.
      throw new Error("Receipt upload failed. Please try again.");
    }
  }

  // Step 3: Prepare the final transaction object with all details.
  const finalTransactionData: Omit<Transaction, 'id'> = {
    ...dataToSave,
    date: new Date().toISOString(),
    receiptUrl: receiptUrl, // Add the URL if it exists
  };

  // Step 4: Save the complete transaction document.
  await setDoc(transactionDocRef, finalTransactionData);


  // Step 5: Handle post-transaction logic like balance updates for investments.
  // This is now separate from the initial save, making the process more reliable.
  if (dataToSave.type === 'Investment') {
    try {
        await runTransaction(firestore, async (transaction) => {
            const userRef = doc(firestore, 'users', dataToSave.userId);
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("User not found to update balance for investment.");
            }
            const user = userSnap.data() as User;
            const investmentAmount = Math.abs(dataToSave.amount);
            if (user.balance < investmentAmount) {
                throw new Error(`Insufficient Balance. You need at least $${investmentAmount.toFixed(2)} to invest.`);
            }
            const newBalance = user.balance - investmentAmount;
            transaction.update(userRef, { balance: newBalance });
        });

        // Now schedule the payout
        const finalTx = { id: transactionDocRef.id, ...finalTransactionData } as Transaction;
        handleInvestmentPayout(firestore, finalTx);
    } catch (error) {
        // If balance check fails, delete the already created transaction document for consistency.
        await deleteDoc(transactionDocRef);
        console.error("Investment balance check failed:", error);
        throw error; // Re-throw to inform the UI
    }
  } else if (dataToSave.type === 'Withdrawal') {
      try {
           await runTransaction(firestore, async (transaction) => {
               const userRef = doc(firestore, 'users', dataToSave.userId);
               const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) throw new Error("User not found.");

                const user = userSnap.data() as User;
                const withdrawalAmount = Math.abs(dataToSave.amount);
                if (user.balance < withdrawalAmount) {
                     throw new Error(`Insufficient Balance. You need at least $${withdrawalAmount.toFixed(2)} to withdraw.`);
                }
           });
      } catch (error) {
          await deleteDoc(transactionDocRef);
          console.error("Withdrawal pre-check failed:", error);
          throw error;
      }
  }
}


async function handleInvestmentPayout(firestore: ReturnType<typeof getFirestore>, finalTransaction: Transaction) {
    if (finalTransaction.type !== 'Investment' || !finalTransaction.investmentDetails) {
        return;
    }

    const { maturityDate, investedAmount, dailyReturn, durationDays, planName } = finalTransaction.investmentDetails;
    const profit = investedAmount * (dailyReturn / 100) * durationDays;
    const payoutAmount = investedAmount + profit;

    const maturityTimestamp = new Date(maturityDate).getTime();
    const nowTimestamp = new Date().getTime();
    const delay = Math.max(0, maturityTimestamp - nowTimestamp);

    setTimeout(async () => {
        try {
            await runTransaction(firestore, async (payoutTx) => {
                const userForPayoutRef = doc(firestore, 'users', finalTransaction.userId);
                const userForPayoutSnap = await payoutTx.get(userForPayoutRef);

                if (userForPayoutSnap.exists()) {
                    const payoutTransactionData: Omit<Transaction, 'id' | 'date'> = {
                        userId: finalTransaction.userId,
                        userName: finalTransaction.userName,
                        type: 'Payout',
                        amount: payoutAmount,
                        status: 'Completed',
                        details: `Matured investment from ${planName}`
                    };

                    const newBalance = userForPayoutSnap.data().balance + payoutAmount;
                    payoutTx.update(userForPayoutRef, { balance: newBalance });

                    const payoutDocRef = doc(collection(firestore, 'transactions'));
                    payoutTx.set(payoutDocRef, { ...payoutTransactionData, date: new Date().toISOString() });
                }
            });
        } catch (e) {
            console.error("Failed to process automatic payout:", e);
        }
    }, delay);
}

export async function updateTransactionStatus(firestore: ReturnType<typeof getFirestore>, transactionId: string, newStatus: 'Completed' | 'Failed') {
    
    await runTransaction(firestore, async (transaction) => {
        const transactionRef = doc(firestore, 'transactions', transactionId);
        const transactionSnap = await transaction.get(transactionRef);

        if (!transactionSnap.exists()) throw new Error("Transaction not found");
        
        const txData = transactionSnap.data() as Transaction;
        if (txData.status !== 'Pending') return;

        const userRef = doc(firestore, 'users', txData.userId);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User for transaction not found");

        const user = userSnap.data() as User;
        
        transaction.update(transactionRef, { status: newStatus });

        if (newStatus === 'Completed') {
            if (txData.type === 'Withdrawal') {
                 const withdrawalAmount = Math.abs(txData.amount);
                 const appSettingsDoc = await getDoc(doc(firestore, 'app', 'settings'));
                 const feePercentage = appSettingsDoc.data()?.withdrawalFee || 0;
                 const feeAmount = withdrawalAmount * (feePercentage / 100);
                 const finalAmount = withdrawalAmount + feeAmount;

                 if (user.balance < finalAmount) {
                     throw new Error(`Insufficient balance for withdrawal and fees. Required: $${finalAmount.toFixed(2)}`);
                 }
                
                transaction.update(userRef, { 
                    lastWithdrawalDate: new Date().toISOString(),
                    balance: user.balance - finalAmount
                });
            }

            if (txData.type === 'Deposit') {
                const newTotalDeposits = (user.totalDeposits || 0) + txData.amount;
                const newBalance = user.balance + txData.amount;
                let newVipLevel = user.vipLevel;
                let vipProgress = user.vipProgress;

                if (user.vipLevel < 3 && newTotalDeposits >= 500) newVipLevel = 3;
                else if (user.vipLevel < 2 && newTotalDeposits >= 100) newVipLevel = 2;

                if (newVipLevel === 1) vipProgress = (newTotalDeposits / 100) * 100;
                else if (newVipLevel === 2) vipProgress = ((newTotalDeposits - 100) / (500 - 100)) * 100;
                else if (newVipLevel === 3) vipProgress = ((newTotalDeposits - 500) / (1000 - 500)) * 100;

                transaction.update(userRef, { 
                    balance: newBalance, 
                    totalDeposits: newTotalDeposits, 
                    vipLevel: newVipLevel,
                    vipProgress: Math.min(100, Math.max(0, Math.floor(vipProgress)))
                });

                if (user.referredBy) {
                    const referrerRef = doc(firestore, 'users', user.referredBy);
                    const referrerSnap = await transaction.get(referrerRef);
                    if (referrerSnap.exists()) {
                        const referrer = referrerSnap.data() as User;
                        const commissionRate = referrer.role === 'partner' ? 0.10 : 0.05;
                        const commissionAmount = txData.amount * commissionRate;
                        transaction.update(referrerRef, { balance: referrer.balance + commissionAmount });

                        const commissionTxRef = doc(collection(firestore, 'transactions'));
                        transaction.set(commissionTxRef, {
                            userId: referrer.uid,
                            userName: referrer.displayName || 'N/A',
                            type: 'Commission',
                            amount: commissionAmount,
                            status: 'Completed',
                            date: new Date().toISOString(),
                            details: `From ${user.displayName}'s deposit`
                        });
                    }
                }
            }
        } else if (newStatus === 'Failed') {
            if (txData.type === 'Deposit') {
                const newFailedCount = (user.failedDepositCount || 0) + 1;
                const updates: Partial<User> = { failedDepositCount: newFailedCount };
                if (newFailedCount >= 5) updates.status = 'Suspended';
                transaction.update(userRef, updates);
            }
        }
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
