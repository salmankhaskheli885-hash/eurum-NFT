
"use client"
import Link from "next/link"
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
  Handshake
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { t } = useTranslation()

  const menuItems = [
    { href: "/admin", label: t('admin.nav.dashboard'), icon: LayoutDashboard },
    { href: "/admin/users", label: t('admin.nav.users'), icon: Users },
    { href: "/admin/deposits", label: t('admin.nav.deposits'), icon: DollarSign },
    { href: "/admin/withdrawals", label: t('admin.nav.withdrawals'), icon: Landmark },
    { href: "/admin/investments", label: t('admin.nav.investments'), icon: FileCog },
    { href: "/admin/security", label: t('admin.nav.security'), icon: ShieldAlert },
    { href: "/admin/settings", label: t('admin.nav.settings'), icon: Settings },
  ]
  
  const viewMenuItems = [
    { href: "/dashboard", label: "View User Panel", icon: User },
    { href: "/partner", label: "View Partner Panel", icon: Handshake },
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
                    isActive={pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
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
