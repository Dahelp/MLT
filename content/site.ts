import type { Locale } from "./i18n";

export const siteIdentity = {
  companyName: "MLT Maschinenhandel GmbH Import-Export",
  street: "Niedersedlitzer Straße 37",
  city: "01239 Dresden, Germany",
  email: "info@mlt-lifestyle.com",
  phone: "+49 176 325 23 799",
  phoneHref: "tel:+4917632523799",
  facebookHref: "https://m.me/61594144491368",
  telegramHref: "https://t.me/+4917632523799",
  whatsappHref: "https://wa.me/4917632523799",
  copyright: "© 2026 MLT Maschinenhandel GmbH Import-Export",
  logo: "/mlt-logo.svg?v=20261006-vector",
  headerLogo: "/mlt-logo-header.svg?v=20261015",
};

export const siteLocales: readonly Locale[] = ["en", "de", "ru", "it", "pl"];

export function localizedUrl(currentUrl: string, locale: Locale): string {
  const url = new URL(currentUrl);
  const parts = url.pathname.split("/");
  if (siteLocales.includes(parts[1] as Locale)) parts[1] = locale;
  else parts.splice(1, 0, locale);
  url.pathname = parts.join("/");
  return url.toString();
}

export function changeSiteLocale(locale: Locale) {
  try { localStorage.setItem("mlt-locale", locale); } catch { /* Navigation works without storage. */ }
  window.location.assign(localizedUrl(window.location.href, locale));
}

/** Voucher navigation belongs to journey discovery pages only. */
export function showsVoucherNavigation(pathname: string): boolean {
  const parts=pathname.split('/').filter(Boolean);
  if(siteLocales.includes(parts[0] as Locale))parts.shift();
  return parts.length===0 || parts[0]==='vouchers' || parts[0]==='collections' || parts[0]==='proposal' || ((parts[0]==='mobile-site'||parts[0]==='mobile-preview')&&(parts.length===1||['freedom','signature','concierge','private','honeymoon'].includes(parts[1])));
}
