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

export const mockUser: User = {
  name: 'Satoshi Nakamoto',
  email: 'satoshi@fynix.pro',
  uid: 'abc-123-def-456-ghi-789',
  shortUid: 'a1b2c3d4',
  balance: 1337.42,
  currency: 'USD',
  vipLevel: 2,
  vipProgress: 65,
  kycStatus: 'approved',
  referralLink: 'https://fynix.pro/ref/a1b2c3d4',
};

export const mockTransactions: Transaction[] = [
  { id: 'TXN789012', type: 'Deposit', date: '2023-10-26', amount: 500, status: 'Completed' },
  { id: 'TXN456789', type: 'Investment', date: '2023-10-25', amount: -250, status: 'Completed' },
  { id: 'TXN123456', type: 'Withdrawal', date: '2023-10-24', amount: -100, status: 'Completed' },
  { id: 'TXN987654', type: 'Deposit', date: '2023-10-23', amount: 1000, status: 'Completed' },
  { id: 'TXN654321', type: 'Investment', date: '2023-10-22', amount: -500, status: 'Failed' },
];

export const mockInvestmentPlans: InvestmentPlan[] = [
  { id: 1, name: 'Starter Pack', dailyReturn: 0.5, durationDays: 30, minInvestment: 50, maxInvestment: 500, requiredVipLevel: 1 },
  { id: 2, name: 'Growth Engine', dailyReturn: 0.75, durationDays: 45, minInvestment: 501, maxInvestment: 2500, requiredVipLevel: 1 },
  { id: 3, name: 'Momentum Builder', dailyReturn: 1.0, durationDays: 60, minInvestment: 2501, maxInvestment: 10000, requiredVipLevel: 2 },
  { id: 4, name: 'Wealth Accelerator', dailyReturn: 1.25, durationDays: 75, minInvestment: 10001, maxInvestment: 50000, requiredVipLevel: 3 },
  { id: 5, name: 'Pro Trader', dailyReturn: 1.5, durationDays: 90, minInvestment: 50001, maxInvestment: 100000, requiredVipLevel: 4 },
  { id: 6, name: 'Whale Fund', dailyReturn: 2.0, durationDays: 120, minInvestment: 100001, maxInvestment: 500000, requiredVipLevel: 5 },
];
