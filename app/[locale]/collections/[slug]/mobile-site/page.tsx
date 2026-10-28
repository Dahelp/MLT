import type { Metadata, Viewport } from "next";
import { publicMetadata } from "../../../../../content/seo";
import { notFound } from "next/navigation";
import type { Locale } from "../../../../../content/i18n";
import MobileCollectionView, { mobileCollectionIds, type MobileCollectionId } from "../../../../MobileCollectionView";

export async function generateMetadata({params}:{params:Promise<{locale:Locale;slug:string}>}):Promise<Metadata>{const {locale,slug}=await params;if(!mobileCollectionIds.includes(slug as MobileCollectionId))notFound();return publicMetadata(locale,`collections/${slug}`); }
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover"};
export default async function MobileSiteCollection({params}:{params:Promise<{locale:Locale;slug:string}>}){
 const {locale,slug}=await params;
 if(!mobileCollectionIds.includes(slug as MobileCollectionId))notFound();
 return <MobileCollectionView slug={slug as MobileCollectionId} locale={locale} previewMode={false}/>;
}
