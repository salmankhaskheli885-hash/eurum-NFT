
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
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User, InvestmentPlan, Transaction, AppSettings, Announcement } from './data';
import { useFirestore } from '@/firebase/provider';


// Helper function to get the firestore instance
const db = () => {
    const firestore = useFirestore();
    if (!firestore) {
        throw new Error("Firestore not initialized. Make sure you are using the FirebaseProvider.");
    }
    return firestore;
}

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

export async function getUserById(firestore: ReturnType<typeof getFirestore>, userId: string): Promise<User | null> {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() as User : null;
}

export async function getAllUsers(firestore: ReturnType<typeof getFirestore>): Promise<User[]> {
    const usersCollection = collection(firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.docs.map(doc => doc.data() as User);
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
export async function addTransaction(firestore: ReturnType<typeof getFirestore>, transactionData: Omit<Transaction, 'id' | 'date'>): Promise<Transaction | null> {
    const userRef = doc(firestore, 'users', transactionData.userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error("User not found for transaction");
        return null;
    }
    
    const user = userSnap.data() as User;
    const batch = writeBatch(firestore);

    // Deduct balance for withdrawals or investments
    if (transactionData.amount < 0) {
        if (user.balance < Math.abs(transactionData.amount)) {
            console.error("Transaction failed: Insufficient balance.");
            throw new Error("Insufficient Balance");
        }
        batch.update(userRef, { balance: user.balance + transactionData.amount });
    }

    const newTransaction: Omit<Transaction, 'id'> = {
        ...transactionData,
        date: new Date().toISOString().split('T')[0]
    };
    
    const transactionsCollection = collection(firestore, 'transactions');
    const newDocRef = doc(transactionsCollection); // Creates a new doc with a random ID
    batch.set(newDocRef, newTransaction);
    
    await batch.commit();

    return { ...newTransaction, id: newDocRef.id };
}


export async function updateTransactionStatus(firestore: ReturnType<typeof getFirestore>, transactionId: string, newStatus: 'Completed' | 'Failed') {
    const transactionRef = doc(firestore, 'transactions', transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (!transactionSnap.exists()) return false;
    
    const transaction = transactionSnap.data() as Transaction;
    const oldStatus = transaction.status;

    if (oldStatus !== 'Pending') return false; // Can only change status of pending transactions

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
            batch.update(userRef, { balance: user.balance - transaction.amount }); // amount is negative, so this adds it back
        }
    }

    await batch.commit();
    return true;
}


export async function getAllTransactions(firestore: ReturnType<typeof getFirestore>): Promise<Transaction[]> {
    const transactionsCollection = collection(firestore, 'transactions');
    const q = query(transactionsCollection, orderBy("date", "desc"));
    const transactionsSnapshot = await getDocs(q);
    return transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
}

// INVESTMENT PLAN FUNCTIONS (CRUD)
export async function addInvestmentPlan(firestore: ReturnType<typeof getFirestore>, plan: Omit<InvestmentPlan, 'id'>): Promise<InvestmentPlan> {
    const plansCollection = collection(firestore, 'investment_plans');
    const newDocRef = await addDoc(plansCollection, plan);
    return { ...plan, id: newDocRef.id };
}

export async function updateInvestmentPlan(firestore: ReturnType<typeof getFirestore>, planToUpdate: InvestmentPlan) {
    const planRef = doc(firestore, 'investment_plans', planToUpdate.id);
    // Don't pass the ID into the document data
    const { id, ...planData } = planToUpdate;
    await setDoc(planRef, planData, { merge: true });
}

export async function deleteInvestmentPlan(firestore: ReturnType<typeof getFirestore>, planId: string) {
    const planRef = doc(firestore, 'investment_plans', planId);
    await deleteDoc(planRef);
}

export async function getAllInvestmentPlans(firestore: ReturnType<typeof getFirestore>): Promise<InvestmentPlan[]> {
    const plansCollection = collection(firestore, 'investment_plans');
    const plansSnapshot = await getDocs(plansCollection);
    return plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentPlan));
}

// APP SETTINGS FUNCTIONS
export async function getAppSettings(firestore: ReturnType<typeof getFirestore>): Promise<AppSettings> {
    const settingsRef = doc(firestore, 'app', 'settings');
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
        return settingsSnap.data() as AppSettings;
    }
    // Return default settings if not found in DB
    return {
        adminWalletNumber: "0300-1234567",
        adminWalletName: "JazzCash",
        adminAccountHolderName: "Fynix Pro Admin",
        withdrawalFee: "2"
    };
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

export async function getLatestAnnouncement(firestore: ReturnType<typeof getFirestore>): Promise<Announcement | null> {
    const announcementsCollection = collection(firestore, 'announcements');
    const q = query(announcementsCollection, orderBy("date", "desc"), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Announcement;
}
