import React from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/context/language-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';

// This component is not a layout anymore in CRA, but a wrapper.
// We are keeping the providers here.
// The actual routing logic is now in src/App.tsx

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/logo192.png" />
      </head>
      <body className="font-body antialiased">
        <LanguageProvider>
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
