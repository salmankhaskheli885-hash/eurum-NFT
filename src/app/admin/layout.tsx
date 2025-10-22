
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileCog,
  LogOut,
  Settings,
  User,
  Handshake,
  UserCheck,
  MessageSquare,
  ListChecks,
  ArrowDownToLine,
  ArrowUpFromLine
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge
} from "@/components/ui/sidebar"
import { Logo } from "@/components/icons"
import { UserNav } from "@/components/user-nav"
import { useTranslation } from "@/hooks/use-translation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useFirestore } from "@/firebase/provider"
import { listenToAllTransactions, listenToAllUsers, listenToPartnerRequests } from "@/lib/firestore"
import type { Transaction, User as UserType, PartnerRequest } from "@/lib/data"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const firestore = useFirestore()

  const [pendingUserDeposits, setPendingUserDeposits] = React.useState(0);
  const [pendingUserWithdrawals, setPendingUserWithdrawals] = React.useState(0);
  const [pendingKyc, setPendingKyc] = React.useState(0);
  const [pendingPartnerReqs, setPendingPartnerReqs] = React.useState(0);


  React.useEffect(() => {
    if (!firestore) return;

    const unsubscribeTransactions = listenToAllTransactions(firestore, (transactions: Transaction[]) => {
      const userDeposits = transactions.filter(tx => tx.type === 'Deposit' && tx.status === 'Pending').length;
      const userWithdrawals = transactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').length;
      setPendingUserDeposits(userDeposits);
      setPendingUserWithdrawals(userWithdrawals);
    });
    
    const unsubKyc = listenToAllUsers(firestore, (users: UserType[]) => {
      setPendingKyc(users.filter(u => u.kycStatus === 'pending').length);
    });
    
    const unsubPartnerReqs = listenToPartnerRequests(firestore, (requests: PartnerRequest[]) => {
        setPendingPartnerReqs(requests.filter(r => r.status === 'pending').length);
    });

    return () => {
      unsubscribeTransactions();
      unsubKyc();
      unsubPartnerReqs();
    };
  }, [firestore]);


  const menuItems = [
    { href: "/admin", label: t('admin.nav.dashboard'), icon: LayoutDashboard },
    { 
      label: "User Management", 
      icon: Users,
      subItems: [
        { href: "/admin/users", label: "All Users", icon: Users },
        { href: "/admin/deposits", label: "Deposits", icon: ArrowDownToLine, badge: pendingUserDeposits },
        { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine, badge: pendingUserWithdrawals },
        { href: "/admin/kyc", label: "KYC Requests", icon: UserCheck, badge: pendingKyc },
      ]
    },
    { 
      label: "Partner Management", 
      icon: Handshake,
      subItems: [
        { href: "/admin/partner-requests", label: "Partner Requests", icon: Handshake, badge: pendingPartnerReqs },
        { href: "/admin/tasks", label: "Partner Tasks", icon: ListChecks },
      ]
    },
    { href: "/admin/investments", label: 'Plans (User + Partner)', icon: FileCog },
    { href: "/admin/agents", label: "Chat Agents", icon: MessageSquare },
    { href: "/admin/security", label: t('admin.nav.security'), icon: ShieldAlert },
    { href: "/admin/settings", label: 'Global Settings', icon: Settings },
  ]
  
  const viewMenuItems = [
    { href: "/dashboard", label: "View User Panel", icon: User },
    { href: "/partner", label: "View Partner Panel", icon: Handshake },
    { href: "/agent", label: "View Agent Panel", icon: MessageSquare },
  ]

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
            <Logo className="w-8 h-8 text-primary" />
            <span className="group-data-[state=collapsed]:hidden">{t('admin.title')}</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item, index) => (
              item.subItems ? (
                <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton isSub>
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                        {item.subItems.map(subItem => (
                            <SidebarMenuSubItem key={subItem.href}>
                                <Link href={subItem.href}>
                                    <SidebarMenuSubButton isActive={pathname === subItem.href}>
                                      {subItem.icon && <subItem.icon />}
                                      <span>{subItem.label}</span>
                                      {subItem.badge != null && subItem.badge > 0 ? (
                                        <SidebarMenuBadge>{subItem.badge}</SidebarMenuBadge>
                                      ) : null}
                                    </SidebarMenuSubButton>
                                </Link>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href!}>
                      <SidebarMenuButton
                          isActive={pathname === item.href}
                          tooltip={item.label}
                      >
                          <item.icon />
                          <span>{item.label}</span>
                           {item.badge != null && item.badge > 0 ? (
                              <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                              ) : null}
                      </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            ))}
             <SidebarMenuItem>
              <hr className="my-2 border-sidebar-border" />
            </SidebarMenuItem>
            {viewMenuItems.map((item) => (
               <SidebarMenuItem key={item.href} className="group-data-[state=collapsed]:hidden">
                <Link href={item.href} target="_blank">
                  <SidebarMenuButton
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="items-center flex-row justify-between group-data-[state=collapsed]:justify-center">
            <div className="group-data-[state=collapsed]:hidden">
                <LanguageSwitcher/>
            </div>
             <Link href="/login" className="w-full group-data-[state=collapsed]:w-auto">
                <SidebarMenuButton tooltip={t('nav.logout')}>
                    <LogOut/>
                    <span>{t('nav.logout')}</span>
                </SidebarMenuButton>
            </Link>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:pt-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
             {/* Can add breadcrumbs or page title here */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
