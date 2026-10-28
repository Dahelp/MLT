import type { Metadata } from "next";
import { publicMetadata } from "../../../content/seo";
import type { SiteLocale } from "../layout";
import { ContactPage } from "../../SiteInfoPages";

export async function generateMetadata({ params }: { params: Promise<{ locale: SiteLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return publicMetadata(locale, "contact");
}

export default async function Page({ params }: { params: Promise<{ locale: SiteLocale }> }) {
  const { locale } = await params;
  return <ContactPage locale={locale} />;
}
