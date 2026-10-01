import type { Metadata } from "next";
import MobileHomePreview from "../../mobile-preview/MobileHomePreview";

type Locale = "en" | "de" | "ru";
export const metadata: Metadata = { title: "MLT — Mobile Homepage Preview", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <MobileHomePreview initialLocale={(["en", "de", "ru"] as string[]).includes(locale) ? locale : "en"} />;
}
