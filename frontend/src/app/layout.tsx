import type { Metadata } from "next";
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
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
