import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "./i18n";
import { siteLocales } from "./site";
import pages from "./seo-pages.json";

export const siteOrigin = "https://mlt-lifestyle.com";
export const publicRobots: Metadata["robots"] = {
  index: true, follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large" },
};

export function pageAlternates(locale: Locale, suffix = "") {
  const path = (language: Locale) => `/${language}/${suffix ? suffix.replace(/^\/+|\/+$/g, "") + "/" : ""}`;
  return { canonical: path(locale), languages: { ...Object.fromEntries(siteLocales.map(language => [language, path(language)])), "x-default": path("en") } };
}

export function publicMetadata(locale: Locale, suffix = ""): Metadata {
  const alternates = pageAlternates(locale, suffix);
  const record = (pages as Record<string, { title: string; description: string; keywords: string[] }>)[alternates.canonical];
  if (!record) notFound();
  return {
    title: record.title, description: record.description, keywords: record.keywords,
    alternates, robots: publicRobots,
    openGraph: { type: "website", siteName: "MLT", url: alternates.canonical, title: record.title, description: record.description },
    twitter: { card: "summary", title: record.title, description: record.description },
  };
}
