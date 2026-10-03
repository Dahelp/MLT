import type { Locale } from "../content/i18n";
import MobileCollectionPreview from "./mobile-preview/MobileCollectionPreview";
import FreedomMobilePreview from "./mobile-preview/freedom/FreedomMobilePreview";

export const mobileCollectionIds=["freedom","signature","concierge","private","honeymoon"] as const;
export type MobileCollectionId=(typeof mobileCollectionIds)[number];

export default function MobileCollectionView({slug,locale,previewMode=true}:{slug:MobileCollectionId;locale:Locale;previewMode?:boolean}){
 if(slug==="freedom")return <FreedomMobilePreview initialLocale={locale.toUpperCase() as "EN"|"DE"|"RU"} previewMode={previewMode}/>;
 return <MobileCollectionPreview collectionId={slug} initialLocale={locale} previewMode={previewMode}/>;
}
