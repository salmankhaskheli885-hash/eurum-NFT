

// This file is now deprecated for storing live data.
// All data operations have been moved to src/lib/firestore.ts to use Firebase Firestore for persistence.
// We are keeping the type definitions and some initial mock data for seeding purposes if needed.

import { UserProfile } from "./schema";
import { type User as FirebaseUser } from "firebase/auth";

export type User = UserProfile & {
  status: 'Active' | 'Suspended';
  totalDeposits?: number;
  lastWithdrawalDate?: string;
  failedDepositCount?: number;
};

export type Transaction = {
  id: string;
  userId: string;
  userName: string;
  type: 'Deposit' | 'Withdrawal' | 'Investment' | 'Payout' | 'Commission';
  date: string; // ISO 8601 format
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
  assignedAgentId?: string; // UID of the agent assigned to handle the request
  receiptUrl?: string; // URL of the uploaded deposit receipt
  details?: string;
  withdrawalDetails?: {
    accountNumber: string;
    accountName: string;
    method: string;
    fee?: number; // Fee amount
  };
  investmentDetails?: {
    planId: string;
    planName: string;
    investedAmount: number;
    dailyReturn: number;
    durationDays: number;
    maturityDate: string; // ISO 8601 format
    isMatured: boolean;
  },
  kycDetails?: {
    cnicFrontUrl: string;
    cnicBackUrl: string;
    selfieUrl: string;
    mobileNumber: string;
  }
};

export type InvestmentPlan = {
  id: string; // Changed to string for Firestore
  name: string;
  dailyReturn: number;
  durationDays: number;
  minInvestment: number;
  requiredVipLevel: number;
  imageUrl: string;
  isActive: boolean; // To lock/unlock the plan
};

export type AppSettings = {
    adminWalletNumber: string;
    adminWalletName: string;
    adminAccountHolderName: string;
    withdrawalFee: number;
    minDeposit?: number;
    maxDeposit?: number;
    minWithdrawal?: number;
    maxWithdrawal?: number;
    lastAssignedAgentIndex?: number;
}

export type Announcement = {
    id: string; // Changed to string for Firestore
    message: string;
    date: string;
}

export type ChatAgent = {
    id?: string;
    uid?: string; // Keep this consistent with the user's main UID
    email: string;
    canApproveDeposits: boolean;
    canApproveWithdrawals: boolean;
    isActive: boolean; // To mark if agent is available for assignment
}

export type ChatRoom = {
    id: string;
    userId: string;
    userName: string;
    agentId?: string;
    agentName?: string;
    createdAt: string; // ISO 8601
    lastMessage: string;
    lastMessageAt: string; // ISO 8601
    isResolved: boolean;
    // Add user avatar if available
    userAvatar?: string;
}

export type ChatMessage = {
    id: string;
    roomId: string;
    senderId: string;
    senderType: 'user' | 'agent' | 'system';
    text: string;
    timestamp: string; // ISO 8601
}


// These are now just default values, the live values will be in Firestore.
export let appSettings: AppSettings = {
    adminWalletNumber: "0300-1234567",
    adminWalletName: "JazzCash",
    adminAccountHolderName: "Fynix Pro Admin",
    withdrawalFee: 2,
    minDeposit: 10,
    maxDeposit: 10000,
    minWithdrawal: 20,
    maxWithdrawal: 5000,
}

// These arrays are no longer the source of truth. They are empty.
export let mockAnnouncements: Announcement[] = [];
export let mockUsers: User[] = [];
export let mockTransactions: Transaction[] = [];
export let mockInvestmentPlans: InvestmentPlan[] = [];
export const mockReferredUsers: any[] = [];


// --- The following functions are now DEPRECATED and should not be used. ---
// --- All logic has been moved to src/lib/firestore.ts ---

export const addTransaction = (transactionData: Omit<Transaction, 'id' | 'date'>) => {
    console.warn("DEPRECATED: addTransaction from data.ts called. Use Firestore version.");
    return null;
};

export const updateTransactionStatus = (transactionId: string, newStatus: 'Completed' | 'Pending' | 'Failed') => {
    console.warn("DEPRECATED: updateTransactionStatus from data.ts called. Use Firestore version.");
    return false;
}

export const addInvestmentPlan = (plan: Omit<InvestmentPlan, 'id'>) => {
    console.warn("DEPRECATED: addInvestmentPlan from data.ts called. Use Firestore version.");
    return null;
}

export const updateInvestmentPlan = (planToUpdate: InvestmentPlan) => {
    console.warn("DEPRECATED: updateInvestmentPlan from data.ts called. Use Firestore version.");
    return false;
}

export const deleteInvestmentPlan = (planId: string) => {
    console.warn("DEPRECATED: deleteInvestmentPlan from data.ts called. Use Firestore version.");
    return false;
}

export const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    console.warn("DEPRECATED: updateAppSettings from data.ts called. Use Firestore version.");
    return appSettings;
}

export const addAnnouncement = (message: string) => {
    console.warn("DEPRECATED: addAnnouncement from data.ts called. Use Firestore version.");
    return null;
};

export const updateUser = (userId: string, updates: Partial<User>) => {
    console.warn("DEPRECATED: updateUser from data.ts called. Use Firestore version.");
    return false;
}

export const deleteUser = (userId: string) => {
    console.warn("DEPRECATED: deleteUser from data.ts called. Use Firestore version.");
    return false;
}

export function getUserById(userId: string): User | null {
     console.warn("DEPRECATED: getUserById from data.ts called. Use Firestore version.");
    return null;
}

export function getOrCreateUser(firebaseUser: FirebaseUser): User {
     console.warn("DEPRECATED: getOrCreateUser from data.ts called. Use Firestore version.");
     // Return a default object to avoid breaking the app immediately
     return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: 'user',
        shortUid: firebaseUser.uid.substring(0, 8),
        balance: 0,
        currency: 'USD',
        vipLevel: 1,
        vipProgress: 0,
        kycStatus: 'unsubmitted',
        referralLink: `https://fynix.pro/ref/${firebaseUser.uid.substring(0, 8)}`,
        status: 'Active',
        referredBy: undefined,
        totalDeposits: 0,
        failedDepositCount: 0
    };
}
