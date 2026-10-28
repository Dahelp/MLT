import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";
import "./vouchers.css";
import "./hero-banners.css";
import "./hero-motion.css";
import CookieConsent from "./CookieConsent";
import ChatWidget from "./ChatWidget";
import AdminReturn from "./AdminReturn";
import "./staff-workspace.css";
import JourneyFieldEnhancer from "./concierge/JourneyFieldEnhancer";
import AnchorNavigation from "./AnchorNavigation";
import { viewportDiagnosticScript } from "./viewportDiagnostics";
import ViewportDiagnostics from "./ViewportDebugPanel";
import { mobileHomeViewportScript } from "./mobileHomeViewport";
import { managedPullRefreshScript } from "./managedPullRefresh";
import { operationsBootstrapScript } from "./operationsBootstrap";

export const metadata: Metadata = {
  metadataBase: new URL("https://mlt-lifestyle.com"),
  title: "MLT — Individual Road Expeditions",
  description: "Private luxury road expeditions across Europe, composed around you.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "MLT",
    title: "MLT — Individual Road Expeditions",
    description: "Private luxury road expeditions across Europe, composed around you.",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png?v=20261028", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png?v=20261028", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48x48.png?v=20261028", type: "image/png", sizes: "48x48" },
      { url: "/favicon.svg?v=20261028", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=20261028",
    apple: [{ url: "/apple-touch-icon.png?v=20261028", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><script dangerouslySetInnerHTML={{ __html: operationsBootstrapScript + viewportDiagnosticScript + managedPullRefreshScript + mobileHomeViewportScript }} /></head>
      <body>{children}<AdminReturn/><AnchorNavigation /><ViewportDiagnostics /><JourneyFieldEnhancer /><ChatWidget /><CookieConsent /></body>
    </html>
  );
}
