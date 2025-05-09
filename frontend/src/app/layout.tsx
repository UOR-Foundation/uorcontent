import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import { MCPClientProvider } from "../components/MCPClientProvider";
import { QueryClientProvider } from "../providers/QueryClientProvider";
import { AuthProvider } from "../components/AuthProvider";
import { ToastProvider } from "../components/ToastProvider";
import { I18nProvider } from "../providers/I18nProvider";
import OfflineIndicator from "../components/OfflineIndicator";
import { registerServiceWorker } from "../lib/serviceWorker";
import SkipLink from "../components/SkipLink";
import { ScreenReaderAnnouncers } from "../components/ScreenReaderAnnouncers";
import { initAnalytics } from "../lib/analytics";

if (typeof window !== 'undefined') {
  registerServiceWorker();
  initAnalytics();
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UOR Content",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <meta name="theme-color" content="#4f46e5" />
        <meta name="application-name" content="UOR Content" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="UOR Content" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#4f46e5" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
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
        </I18nProvider>
      </body>
    </html>
  );
}
