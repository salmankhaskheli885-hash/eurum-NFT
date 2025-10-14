
import { UserProfile } from "./schema";
import { type User as FirebaseUser } from "firebase/auth";


export type User = UserProfile & {
  status: 'Active' | 'Suspended';
};

export type Transaction = {
  id: string;
  userId: string;
  userName: string;
  type: 'Deposit' | 'Withdrawal' | 'Investment';
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  details?: string;
  withdrawalDetails?: {
    accountNumber: string;
    accountName: string;
    method: string;
  }
};

export type InvestmentPlan = {
  id: number;
  name: string;
  dailyReturn: number;
  durationDays: number;
  minInvestment: number;
  maxInvestment: number;
  requiredVipLevel: number;
  imageUrl: string;
};

export type AppSettings = {
    adminWalletNumber: string;
    adminWalletName: string;
    adminAccountHolderName: string;
    withdrawalFee: string;
}

export type Announcement = {
    id: number;
    message: string;
    date: string;
}

export let appSettings: AppSettings = {
    adminWalletNumber: "0300-1234567",
    adminWalletName: "JazzCash",
    adminAccountHolderName: "Fynix Pro Admin",
    withdrawalFee: "2"
}

export let mockAnnouncements: Announcement[] = [];

// Starting all data from zero as requested
export let mockUsers: User[] = [];

export let mockTransactions: Transaction[] = [];

export let mockInvestmentPlans: InvestmentPlan[] = [];

export const mockReferredUsers = [
  // This can remain as is, as it's not managed by the admin panel directly.
];


// Function to add a new transaction to the mock data
export const addTransaction = (transactionData: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
        ...transactionData,
        id: `TXN${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        date: new Date().toISOString().split('T')[0]
    };
    
    const user = mockUsers.find(u => u.uid === newTransaction.userId);
    if (user && newTransaction.amount < 0) { // For withdrawals and investments
        if (user.balance >= Math.abs(newTransaction.amount)) {
            user.balance += newTransaction.amount; // amount is negative, so it deducts
        } else {
            console.error("Transaction failed: Insufficient balance.");
            return null; // Indicate failure
        }
    }

    mockTransactions.unshift(newTransaction);
    return newTransaction; // Indicate success
};

export const updateTransactionStatus = (transactionId: string, newStatus: 'Completed' | 'Pending' | 'Failed') => {
    const transaction = mockTransactions.find(tx => tx.id === transactionId);
    if (!transaction) return false;

    const oldStatus = transaction.status;
    transaction.status = newStatus;

    if (oldStatus === 'Pending' && newStatus === 'Completed') {
        const user = mockUsers.find(u => u.uid === transaction.userId);
        if (user) {
            if (transaction.type === 'Deposit') {
                 user.balance += transaction.amount;
            }
            // For withdrawals, the amount is already deducted at the time of request.
        }
    } else if (oldStatus === 'Pending' && newStatus === 'Failed') {
        const user = mockUsers.find(u => u.uid === transaction.userId);
        if (user && (transaction.type === 'Withdrawal' || transaction.type === 'Investment')) {
            // Refund the user if a withdrawal or investment fails.
            user.balance -= transaction.amount; // amount is negative, so this adds it back
        }
    }
    
    return true;
}

// Functions to manage investment plans
export const addInvestmentPlan = (plan: Omit<InvestmentPlan, 'id'>) => {
    const newPlan: InvestmentPlan = { 
        ...plan, 
        id: Date.now(),
        imageUrl: plan.imageUrl || 'https://picsum.photos/seed/default/600/400'
    };
    mockInvestmentPlans.push(newPlan);
    return newPlan;
}

export const updateInvestmentPlan = (planToUpdate: InvestmentPlan) => {
    const index = mockInvestmentPlans.findIndex(p => p.id === planToUpdate.id);
    if (index !== -1) {
        mockInvestmentPlans[index] = planToUpdate;
        return true;
    }
    return false;
}

export const deleteInvestmentPlan = (planId: number) => {
    const initialLength = mockInvestmentPlans.length;
    mockInvestmentPlans = mockInvestmentPlans.filter(p => p.id !== planId);
    return mockInvestmentPlans.length < initialLength;
}

// Function to update global app settings
export const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    appSettings = { ...appSettings, ...newSettings };
    return appSettings;
}

// Function to add a new announcement
export const addAnnouncement = (message: string) => {
    const newAnnouncement: Announcement = {
        id: Date.now(),
        message,
        date: new Date().toISOString(),
    };
    mockAnnouncements.unshift(newAnnouncement); // Add to the beginning of the array
    return newAnnouncement;
};

// --- New User Management Functions for Admin ---

export const addUser = (user: User) => {
    if (!mockUsers.some(u => u.uid === user.uid)) {
      mockUsers.push(user);
    }
};

export const updateUser = (userId: string, updates: Partial<User>) => {
    const userIndex = mockUsers.findIndex(u => u.uid === userId);
    if (userIndex !== -1) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
        return true;
    }
    return false;
}

export const deleteUser = (userId: string) => {
    const initialLength = mockUsers.length;
    mockUsers = mockUsers.filter(u => u.uid !== userId);
    return mockUsers.length < initialLength;
}

// Helper to get a user by their ID
export function getUserById(userId: string): User | null {
    const user = mockUsers.find(u => u.uid === userId);
    return user ? { ...user } : null;
}


// Helper to get a user, creating them if they don't exist
export function getOrCreateUser(firebaseUser: FirebaseUser): User {
    let user = mockUsers.find(u => u.uid === firebaseUser.uid);
    if (user) {
        return { ...user };
    }

    const isAdmin = firebaseUser.email === 'salmankhaskheli885@gmail.com';
    const isPartner = firebaseUser.email === 'vitalik@fynix.pro';
    let role: UserProfile['role'] = 'user';
    if (isAdmin) role = 'admin';
    else if (isPartner) role = 'partner';

    const newUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: role,
        shortUid: firebaseUser.uid.substring(0, 8),
        balance: 0, // Default starting balance is 0
        currency: 'USD',
        vipLevel: 1,
        vipProgress: 0,
        kycStatus: 'unsubmitted',
        referralLink: `https://fynix.pro/ref/${firebaseUser.uid.substring(0, 8)}`,
        status: 'Active',
    };

    addUser(newUser);
    return { ...newUser };
}

    