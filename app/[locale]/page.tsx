import type { Metadata } from "next";
import Home from "../HomePage";
import { locales, type SiteLocale } from "./layout";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `/${locale}/`,
      languages: Object.fromEntries(locales.map((language) => [language, `/${language}/`])),
    },
    other: { "content-language": locale },
  };
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <Home initialLocale={locale} />;
}
