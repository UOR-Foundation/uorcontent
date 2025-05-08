import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import { MCPClientProvider } from "../components/MCPClientProvider";
import { QueryClientProvider } from "../providers/QueryClientProvider";
import { AuthProvider } from "../components/AuthProvider";
import { ToastProvider } from "../components/ToastProvider";
import OfflineIndicator from "../components/OfflineIndicator";
import { registerServiceWorker } from "../lib/serviceWorker";

if (typeof window !== 'undefined') {
  registerServiceWorker();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UOR Content Management",
  description: "UOR Content Management Client for managing UOR content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider>
          <ToastProvider>
            <AuthProvider>
              <MCPClientProvider>
                <Navigation />
                <main className="min-h-screen">
                  {children}
                </main>
                <OfflineIndicator />
              </MCPClientProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
