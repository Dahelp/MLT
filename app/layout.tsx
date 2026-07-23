import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "./CookieConsent";

export const metadata: Metadata = {
  title: "MLT — Individual Road Expeditions",
  description: "Private luxury road expeditions across Europe, composed around you.",
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
      <body>{children}<CookieConsent /></body>
    </html>
  );
}
