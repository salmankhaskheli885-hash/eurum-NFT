
export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'partner' | 'admin';
  shortUid: string;
  balance: number;
  currency: string;
  vipLevel: number;
  vipProgress: number; // Percentage
  kycStatus: 'approved' | 'pending' | 'rejected' | 'unsubmitted';
  referralLink: string;
};
