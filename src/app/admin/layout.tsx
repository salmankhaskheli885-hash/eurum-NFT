
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Landmark,
  ShieldAlert,
  FileCog,
  LogOut,
  Settings,
  User,
  Handshake,
  UserCheck,
  History,
  MessageSquare,
  ListChecks,
  UserPlus
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
import { listenToAllTransactions, listenToAllUsers } from "@/lib/firestore"
import type { Transaction, User as UserType } from "@/lib/data"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const firestore = useFirestore()

  const [pendingDeposits, setPendingDeposits] = React.useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = React.useState(0);
  const [pendingKyc, setPendingKyc] = React.useState(0);
  const [pendingPartnerReqs, setPendingPartnerReqs] = React.useState(0);


  React.useEffect(() => {
    if (!firestore) return;

    const unsubscribeTransactions = listenToAllTransactions(firestore, (transactions: Transaction[]) => {
      const deposits = transactions.filter(tx => tx.type === 'Deposit' && tx.status === 'Pending').length;
      const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').length;
      setPendingDeposits(deposits);
      setPendingWithdrawals(withdrawals);
    });
    
    const unsubKyc = listenToAllUsers(firestore, (users: UserType[]) => {
      setPendingKyc(users.filter(u => u.kycStatus === 'pending').length);
    });
    
    return () => {
      unsubscribeTransactions();
      unsubKyc();
    };
  }, [firestore]);


  const menuItems = [
    { href: "/admin", label: t('admin.nav.dashboard'), icon: LayoutDashboard },
     { 
        label: 'User Management', 
        icon: Users,
        subItems: [
            { href: "/admin/users", label: t('admin.nav.users'), icon: Users },
            { 
                href: "/admin/deposits", 
                label: "User Deposits", 
                icon: DollarSign,
                badge: pendingDeposits,
            },
            { 
                href: "/admin/withdrawals", 
                label: "User Withdrawals", 
                icon: Landmark,
                badge: pendingWithdrawals,
            },
             { 
                href: "/admin/kyc", 
                label: "User KYC", 
                icon: UserCheck,
                badge: pendingKyc
            },
        ] 
    },
     { 
        label: 'Partner Management', 
        icon: Handshake,
        subItems: [
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

  const isSubItemActive = (subItems: any[]) => {
      return subItems.some(item => pathname.startsWith(item.href));
  }

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
              <SidebarMenuItem key={index}>
                {item.href ? (
                    <Link href={item.href}>
                        <SidebarMenuButton
                            isActive={pathname === item.href}
                            tooltip={item.label}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                ) : (
                    <SidebarMenuButton
                        isSub
                        isActive={isSubItemActive(item.subItems!)}
                        tooltip={item.label}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </SidebarMenuButton>
                )}

                {item.subItems && (
                  <SidebarMenuSub>
                    {item.subItems.map(subItem => (
                      <SidebarMenuSubItem key={subItem.href}>
                        <Link href={subItem.href}>
                           <SidebarMenuSubButton isActive={pathname.startsWith(subItem.href)}>
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
                )}
              </SidebarMenuItem>
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
