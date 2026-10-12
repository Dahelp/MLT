import type { Metadata } from "next";
import type { SiteLocale } from "../layout";
import Investments from "./Investments";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: "Invest in MLT Motorhomes | MLT", description: "Explore premium motorhome investment with a personal MLT manager and calculate an illustrative 15% annual return.", alternates: { canonical: `/${locale}/investments/` } };
}
export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <Investments locale={locale} />;
}
