"use client";
import { siteIdentity } from "../content/site";

import { useState } from "react";
import type { SiteLanguage } from "./LanguageMenu";
import CommercialShell from "./CommercialShell";
import CommercialInquiry from "./CommercialInquiry";
import { infoPageCopy as content } from "../content/info-pages";
import HeroBannerImage from "./HeroBannerImage";
import ContactSocialLinks from "./ContactSocialLinks";

export function AboutPage({ locale }: { locale: SiteLanguage }) {
  const t = content[locale];
  return <CommercialShell locale={locale}><section className="mlt-info-hero"><p className="commercial-eyebrow">MLT / {t.aboutEyebrow}</p><h1>{t.aboutTitle}</h1><p>{t.aboutLead}</p></section><section className="mlt-info-body"><span className="mlt-info-index">01 / MLT</span><div><p>{t.aboutP1}</p><p>{t.aboutP2}</p><a className="commercial-button" href={`/${locale}/contact/`}>{t.aboutLink}</a></div></section></CommercialShell>;
}

export function ContactPage({ locale }: { locale: SiteLanguage }) {
  const [formOpen, setFormOpen] = useState(false);
  const t = content[locale];
  return <CommercialShell locale={locale}><section className="mlt-info-hero mlt-contact-hero photo-hero"><HeroBannerImage name="contact"/><p className="commercial-eyebrow">MLT / {t.contactEyebrow}</p><h1>{t.contactTitle}</h1><p>{t.contactLead}</p></section><section className="mlt-contact-grid"><a href={`mailto:${siteIdentity.email}`}><span>{t.email}</span><strong>{siteIdentity.email}</strong></a><div><span>{t.phone}</span><strong><a href={siteIdentity.phoneHref}>{siteIdentity.phone}</a></strong><ContactSocialLinks/></div><div><span>{t.office}</span><strong>{siteIdentity.companyName}<br/>{siteIdentity.street}<br/>{siteIdentity.city}</strong></div></section><section className="mlt-contact-action"><button className="commercial-button" type="button" onClick={() => setFormOpen(true)}>{t.request}</button></section><CommercialInquiry open={formOpen} onClose={() => setFormOpen(false)} locale={locale} source="contact" subject={t.subject}/></CommercialShell>;
}
