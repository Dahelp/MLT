import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "../../../../../content/i18n";
import MobileCollectionView, { mobileCollectionIds, type MobileCollectionId } from "../../../../MobileCollectionView";

export const metadata:Metadata={robots:{index:false,follow:false}};
export default async function MobileSiteCollection({params}:{params:Promise<{locale:Locale;slug:string}>}){
 const {locale,slug}=await params;
 if(!mobileCollectionIds.includes(slug as MobileCollectionId))notFound();
 return <MobileCollectionView slug={slug as MobileCollectionId} locale={locale} previewMode={false}/>;
}
