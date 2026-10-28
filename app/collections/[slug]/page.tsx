import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicMetadata } from "../../../content/seo";
import { collections } from "../../../content/mlt";
import { CollectionDetail } from "./CollectionDetail";
import type { Locale } from "../../../content/i18n";

export function generateStaticParams() { return collections.filter((item) => item.id !== "proposal").map((item) => ({ slug: item.id })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale?: Locale }> }): Promise<Metadata> {
  const { slug, locale = "en" } = await params;
  const collection = collections.find((item) => item.id === slug);
  if (!collection || collection.id === "proposal") notFound();
  return publicMetadata(locale, `collections/${slug}`);
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string; locale?: Locale }> }) {
  const { slug, locale } = await params;
  const collection = collections.find((item) => item.id === slug);
  if (!collection || collection.id === "proposal") notFound();
  return <CollectionDetail collection={collection} initialLocale={locale || "en"} />;
}
