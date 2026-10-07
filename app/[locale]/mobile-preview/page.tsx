import type { Metadata, Viewport } from "next";
import MobileHomePreview from "../../mobile-preview/MobileHomePreview";

type Locale = "en" | "de" | "ru" | "it" | "pl";
export const metadata: Metadata = { title: "MLT — Mobile Homepage Preview", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <MobileHomePreview initialLocale={(["en", "de", "ru", "it", "pl"] as string[]).includes(locale) ? locale : "en"} />;
}
