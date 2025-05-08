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
import SkipLink from "../components/SkipLink";
import { useScreenReader } from "../hooks/useScreenReader";

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="UOR Content Management Client for managing UOR content" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider>
          <ToastProvider>
            <AuthProvider>
              <MCPClientProvider>
                <SkipLink targetId="main-content" />
                <Navigation />
                <main id="main-content" className="min-h-screen" tabIndex={-1}>
                  {children}
                </main>
                <OfflineIndicator />
                <ScreenReaderAnnouncers />
              </MCPClientProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}

function ScreenReaderAnnouncers() {
  const { ScreenReaderAnnouncer } = useScreenReader();
  return <ScreenReaderAnnouncer />;
}
