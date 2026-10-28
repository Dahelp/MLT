import type { Metadata } from "next";
import { publicMetadata } from "../../../content/seo";
import type { SiteLocale } from "../layout";
import { acquisitionInventory } from "../../../content/acquisition-inventory";
import Acquisitions from "./Acquisitions";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return publicMetadata(locale, "acquisitions");
}
export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <Acquisitions locale={locale} initialItems={await acquisitionInventory()} />;
}
