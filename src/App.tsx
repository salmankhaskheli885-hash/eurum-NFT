import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';

// Import all the page components
import LoginPage from './app/login/page';
import RegisterPage from './app/register/page';
import SelectPanelPage from './app/admin/select-panel/page';
import SystemArchitecturePage from './app/system-architecture/page';

// User Dashboard Layout and Pages
import DashboardLayout from './app/dashboard/layout';
import DashboardPage from './app/dashboard/page';
import DepositPage from './app/dashboard/deposit/page';
import InvestmentsPage from './app/dashboard/investments/page';
import KycPage from './app/dashboard/kyc/page';
import ProfilePage from './app/dashboard/profile/page';
import ReferralsPage from './app/dashboard/referrals/page';
import SettingsPage from './app/dashboard/settings/page';
import TransactionsPage from './app/dashboard/transactions/page';
import WithdrawPage from './app/dashboard/withdraw/page';

// Partner Layout and Pages
import PartnerLayout from './app/partner/layout';
import PartnerDashboardPage from './app/partner/page';
import PartnerDepositPage from './app/partner/deposit/page';
import PartnerKycPage from './app/partner/kyc/page';
import PartnerProfilePage from './app/partner/profile/page';
import PartnerReferralsPage from './app/partner/referrals/page';
import PartnerSettingsPage from './app/partner/settings/page';
import PartnerTransactionsPage from './app/partner/transactions/page';
import PartnerWithdrawPage from './app/partner/withdraw/page';

// Admin Layout and Pages
import AdminLayout from './app/admin/layout';
import AdminDashboardPage from './app/admin/page';
import AdminAgentsPage from './app/admin/agents/page';
import AdminDepositsPage from './app/admin/deposits/page';
import AdminDepositsHistoryPage from './app/admin/deposits/history/page';
import AdminInvestmentsPage from './app/admin/investments/page';
import AdminKycPage from './app/admin/kyc/page';
import AdminKycHistoryPage from './app/admin/kyc/history/page';
import AdminSecurityPage from './app/admin/security/page';
import AdminSettingsPage from './app/admin/settings/page';
import AdminTasksPage from './app/admin/tasks/page';
import AdminUserDetailsPage from './app/admin/users/[userId]/page';
import AdminUsersPage from './app/admin/users/page';
import AdminWithdrawalsPage from './app/admin/withdrawals/page';
import AdminWithdrawalsHistoryPage from './app/admin/withdrawals/history/page';

// Agent Layout and Pages
import AgentLayout from './app/agent/layout';
import AgentDashboardPage from './app/agent/page';
import AgentDepositsPage from './app/agent/deposits/page';
import AgentHistoryPage from './app/agent/history/page';
import AgentProfilePage from './app/agent/profile/page';
import AgentWithdrawalsPage from './app/agent/withdrawals/page';

function App() {
  return (
    <LanguageProvider>
      <FirebaseClientProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/system-architecture" element={<SystemArchitecturePage />} />
            
            {/* User Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
            <Route path="/dashboard/deposit" element={<DashboardLayout><DepositPage /></DashboardLayout>} />
            <Route path="/dashboard/investments" element={<DashboardLayout><InvestmentsPage /></DashboardLayout>} />
            <Route path="/dashboard/kyc" element={<DashboardLayout><KycPage /></DashboardLayout>} />
            <Route path="/dashboard/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
            <Route path="/dashboard/referrals" element={<DashboardLayout><ReferralsPage /></DashboardLayout>} />
            <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
            <Route path="/dashboard/transactions" element={<DashboardLayout><TransactionsPage /></DashboardLayout>} />
            <Route path="/dashboard/withdraw" element={<DashboardLayout><WithdrawPage /></DashboardLayout>} />

            {/* Partner Routes */}
            <Route path="/partner" element={<PartnerLayout><PartnerDashboardPage /></PartnerLayout>} />
            <Route path="/partner/deposit" element={<PartnerLayout><PartnerDepositPage /></PartnerLayout>} />
            <Route path="/partner/kyc" element={<PartnerLayout><PartnerKycPage /></PartnerLayout>} />
            <Route path="/partner/profile" element={<PartnerLayout><PartnerProfilePage /></PartnerLayout>} />
            <Route path="/partner/referrals" element={<PartnerLayout><PartnerReferralsPage /></PartnerLayout>} />
            <Route path="/partner/settings" element={<PartnerLayout><PartnerSettingsPage /></PartnerLayout>} />
            <Route path="/partner/transactions" element={<PartnerLayout><PartnerTransactionsPage /></PartnerLayout>} />
            <Route path="/partner/withdraw" element={<PartnerLayout><PartnerWithdrawPage /></PartnerLayout>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
            <Route path="/admin/select-panel" element={<SelectPanelPage />} />
            <Route path="/admin/agents" element={<AdminLayout><AdminAgentsPage /></AdminLayout>} />
            <Route path="/admin/deposits" element={<AdminLayout><AdminDepositsPage /></AdminLayout>} />
            <Route path="/admin/deposits/history" element={<AdminLayout><AdminDepositsHistoryPage /></AdminLayout>} />
            <Route path="/admin/investments" element={<AdminLayout><AdminInvestmentsPage /></AdminLayout>} />
            <Route path="/admin/kyc" element={<AdminLayout><AdminKycPage /></AdminLayout>} />
            <Route path="/admin/kyc/history" element={<AdminLayout><AdminKycHistoryPage /></AdminLayout>} />
            <Route path="/admin/security" element={<AdminLayout><AdminSecurityPage /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><AdminSettingsPage /></AdminLayout>} />
            <Route path="/admin/tasks" element={<AdminLayout><AdminTasksPage /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminUsersPage /></AdminLayout>} />
            <Route path="/admin/users/:userId" element={<AdminLayout><AdminUserDetailsPage /></AdminLayout>} />
            <Route path="/admin/withdrawals" element={<AdminLayout><AdminWithdrawalsPage /></AdminLayout>} />
            <Route path="/admin/withdrawals/history" element={<AdminLayout><AdminWithdrawalsHistoryPage /></AdminLayout>} />

             {/* Agent Routes */}
            <Route path="/agent" element={<AgentLayout><AgentDashboardPage /></AgentLayout>} />
            <Route path="/agent/deposits" element={<AgentLayout><AgentDepositsPage /></AgentLayout>} />
            <Route path="/agent/history" element={<AgentLayout><AgentHistoryPage /></AgentLayout>} />
            <Route path="/agent/profile" element={<AgentLayout><AgentProfilePage /></AgentLayout>} />
            <Route path="/agent/withdrawals" element={<AgentLayout><AgentWithdrawalsPage /></AgentLayout>} />

          </Routes>
        </Router>
        <Toaster />
      </FirebaseClientProvider>
    </LanguageProvider>
  );
}

export default App;
