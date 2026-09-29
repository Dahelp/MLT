import type { Metadata, Viewport } from "next";
import "./globals.css";
import CookieConsent from "./CookieConsent";

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

export const viewport: Viewport = {
  themeColor: "#e9e4da",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#e9e4da" }}>
      <body style={{ backgroundColor: "#e9e4da" }}>{children}<CookieConsent /></body>
    </html>
  );
}
