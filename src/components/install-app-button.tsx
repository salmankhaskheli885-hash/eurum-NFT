
"use client"

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

export function InstallAppButton() {
    const { installPrompt, handleInstallClick } = usePWAInstall();

    if (!installPrompt) {
        return null;
    }

    return (
        <Button onClick={handleInstallClick} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Install App
        </Button>
    )
}
