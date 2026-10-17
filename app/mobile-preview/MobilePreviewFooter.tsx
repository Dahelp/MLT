import type { Locale } from "../../content/i18n";
import SiteFooter from "../SiteFooter";

export default function MobilePreviewFooter({ locale, withStickyBar = false, previewMode = true }: { locale: Locale; withStickyBar?: boolean; previewMode?: boolean }) {
  return <SiteFooter locale={locale} variant="mobile" withStickyBar={withStickyBar} previewMode={previewMode} />;
}
