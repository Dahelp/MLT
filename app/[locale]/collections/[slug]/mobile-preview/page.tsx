import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "../../../../../content/i18n";
import MobileCollectionPreview from "../../../../mobile-preview/MobileCollectionPreview";

const previewCollections = ["signature", "concierge", "private", "honeymoon"] as const;
type PreviewCollection = (typeof previewCollections)[number];

export const metadata: Metadata = {
  title: "MLT Collection — Mobile Preview",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return (["en", "de", "ru"] as Locale[]).flatMap((locale) =>
    previewCollections.map((slug) => ({ locale, slug })),
  );
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!(locale === "en" || locale === "de" || locale === "ru") || !previewCollections.includes(slug as PreviewCollection)) notFound();
  return <MobileCollectionPreview collectionId={slug as PreviewCollection} initialLocale={locale as Locale} />;
}
