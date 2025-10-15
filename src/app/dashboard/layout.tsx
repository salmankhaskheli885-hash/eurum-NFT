
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  LayoutDashboard,
  LogOut,
  Share2,
  TrendingUp,
  User,
  Users,
  Shield,
  History,
  Settings,
  UserCheck,
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
} from "@/components/ui/sidebar"
import { Logo } from "@/components/icons"
import { UserNav } from "@/components/user-nav"
import { useTranslation } from "@/hooks/use-translation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LiveChat } from "@/components/live-chat"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const isPartner = pathname.startsWith('/partner');

  const userMenuItems = [
    { href: "/dashboard", label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: "/dashboard/investments", label: t('nav.investments'), icon: TrendingUp },
    { href: "/dashboard/deposit", label: t('nav.deposit'), icon: ArrowDownToLine },
    { href: "/dashboard/withdraw", label: t('nav.withdraw'), icon: ArrowUpFromLine },
    { href: "/dashboard/transactions", label: t('nav.transactions'), icon: History },
    { href: "/dashboard/referrals", label: t('nav.referrals'), icon: Share2 },
    { href: "/dashboard/kyc", label: t('kyc.title'), icon: UserCheck },
    { href: "/dashboard/profile", label: t('nav.profile'), icon: User },
    { href: "/dashboard/settings", label: t('nav.settings'), icon: Settings },
  ]

  const partnerMenuItems = [
    { href: "/partner", label: t('nav.partner.dashboard'), icon: LayoutDashboard },
    { href: "/partner/deposit", label: t('nav.deposit'), icon: ArrowDownToLine },
    { href: "/partner/withdraw", label: t('nav.withdraw'), icon: ArrowUpFromLine },
    { href: "/partner/transactions", label: t('nav.transactions'), icon: History },
    { href: "/partner/referrals", label: t('nav.referrals'), icon: Share2 },
    { href: "/partner/kyc", label: t('kyc.title'), icon: UserCheck },
    { href: "/partner/profile", label: t('nav.profile'), icon: User },
    { href: "/partner/settings", label: t('nav.settings'), icon: Settings },
  ]

  const menuItems = isPartner ? partnerMenuItems : userMenuItems;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href={isPartner ? "/partner" : "/dashboard"} className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
            <Logo className="w-8 h-8 text-primary" />
            <span className="group-data-[state=collapsed]:hidden">{t('appName')}</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
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
        <LiveChat />
      </SidebarInset>
    </SidebarProvider>
  )
}
