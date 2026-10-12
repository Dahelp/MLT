import type { Metadata } from "next";
import type { SiteLocale } from "../layout";
import { ContactPage } from "../../SiteInfoPages";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: "Contact MLT | Personal Enquiries", description: "Contact the MLT team about journeys, motorhome acquisitions or investments. Find our email, phone number and Dresden office address.", alternates: { canonical: `/${locale}/contact/` } };
}

export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <ContactPage locale={locale} />;
}
