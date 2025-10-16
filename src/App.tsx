import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Loader2 } from 'lucide-react';

// Import all the page components
const LoginPage = React.lazy(() => import('./app/login/page'));
const RegisterPage = React.lazy(() => import('./app/register/page'));
const SelectPanelPage = React.lazy(() => import('./app/admin/select-panel/page'));
const SystemArchitecturePage = React.lazy(() => import('./app/system-architecture/page'));

// User Dashboard Layout and Pages
const DashboardLayout = React.lazy(() => import('./app/dashboard/layout'));
const DashboardPage = React.lazy(() => import('./app/dashboard/page'));
const DepositPage = React.lazy(() => import('./app/dashboard/deposit/page'));
const InvestmentsPage = React.lazy(() => import('./app/dashboard/investments/page'));
const KycPage = React.lazy(() => import('./app/dashboard/kyc/page'));
const ProfilePage = React.lazy(() => import('./app/dashboard/profile/page'));
const ReferralsPage = React.lazy(() => import('./app/dashboard/referrals/page'));
const SettingsPage = React.lazy(() => import('./app/dashboard/settings/page'));
const TransactionsPage = React.lazy(() => import('./app/dashboard/transactions/page'));
const WithdrawPage = React.lazy(() => import('./app/dashboard/withdraw/page'));

// Partner Layout and Pages
const PartnerLayout = React.lazy(() => import('./app/partner/layout'));
const PartnerDashboardPage = React.lazy(() => import('./app/partner/page'));
const PartnerDepositPage = React.lazy(() => import('./app/partner/deposit/page'));
const PartnerKycPage = React.lazy(() => import('./app/partner/kyc/page'));
const PartnerProfilePage = React.lazy(() => import('./app/partner/profile/page'));
const PartnerReferralsPage = React.lazy(() => import('./app/partner/referrals/page'));
const PartnerSettingsPage = React.lazy(() => import('./app/partner/settings/page'));
const PartnerTransactionsPage = React.lazy(() => import('./app/partner/transactions/page'));
const PartnerWithdrawPage = React.lazy(() => import('./app/partner/withdraw/page'));

// Admin Layout and Pages
const AdminLayout = React.lazy(() => import('./app/admin/layout'));
const AdminDashboardPage = React.lazy(() => import('./app/admin/page'));
const AdminAgentsPage = React.lazy(() => import('./app/admin/agents/page'));
const AdminDepositsPage = React.lazy(() => import('./app/admin/deposits/page'));
const AdminDepositsHistoryPage = React.lazy(() => import('./app/admin/deposits/history/page'));
const AdminInvestmentsPage = React.lazy(() => import('./app/admin/investments/page'));
const AdminKycPage = React.lazy(() => import('./app/admin/kyc/page'));
const AdminKycHistoryPage = React.lazy(() => import('./app/admin/kyc/history/page'));
const AdminSecurityPage = React.lazy(() => import('./app/admin/security/page'));
const AdminSettingsPage = React.lazy(() => import('./app/admin/settings/page'));
const AdminTasksPage = React.lazy(() => import('./app/admin/tasks/page'));
const AdminUserDetailsPage = React.lazy(() => import('./app/admin/users/[userId]/page'));
const AdminUsersPage = React.lazy(() => import('./app/admin/users/page'));
const AdminWithdrawalsPage = React.lazy(() => import('./app/admin/withdrawals/page'));
const AdminWithdrawalsHistoryPage = React.lazy(() => import('./app/admin/withdrawals/history/page'));

// Agent Layout and Pages
const AgentLayout = React.lazy(() => import('./app/agent/layout'));
const AgentDashboardPage = React.lazy(() => import('./app/agent/page'));
const AgentDepositsPage = React.lazy(() => import('./app/agent/deposits/page'));
const AgentHistoryPage = React.lazy(() => import('./app/agent/history/page'));
const AgentProfilePage = React.lazy(() => import('./app/agent/profile/page'));
const AgentWithdrawalsPage = React.lazy(() => import('./app/agent/withdrawals/page'));

function App() {
  return (
    <LanguageProvider>
      <FirebaseClientProvider>
        <Router>
            <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-20 w-20 animate-spin text-primary" /></div>}>
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
            </Suspense>
        </Router>
        <Toaster />
      </FirebaseClientProvider>
    </LanguageProvider>
  );
}

export default App;
