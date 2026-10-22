import type { Metadata } from "next";
import SiteFooter from "../../SiteFooter";
import SiteHeader from "../../SiteHeader";
import type { SiteLanguage } from "../../LanguageMenu";
import legal from "../../../content/legal.json";

type LegalSlug = keyof typeof legal.de.pages;
type LegalParams = { slug: string; locale?: SiteLanguage };
const language = (locale?: SiteLanguage): SiteLanguage => locale && locale in legal ? locale : "de";

export function generateStaticParams() { return Object.keys(legal.de.pages).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<LegalParams> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = legal[language(locale)].pages[slug as LegalSlug];
  return { title: `${page?.title || "Legal"} — MLT` };
}

function LegalText({ text }: { text: string }) {
  return <>{text.split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g).map((part, index) =>
    /^https?:\/\//.test(part) ? <a key={index} href={part}>{part}</a> : /^[\w.+-]+@/.test(part) ? <a key={index} href={`mailto:${part}`}>{part}</a> : part
  )}</>;
}

export default async function LegalPage({ params }: { params: Promise<LegalParams> }) {
  const { slug, locale: requestedLocale } = await params;
  const locale = language(requestedLocale);
  const copy = legal[locale];
  const page = copy.pages[slug as LegalSlug];
  if (!page) return <main className="not-found"><h1>Page not found</h1></main>;
  return <><main lang={locale} className="legal-page light-legal legal-with-site-nav"><SiteHeader locale={locale} /><article><p className="light-section-label">MLT / {copy.eyebrow}</p><h1>{page.title}</h1><p className="legal-intro">{page.intro}</p><div className="legal-sections">{page.sections.map(([title, text], index) => <section key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p><LegalText text={text}/></p></div></section>)}</div><nav className="legal-related-links"><a href={`/${locale}/legal/privacy/`}>{copy.privacy}</a><a href={`/${locale}/legal/imprint/`}>{copy.imprint}</a><a href={`/${locale}/legal/terms/`}>{copy.terms}</a><a href={`/${locale}/`}>{copy.home}</a></nav></article></main><SiteFooter locale={locale}/></>;
}
