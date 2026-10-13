import type { Metadata } from "next";
import type { SiteLocale } from "../layout";
import SmartMapPage from "../../SmartMapPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: "MLT Smart Map | Curated Routes Across Europe", description: "Explore curated European destinations and compose your journey with the interactive MLT Smart Map.", alternates: { canonical: `/${locale}/smart-map/` } };
}

export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <SmartMapPage locale={locale} />;
}
