import type { Metadata } from "next";
import Home from "../HomePage";
import { type SiteLocale } from "./layout";
import { publicMetadata } from "../../content/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return publicMetadata(locale);
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <Home initialLocale={locale} />;
}
