import { readFileSync } from "node:fs";

const pages = JSON.parse(readFileSync(new URL("../content/seo-pages.json", import.meta.url), "utf8"));
const origin = "https://mlt-lifestyle.com";
const locales = ["en", "de", "ru", "it", "pl"];
const escape = value => value.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));

/** The exported files are also served directly by Apache, without an RSC request. */
export function finalizeSeoHtml(html, route) {
  const pathname = route === "/" ? "/" : route.replace(/\/$/, "") + "/";
  const locale = pathname.match(/^\/(en|de|ru|it|pl)(?:\/|$)/)?.[1] || (pathname.startsWith("/legal/") ? "de" : "en");
  html = html.replace(/<html\b([^>]*?)\blang=["'][^"']*["']/i, `<html$1lang="${locale}"`);
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  if (head === undefined) throw new Error(`Missing head: ${route}`);
  const existing = head.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i)?.[0];
  const canonical = existing?.match(/\bhref=["']([^"']+)["']/i)?.[1] || origin + (pathname === "/" ? "/en/" : pathname);
  const replacement = `<link rel="canonical" href="${escape(canonical)}"/>`;
  const normalizedHead = head.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi, "") + replacement;
  return html.replace(head, () => normalizedHead);
}

export function createSitemap(listingSlugs) {
  const paths = [...Object.keys(pages), ...listingSlugs.flatMap(slug => locales.map(locale => `/${locale}/acquisitions/${slug}/`))];
  if (listingSlugs.some(slug => !/^[a-z0-9-]+$/.test(slug))) throw new Error("Invalid sitemap listing slug");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...new Set(paths)].map(path => {
    const suffix = path.replace(/^\/(en|de|ru|it|pl)\//, "");
    const alternate = [...locales, "x-default"].map(locale => `<xhtml:link rel="alternate" hreflang="${locale}" href="${origin}/${locale === "x-default" ? "en" : locale}/${escape(suffix)}"/>`).join("");
    return `<url><loc>${origin}${escape(path)}</loc>${alternate}</url>`;
  }).join("\n")}\n</urlset>\n`;
}
