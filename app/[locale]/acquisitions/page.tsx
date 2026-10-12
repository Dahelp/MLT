import type { Metadata } from "next";
import type { SiteLocale } from "../layout";
import Acquisitions from "./Acquisitions";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: "Motorhomes for Sale | MLT Acquisitions", description: "Explore premium motorhomes, compare specifications and contact the MLT sales team to source your ideal residence on wheels.", alternates: { canonical: `/${locale}/acquisitions/` } };
}
export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <Acquisitions locale={locale} />;
}
