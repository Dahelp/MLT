import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "../../../../../content/i18n";
import MobileCollectionView from "../../../../MobileCollectionView";

const previewCollections = ["freedom", "signature", "concierge", "private", "honeymoon"] as const;
type PreviewCollection = (typeof previewCollections)[number];

export const metadata: Metadata = {
  title: "MLT Collection — Mobile Preview",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export function generateStaticParams() {
  return (["en", "de", "ru"] as Locale[]).flatMap((locale) =>
    previewCollections.map((slug) => ({ locale, slug })),
  );
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!(locale === "en" || locale === "de" || locale === "ru") || !previewCollections.includes(slug as PreviewCollection)) notFound();
  return <MobileCollectionView slug={slug as PreviewCollection} locale={locale as Locale}/>;
}
