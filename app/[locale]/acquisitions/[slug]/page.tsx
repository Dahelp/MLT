import type { Metadata } from "next";
import { pageAlternates, publicRobots } from "../../../../content/seo";
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
  const title = `${item.title} | MLT ${acquisitionText("Acquisitions", locale)}`;
  const description = `${localized.subtitle} ${acquisitionText("Price", locale)} ${acquisitionMoney(Number(item.price), locale)}.`;
  return {
    title,
    description,
    keywords: [item.title, acquisitionText("Motorhomes for Sale", locale), "MLT"],
    robots: publicRobots,
    alternates: pageAlternates(locale, `acquisitions/${item.slug}`),
    openGraph: {type:"website",siteName:"MLT",url:`/${locale}/acquisitions/${item.slug}/`,title,description},
    twitter: {card:"summary",title,description},
  };
}
export default async function Page({ params }: Params) {
  const { locale, slug } = await params;
  const item = (await acquisitionInventory()).find(item => item.slug === slug);
  if (!item) notFound();
  return <Acquisitions locale={locale} initialSlug={slug} initialItems={[item]} />;
}
