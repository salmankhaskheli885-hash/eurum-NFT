
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
  serverTimestamp
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
    const userRef = doc(firestore, 'users', transactionData.userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error("User not found for transaction");
        return null;
    }
    
    const user = userSnap.data() as User;
    const batch = writeBatch(firestore);
    
    let amountToDeduct = transactionData.amount;
    let finalTransactionData = { ...transactionData };

    if (transactionData.type === 'Withdrawal') {
      const settingsRef = doc(firestore, 'app', 'settings');
      const settingsSnap = await getDoc(settingsRef);
      const feePercentage = settingsSnap.exists() ? parseFloat(settingsSnap.data().withdrawalFee) : 2;
      const feeAmount = Math.abs(transactionData.amount) * (feePercentage / 100);
      amountToDeduct = transactionData.amount - feeAmount;

      if (user.balance < Math.abs(amountToDeduct)) {
          throw new Error(`Insufficient Balance. You need at least $${Math.abs(amountToDeduct).toFixed(2)} (including fee) to withdraw.`);
      }

      finalTransactionData.withdrawalDetails = {
          ...transactionData.withdrawalDetails!,
          fee: feeAmount
      };
    } else if (transactionData.type === 'Investment') {
        if (user.balance < Math.abs(transactionData.amount)) {
            throw new Error("Insufficient Balance");
        }
    }
    
    const newBalance = user.balance + amountToDeduct;
    batch.update(userRef, { balance: newBalance });

    const newTransactionDataWithDate: Omit<Transaction, 'id'> = {
        ...finalTransactionData,
        amount: amountToDeduct, // Store the amount including the fee for withdrawals
        date: new Date().toISOString().split('T')[0]
    };
    
    const transactionsCollection = collection(firestore, 'transactions');
    const newDocRef = doc(transactionsCollection);
    batch.set(newDocRef, newTransactionDataWithDate);
    
    const newTransaction = { ...newTransactionDataWithDate, id: newDocRef.id } as Transaction;

    // SIMULATE AUTOMATIC PAYOUT FOR INVESTMENTS
    if (newTransaction.type === 'Investment' && newTransaction.investmentDetails) {
      const { maturityDate, investedAmount, dailyReturn, durationDays, planName } = newTransaction.investmentDetails;
      const profit = investedAmount * (dailyReturn / 100) * durationDays;
      const payoutAmount = investedAmount + profit;

      const maturityTimestamp = new Date(maturityDate).getTime();
      const nowTimestamp = new Date().getTime();
      const delay = maturityTimestamp - nowTimestamp;

      // This timeout simulates a server-side cron job. 
      // In a real app, you'd use a Cloud Function triggered by a schedule.
      if (delay > 0) {
        setTimeout(async () => {
          try {
            const payoutTransaction: Omit<Transaction, 'id' | 'date'> = {
              userId: newTransaction.userId,
              userName: newTransaction.userName,
              type: 'Payout',
              amount: payoutAmount,
              status: 'Completed',
              details: `Matured investment from ${planName}`
            };
            
            // Add the payout transaction and update balance
            const payoutUserRef = doc(firestore, 'users', newTransaction.userId);
            const payoutUserSnap = await getDoc(payoutUserRef);
            if (payoutUserSnap.exists()) {
              const currentBalance = payoutUserSnap.data().balance;
              const payoutBatch = writeBatch(firestore);
              
              const payoutDocRef = doc(collection(firestore, 'transactions'));
              payoutBatch.set(payoutDocRef, { ...payoutTransaction, date: new Date().toISOString().split('T')[0] });
              payoutBatch.update(payoutUserRef, { balance: currentBalance + payoutAmount });
              
              await payoutBatch.commit();
            }
          } catch(e) {
            console.error("Failed to process automatic payout:", e);
          }
        }, delay);
      }
    }
    
    await batch.commit();

    return newTransaction;
}


export async function updateTransactionStatus(firestore: ReturnType<typeof getFirestore>, transactionId: string, newStatus: 'Completed' | 'Failed') {
    const transactionRef = doc(firestore, 'transactions', transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (!transactionSnap.exists()) return false;
    
    const transaction = transactionSnap.data() as Transaction;
    const oldStatus = transaction.status;

    if (oldStatus !== 'Pending') return false; 

    const batch = writeBatch(firestore);
    batch.update(transactionRef, { status: newStatus });

    const userRef = doc(firestore, 'users', transaction.userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const user = userSnap.data() as User;
        if (newStatus === 'Completed' && transaction.type === 'Deposit') {
            batch.update(userRef, { balance: user.balance + transaction.amount });
        } else if (newStatus === 'Failed' && (transaction.type === 'Withdrawal' || transaction.type === 'Investment')) {
            // Refund the user if a withdrawal or investment fails
            batch.update(userRef, { balance: user.balance - transaction.amount });
        }
    }

    await batch.commit();
    return true;
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
