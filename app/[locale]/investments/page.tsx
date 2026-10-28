import type { Metadata } from "next";
import { publicMetadata } from "../../../content/seo";
import type { SiteLocale } from "../layout";
import Investments from "./Investments";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return publicMetadata(locale, "investments");
}
export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <Investments locale={locale} />;
}
