import type { Metadata } from "next";
import type { SiteLocale } from "../layout";
import { acquisitionInventory } from "../../../content/acquisition-inventory";
import { acquisitionText } from "../../../content/acquisition-i18n";
import Acquisitions from "./Acquisitions";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${acquisitionText("Motorhomes for Sale", locale)} | MLT ${acquisitionText("Acquisitions", locale)}`, description: acquisitionText("Explore premium motorhomes, compare the details and enquire directly with the MLT sales team.", locale), alternates: { canonical: `/${locale}/acquisitions/` } };
}
export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <Acquisitions locale={locale} initialItems={await acquisitionInventory()} />;
}
