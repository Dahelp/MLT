import type { Metadata } from "next";
import type { SiteLocale } from "../layout";
import { AboutPage } from "../../SiteInfoPages";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: "About MLT | Individual Journeys Across Europe", description: "Discover MLT's approach to individual European journeys, premium motorhomes and personal service.", alternates: { canonical: `/${locale}/about/` } };
}

export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <AboutPage locale={locale} />;
}
