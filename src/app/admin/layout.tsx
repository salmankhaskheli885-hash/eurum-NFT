
"use client"
import Link from "next/link"
import React from "react"
import { usePathname } from "next/navigation"
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
  MessageSquare
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
import { listenToAllTransactions } from "@/lib/firestore"
import type { Transaction } from "@/lib/data"

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

  React.useEffect(() => {
    if (!firestore) return;

    const unsubscribe = listenToAllTransactions(firestore, (transactions: Transaction[]) => {
      const deposits = transactions.filter(tx => tx.type === 'Deposit' && tx.status === 'Pending').length;
      const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').length;
      setPendingDeposits(deposits);
      setPendingWithdrawals(withdrawals);
    });

    return () => unsubscribe();
  }, [firestore]);


  const menuItems = [
    { href: "/admin", label: t('admin.nav.dashboard'), icon: LayoutDashboard },
    { href: "/admin/users", label: t('admin.nav.users'), icon: Users },
    { 
      href: "/admin/deposits", 
      label: t('admin.nav.deposits'), 
      icon: DollarSign,
      badge: pendingDeposits,
      subItems: [
        { href: "/admin/deposits/history", label: "History" }
      ] 
    },
    { 
      href: "/admin/withdrawals", 
      label: t('admin.nav.withdrawals'), 
      icon: Landmark,
      badge: pendingWithdrawals,
      subItems: [
        { href: "/admin/withdrawals/history", label: "History" }
      ] 
    },
    { href: "/admin/investments", label: t('admin.nav.investments'), icon: FileCog },
    { 
      href: "/admin/kyc", 
      label: t('admin.nav.kyc'), 
      icon: UserCheck,
      subItems: [
        { href: "/admin/kyc/history", label: "History" }
      ]
    },
    { href: "/admin/security", label: t('admin.nav.security'), icon: ShieldAlert },
    { href: "/admin/settings", label: t('admin.nav.settings'), icon: Settings },
  ]
  
  const viewMenuItems = [
    { href: "/dashboard", label: "View User Panel", icon: User },
    { href: "/partner", label: "View Partner Panel", icon: Handshake },
    { href: "/admin", label: "View Agent Panel", icon: MessageSquare }, // Placeholder link
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
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href) && !item.subItems)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                     {item.badge && item.badge > 0 ? (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuButton>
                </Link>
                {item.subItems && (
                  <SidebarMenuSub>
                    {item.subItems.map(subItem => (
                      <SidebarMenuSubItem key={subItem.href}>
                        <Link href={subItem.href} passHref legacyBehavior>
                           <SidebarMenuSubButton isActive={pathname === subItem.href}>
                              <History />
                              <span>{subItem.label}</span>
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
               <SidebarMenuItem key={item.href}>
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
