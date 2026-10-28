import type { Metadata, Viewport } from "next";
import { publicMetadata } from "../../../content/seo";
import MobileHomePreview from "../../mobile-preview/MobileHomePreview";
import type { Locale } from "../../../content/i18n";

export async function generateMetadata({params}:{params:Promise<{locale:Locale}>}):Promise<Metadata>{const {locale}=await params;return publicMetadata(locale); }
export const viewport:Viewport={width:"device-width",initialScale:1,viewportFit:"cover"};
export default async function MobileSiteHome({params}:{params:Promise<{locale:Locale}>}){
 const {locale}=await params;
 return <MobileHomePreview initialLocale={locale} previewMode={false}/>;
}
