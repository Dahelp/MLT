import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SiteLocale } from "../../layout";
import { acquisitionInventory } from "../../../../content/acquisition-inventory";
import Acquisitions from "../Acquisitions";

type Params = { params: Promise<{ locale: SiteLocale; slug: string }> };
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = (await acquisitionInventory()).find(item => item.slug === slug);
  if (!item) notFound();
  return {
    title: `${item.title} | MLT Acquisitions`,
    description: `${item.subtitle} Price €${Number(item.price).toLocaleString("en-IE")}.`,
    alternates: { canonical: `/${locale}/acquisitions/${item.slug}/` },
  };
}
export default async function Page({ params }: Params) {
  const { locale, slug } = await params;
  const item = (await acquisitionInventory()).find(item => item.slug === slug);
  if (!item) notFound();
  return <Acquisitions locale={locale} initialSlug={slug} initialItems={[item]} />;
}
