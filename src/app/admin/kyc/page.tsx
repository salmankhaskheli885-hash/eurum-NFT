"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { Check, X } from "lucide-react"

const mockKycSubmissions = [
  { id: "kyc-1", userName: "Vitalik Buterin", submissionDate: "2023-10-28", status: "pending" },
  { id: "kyc-2", name: "Silvio Micali", submissionDate: "2023-10-27", status: "pending" },
  { id: "kyc-3", name: "Anatoly Yakovenko", submissionDate: "2023-10-26", status: "pending" },
];

export default function AdminKycPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.kyc.title')}</h1>
        <p className="text-muted-foreground">{t('admin.kyc.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.kyc.table.user')}</TableHead>
                <TableHead>{t('admin.kyc.table.submissionDate')}</TableHead>
                <TableHead className="text-center">{t('admin.kyc.table.status')}</TableHead>
                <TableHead className="text-right">{t('admin.kyc.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockKycSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.userName}</TableCell>
                  <TableCell>{submission.submissionDate}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {t(`kyc.statusPill.${submission.status}`)}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm"><Check className="mr-2 h-4 w-4" />{t('admin.kyc.approve')}</Button>
                      <Button variant="destructive" size="sm"><X className="mr-2 h-4 w-4" />{t('admin.kyc.reject')}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
