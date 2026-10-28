import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScoutPassport from "../../scout-passport/ScoutPassport";
import { scoutCopy, scoutPath } from "../../../content/scout-i18n";
import { siteLocales } from "../../../content/site";
import type { Locale } from "../../../content/i18n";
import "../../scout-passport/scout.css";

type Props = { params: Promise<{ locale: string }> };
async function pageLocale(params: Props["params"]): Promise<Locale> {
  const { locale } = await params;
  if (!siteLocales.includes(locale as Locale)) notFound();
  return locale as Locale;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await pageLocale(params);
  return { title: "MLT Scout Passport", description: scoutCopy[locale].form.tagline, referrer: "no-referrer", alternates: { canonical: scoutPath(locale), languages: Object.fromEntries(siteLocales.map(language => [language, scoutPath(language)])) } };
}
export default async function Page({ params }: Props) {
  const locale = await pageLocale(params);
  return <ScoutPassport locale={locale} />;
}
