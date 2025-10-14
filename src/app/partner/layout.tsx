import DashboardLayout from "../dashboard/layout";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
