import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "JARVIS - AI Operating System",
  description: "A futuristic AI Assistant + AI Agent operating system.",
};

import { AppLayout } from "@/components/layout/AppLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <meta 
            httpEquiv="Content-Security-Policy" 
            content="default-src 'self' http://localhost:8000 ws://localhost:8000; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: http://localhost:8000 https://img.clerk.com https://images.clerk.com https://clerk.com https://*.clerk.com; media-src 'self' blob: http://localhost:8000; connect-src 'self' http://localhost:8000 ws://localhost:8000 https://*.clerk.accounts.dev https://api.clerk.com https://clerk.com https://*.clerk.com;" 
          />
        </head>
        <body className="antialiased min-h-screen bg-background text-foreground">
          <AppLayout>
            {children}
          </AppLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}
