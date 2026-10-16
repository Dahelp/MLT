import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SiteLocale } from "../../layout";
import { acquisitionInventory } from "../../../../content/acquisition-inventory";
import { acquisitionText, acquisitionMoney, localizeListing } from "../../../../content/acquisition-i18n";
import Acquisitions from "../Acquisitions";

type Params = { params: Promise<{ locale: SiteLocale; slug: string }> };
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = (await acquisitionInventory()).find(item => item.slug === slug);
  if (!item) notFound();
  const localized = localizeListing(item, locale);
  return {
    title: `${item.title} | MLT ${acquisitionText("Acquisitions", locale)}`,
    description: `${localized.subtitle} ${acquisitionText("Price", locale)} ${acquisitionMoney(Number(item.price), locale)}.`,
    alternates: { canonical: `/${locale}/acquisitions/${item.slug}/` },
  };
}
export default async function Page({ params }: Params) {
  const { locale, slug } = await params;
  const item = (await acquisitionInventory()).find(item => item.slug === slug);
  if (!item) notFound();
  return <Acquisitions locale={locale} initialSlug={slug} initialItems={[item]} />;
}
