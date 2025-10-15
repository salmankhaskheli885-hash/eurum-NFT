
"use client"
import Link from "next/link"
import React from "react"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  LogOut,
  User,
  History,
  DollarSign,
  Landmark
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
import { LanguageSwitcher } from "@/components/language-switcher"
import { useUser } from "@/hooks/use-user"

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user: agentProfile, loading } = useUser()

  const menuItems = [
    { href: "/agent", label: 'Active Chats', icon: MessageSquare },
    { href: "/agent/history", label: 'Chat History', icon: History },
  ]

  const managementMenuItems = [
     // @ts-ignore
    { href: "/agent/deposits", label: 'Manage Deposits', icon: DollarSign, permission: agentProfile?.canApproveDeposits },
     // @ts-ignore
    { href: "/agent/withdrawals", label: 'Manage Withdrawals', icon: Landmark, permission: agentProfile?.canApproveWithdrawals },
  ]
  
  const profileMenuItems = [
    { href: "/agent/profile", label: 'Profile', icon: User },
  ]


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href="/agent" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
            <Logo className="w-8 h-8 text-primary" />
            <span className="group-data-[state=collapsed]:hidden">Agent Panel</span>
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
             <SidebarMenuItem>
              <hr className="my-2 border-sidebar-border" />
            </SidebarMenuItem>
             {managementMenuItems.filter(item => item.permission).map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
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
             {profileMenuItems.map((item) => (
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
                <SidebarMenuButton tooltip='Logout'>
                    <LogOut/>
                    <span>Logout</span>
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
