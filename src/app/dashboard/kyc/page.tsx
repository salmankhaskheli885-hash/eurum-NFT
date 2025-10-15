
"use client"

import * as React from "react"
import { useUser } from "@/hooks/use-user"
import KycForm from "@/components/kyc-form"

export default function KycPage() {
  const { user, loading } = useUser()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in.</div>
  }
  
  return <KycForm user={user} />
}
