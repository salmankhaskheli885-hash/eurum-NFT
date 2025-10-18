"use client"

import { DollarSign } from "lucide-react"

export function PageTransitionLoader() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background/50 backdrop-blur-sm">
      <DollarSign className="h-24 w-24 animate-spin text-primary duration-2000" />
      <p className="text-muted-foreground">Loading Page...</p>
    </div>
  )
}
