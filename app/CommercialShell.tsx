"use client";
import type { SiteLanguage } from "./LanguageMenu";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "./commercial.css";

export default function CommercialShell({ locale, children }: { locale: SiteLanguage; children: React.ReactNode }) {
  return <main className="commercial"><SiteHeader locale={locale}/>{children}<SiteFooter locale={locale} variant="commercial"/></main>;
}
