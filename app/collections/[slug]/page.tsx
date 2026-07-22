import type { Metadata } from "next";
import { collections } from "../../../content/mlt";
import { CollectionDetail } from "./CollectionDetail";

export function generateStaticParams() { return collections.map((item) => ({ slug: item.id })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = collections.find((item) => item.id === slug);
  return { title: collection ? `${collection.name} Collection — MLT` : "MLT Collections", description: collection?.promise };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = collections.find((item) => item.id === slug);
  if (!collection) return <main className="not-found"><h1>Collection not found</h1><a href="/">Return to MLT</a></main>;
  return <CollectionDetail collection={collection} />;
}
