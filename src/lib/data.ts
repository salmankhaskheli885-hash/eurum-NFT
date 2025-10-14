
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
  { id: "user-1", name: "Alice", totalDeposit: 15000, status: "Active" },
  { id: "user-2", name: "Bob", totalDeposit: 30550, status: "Active" },
  { id: "user-3", name: "Charlie", totalDeposit: 9520, status: "Inactive" },
  { id: "user-4", name: "David", totalDeposit: 75000, status: "Active" },
  { id: "user-5", name: "Eve", totalDeposit: 12000, status: "Active" },
];


// Function to add a new transaction to the mock data
export const addTransaction = (transactionData: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
        ...transactionData,
        id: `TXN${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        date: new Date().toISOString().split('T')[0]
    };
    
    // Update user balance for withdrawals and investments immediately
    const user = mockUsers.find(u => u.uid === newTransaction.userId);
    if (user && newTransaction.amount < 0) {
        user.balance += newTransaction.amount; // amount is negative
    }

    mockTransactions.unshift(newTransaction);
};

export const updateTransactionStatus = (transactionId: string, newStatus: 'Completed' | 'Pending' | 'Failed') => {
    const transaction = mockTransactions.find(tx => tx.id === transactionId);
    if (!transaction) return false;

    const oldStatus = transaction.status;
    transaction.status = newStatus;

    // Logic to update user balance on status change
    if (oldStatus === 'Pending' && newStatus === 'Completed') {
        const user = mockUsers.find(u => u.uid === transaction.userId);
        if (user) {
            // Only add deposit amount, withdrawal/investment is pre-deducted
            if (transaction.type === 'Deposit') {
                 user.balance += transaction.amount;
            }
        }
    } else if (oldStatus === 'Pending' && newStatus === 'Failed') {
        // If a withdrawal or investment fails, refund the user
        const user = mockUsers.find(u => u.uid === transaction.userId);
        if (user && transaction.amount < 0) {
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
    mockUsers.push(user);
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

// Helper to get a user, creating them if they don't exist
export function getOrCreateUser(firebaseUser: FirebaseUser): User {
    let user = mockUsers.find(u => u.uid === firebaseUser.uid);
    if (user) {
        // Return a copy to avoid direct mutation of the mock data from client components
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
        balance: 10000, // Default starting values in USD
        currency: 'USD',
        vipLevel: 1,
        vipProgress: 0,
        kycStatus: 'unsubmitted',
        referralLink: `https://fynix.pro/ref/${firebaseUser.uid.substring(0, 8)}`,
        status: 'Active',
    };

    addUser(newUser);
    // Return a copy
    return { ...newUser };
}

    