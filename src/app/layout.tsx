import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { absoluteUrl, getSiteUrl, siteDescription, siteName } from "@/lib/config/site";
import { themeScript } from "@/lib/theme/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: siteName,
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} | Missed Call Recovery CRM`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteName,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName,
    title: `${siteName} | Missed Call Recovery CRM`,
    description: siteDescription,
    url: absoluteUrl("/"),
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: `${siteName} | Missed Call Recovery CRM`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#070a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          id="leadreply-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {children}
      </body>
    </html>
  );
}
