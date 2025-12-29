import type { Metadata } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/providers/auth-session-provider";
import { ChainhookProvider } from "@/providers/chainhook-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "EventFlow - Blockchain Event Automation",
  description: "Build powerful blockchain event-driven workflows on Stacks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthSessionProvider>
          <ChainhookProvider>
            {children}
            <Toaster />
          </ChainhookProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
