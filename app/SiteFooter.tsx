"use client";

import { footerCopy as copy } from "../content/footer";
import { siteIdentity } from "../content/site";
import styles from "./mobile-preview/mobile-preview-footer.module.css";
import type { SiteLanguage } from "./LanguageMenu";
import { siteNavLabels } from "./SiteNavDropdown";

export default function SiteFooter({ locale, reveal = false, variant = "main", previewMode = false, withStickyBar = false }: { locale: SiteLanguage; reveal?: boolean; variant?: "main" | "mobile"; previewMode?: boolean; withStickyBar?: boolean }) {
  const t = copy[locale];
  const nav = siteNavLabels(locale);
  const home = previewMode ? `/${locale}/mobile-preview/` : `/${locale}/`;
  const animation = reveal ? { "data-home-reveal": "up" } : {};
  if (variant === "mobile") return <footer data-site-footer="mobile" className={`${styles.footer} ${withStickyBar ? styles.withStickyBar : ""}`}>
    <div className={styles.brand}><img src={siteIdentity.logo} alt="MLT"/><p>{t.tagline}</p></div>
    <div className={styles.links}><div><strong>{t.explore}</strong><a href={`${home}#collections`}>{nav.collections}</a><a href={`${home}#experiences`}>{t.experiences}</a><a href={`/${locale}/smart-map/`}>{nav.smartMap}</a><a href={`/${locale}/about/`}>{nav.about}</a><a href={`/${locale}/account/`}>{t.account}</a></div><div><strong>{t.contact}</strong><a href={`mailto:${siteIdentity.email}`}>{siteIdentity.email}</a><a href={siteIdentity.phoneHref}>{siteIdentity.phone}</a></div></div>
    <div className={styles.bottom}><span>{siteIdentity.copyright}</span><a href={`/${locale}/legal/privacy/`}>{t.privacy}</a><a href={`/${locale}/legal/imprint/`}>{t.imprint}</a><a href={`/${locale}/legal/terms/`}>{t.terms}</a></div>
  </footer>;
  return <footer data-site-footer="main" className="light-footer">
    <div className="light-footer-logo" {...animation}><img src={siteIdentity.logo} alt="MLT — Move. Live. Travel." loading="lazy" decoding="async" /><p>{t.tagline}</p></div>
    <div {...animation}><strong>{t.explore}</strong><a href={`${home}#collections`}>{nav.collections}</a><a href={`${home}#experiences`}>{t.experiences}</a><a href={`/${locale}/smart-map/`}>{nav.smartMap}</a><a href={`/${locale}/about/`}>{nav.about}</a><a href={`/${locale}/account/`}>{t.account}</a></div>
    <div {...animation}><strong>{t.legal}</strong><a href={`/${locale}/legal/imprint/`}>{t.imprint}</a><a href={`/${locale}/legal/privacy/`}>{t.privacy}</a><a href={`/${locale}/legal/terms/`}>{t.terms}</a></div>
    <div {...animation}><strong>{t.contact}</strong><a href={`mailto:${siteIdentity.email}`}>{siteIdentity.email}</a><a href={siteIdentity.phoneHref}>{siteIdentity.phone}</a></div>
    <small {...animation}>{siteIdentity.copyright}</small>
  </footer>;
}
