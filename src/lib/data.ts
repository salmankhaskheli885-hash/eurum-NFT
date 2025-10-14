

export type User = {
  name: string;
  email: string;
  uid: string;
  shortUid: string;
  balance: number;
  currency: string;
  vipLevel: number;
  vipProgress: number; // Percentage
  kycStatus: 'approved' | 'pending' | 'rejected' | 'unsubmitted';
  referralLink: string;
};

export type Transaction = {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Investment';
  date: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
};

export type InvestmentPlan = {
  id: number;
  name: string;
  dailyReturn: number;
  durationDays: number;
  minInvestment: number;
  maxInvestment: number;
  requiredVipLevel: number;
};

export type AppSettings = {
    adminWalletNumber: string;
    adminWalletName: string;
    adminAccountHolderName: string;
    withdrawalFee: string;
}

export let appSettings: AppSettings = {
    adminWalletNumber: "0300-1234567",
    adminWalletName: "JazzCash",
    adminAccountHolderName: "Fynix Pro Admin",
    withdrawalFee: "2"
}

export const mockUser: User = {
  name: 'Satoshi Nakamoto',
  email: 'satoshi@fynix.pro',
  uid: 'abc-123-def-456-ghi-789',
  shortUid: 'a1b2c3d4',
  balance: 133742.00,
  currency: 'PKR',
  vipLevel: 2,
  vipProgress: 65,
  kycStatus: 'approved',
  referralLink: 'https://fynix.pro/ref/a1b2c3d4',
};

export let mockTransactions: Transaction[] = [
  { id: 'TXN789012', type: 'Deposit', date: '2023-10-26', amount: 50000, status: 'Completed' },
  { id: 'TXN456789', type: 'Investment', date: '2023-10-25', amount: -25000, status: 'Completed' },
  { id: 'TXN123456', type: 'Withdrawal', date: '2023-10-24', amount: -10000, status: 'Pending' },
  { id: 'TXN987654', type: 'Deposit', date: '2023-10-23', amount: 100000, status: 'Pending' },
  { id: 'TXN654321', type: 'Investment', date: '2023-10-22', amount: -50000, status: 'Failed' },
];

export let mockInvestmentPlans: InvestmentPlan[] = [
  { id: 1, name: 'Starter Pack', dailyReturn: 0.5, durationDays: 30, minInvestment: 5000, maxInvestment: 50000, requiredVipLevel: 1 },
  { id: 2, name: 'Growth Engine', dailyReturn: 0.75, durationDays: 45, minInvestment: 50001, maxInvestment: 250000, requiredVipLevel: 1 },
  { id: 3, name: 'Momentum Builder', dailyReturn: 1.0, durationDays: 60, minInvestment: 250001, maxInvestment: 1000000, requiredVipLevel: 2 },
  { id: 4, name: 'Wealth Accelerator', dailyReturn: 1.25, durationDays: 75, minInvestment: 1000001, maxInvestment: 5000000, requiredVipLevel: 3 },
  { id: 5, name: 'Pro Trader', dailyReturn: 1.5, durationDays: 90, minInvestment: 5000001, maxInvestment: 10000000, requiredVipLevel: 4 },
  { id: 6, name: 'Whale Fund', dailyReturn: 2.0, durationDays: 120, minInvestment: 10000001, maxInvestment: 50000000, requiredVipLevel: 5 },
];

export const mockReferredUsers = [
  { id: "user-1", name: "Alice", totalDeposit: 15000, status: "Active" },
  { id: "user-2", name: "Bob", totalDeposit: 30550, status: "Active" },
  { id: "user-3", name: "Charlie", totalDeposit: 9520, status: "Inactive" },
  { id: "user-4", name: "David", totalDeposit: 75000, status: "Active" },
  { id: "user-5", name: "Eve", totalDeposit: 12000, status: "Active" },
];


// Function to add a new transaction to the mock data
export const addTransaction = (transaction: Transaction) => {
  mockTransactions.unshift(transaction);
};

export const updateTransactionStatus = (transactionId: string, newStatus: 'Completed' | 'Pending' | 'Failed') => {
    const transaction = mockTransactions.find(tx => tx.id === transactionId);
    if (transaction) {
        transaction.status = newStatus;
        return true;
    }
    return false;
}

// Functions to manage investment plans
export const addInvestmentPlan = (plan: Omit<InvestmentPlan, 'id'>) => {
    const newPlan = { ...plan, id: Date.now() };
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
