import type { Metadata } from "next";
import "./globals.css";
import "./chat.css";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://mlt-lifestyle.com"),
  title: "MLT — Individual Road Expeditions",
  description: "Private luxury road expeditions across Europe, composed around you.",
  alternates: { canonical: "/" },
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
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head><script dangerouslySetInnerHTML={{ __html: viewportDiagnosticScript + mobileHomeViewportScript }} /></head>
      <body>{children}<AdminReturn/><AnchorNavigation /><ViewportDiagnostics /><JourneyFieldEnhancer /><ChatWidget /><CookieConsent /></body>
    </html>
  );
}
