import type { Metadata, Viewport } from "next";
import MobileHomePreview from "../../mobile-preview/MobileHomePreview";
import type { Locale } from "../../../content/i18n";

export const metadata:Metadata={robots:{index:false,follow:false}};
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover"};
export default async function MobileSiteHome({params}:{params:Promise<{locale:Locale}>}){
 const {locale}=await params;
 return <MobileHomePreview initialLocale={locale} previewMode={false}/>;
}
