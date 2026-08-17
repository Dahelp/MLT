import type { Metadata } from "next";

const pages = {
  imprint: {
    title: "Impressum",
    intro: "Angaben gemäß § 5 TMG",
    sections: [
      ["Anbieter", "MLT Maschinenhandel GmbH Import-Export\nBauernweg 17\n01109 Dresden\nDeutschland"],
      ["Vertretung", "Vertreten durch die Geschäftsführerin Elena Bokova."],
      ["Kontakt", "Telefon: +49 176 325 23 799\nMobil: +49 176 303 35 242\nE-Mail: dresden@mlt-maschinen.de\nInternet: www.mlt-maschinen.de"],
      ["Registereintrag", "Eingetragen im Handelsregister beim Amtsgericht Dresden.\nRegisternummer: HRB 14693"],
      ["Umsatzsteuer", "Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE 185964940"],
      ["EU-Streitbeilegung", "Plattform der EU-Kommission zur Online-Streitbeilegung: https://ec.europa.eu/consumers/odr"],
    ],
  },
  privacy: {
    title: "Datenschutzerklärung",
    intro: "Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst.",
    sections: [
      ["Verantwortliche Stelle", "MLT Maschinenhandel GmbH Import-Export\nBauernweg 17, 01109 Dresden, Deutschland\nVertreten durch: Elena Bokova\nE-Mail: dresden@mlt-maschinen.de"],
      ["Erhebung und Verarbeitung", "Wir erheben personenbezogene Daten nur, soweit dies für unsere Dienstleistungen, die Vertragsabwicklung oder gesetzliche Pflichten erforderlich ist. Dazu können Kontakt-, Identitäts-, Führerschein-, Buchungs- und Zahlungsdaten gehören. Vollständige Kreditkartendaten werden nicht in unseren Systemen gespeichert."],
      ["Zweck der Verarbeitung", "Die Verarbeitung dient vorvertraglichen Maßnahmen und der Vertragserfüllung, der Identitätsprüfung, gesetzlichen Dokumentationspflichten sowie der Sicherheit unserer Fahrzeuge und Unterkünfte."],
      ["Weitergabe an Dritte", "Daten werden nur weitergegeben, wenn dies für die Vertragsabwicklung erforderlich ist, etwa an Zahlungsdienstleister oder Versicherungen, oder wenn eine gesetzliche Verpflichtung besteht."],
      ["Speicherdauer", "Wir löschen Daten, sobald der Speicherzweck entfällt und keine gesetzlichen Aufbewahrungsfristen entgegenstehen. Handels- und steuerrechtliche Fristen betragen in der Regel sechs bis zehn Jahre."],
      ["Ihre Rechte", "Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch nach Art. 15–21 DS-GVO."],
      ["Datensicherheit", "Wir setzen technische und organisatorische Sicherheitsmaßnahmen einschließlich SSL/TLS-Verschlüsselung ein, um Ihre Daten vor unbefugtem Zugriff zu schützen."],
      ["Beschwerderecht", "Sie können sich bei einer Datenschutzaufsichtsbehörde beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen die DS-GVO verstößt."],
      ["Cookies", "Technisch notwendige Cookies sind für den Betrieb der Website erforderlich. Statistik- und Marketing-Cookies werden nur nach ausdrücklicher Einwilligung gemäß Art. 6 Abs. 1 lit. a DS-GVO gesetzt. Ihre Auswahl können Sie jederzeit über die Cookie-Einstellungen ändern."],
    ],
  },
  terms: {
    title: "Allgemeine Geschäftsbedingungen",
    intro: "MLT Maschinenhandel GmbH Import-Export",
    sections: [
      ["§ 1 Geltungsbereich", "Diese AGB gelten für Verträge über die Vermietung von Fahrzeugen sowie Ferienwohnungen durch die MLT Maschinenhandel GmbH Import-Export."],
      ["§ 2 Vertragsschluss", "Die Darstellung auf der Website ist kein bindendes Angebot. Ein Vertrag kommt erst durch die schriftliche Buchungsbestätigung, auch per E-Mail, durch den Vermieter zustande."],
      ["§ 3 Mietgegenstand und Nutzung", "Mietgegenstände dürfen nur zum vereinbarten Zweck genutzt und nicht ohne Zustimmung untervermietet werden. Fahrer benötigen die passende gültige Fahrerlaubnis. Die Fahrzeugnutzung ist auf die vertraglich vereinbarten Länder innerhalb der EU begrenzt."],
      ["§ 4 Preise und Zahlung", "Es gelten die bei Buchung vereinbarten Preise. Zahlungen erfolgen per Kreditkarte oder Überweisung. Bei Fahrzeugmiete wird eine Kaution zur Absicherung möglicher Schäden oder Verstöße fällig."],
      ["§ 5 Pflichten des Mieters", "Der Mietgegenstand ist pfleglich zu behandeln. Schäden, Defekte oder Unfälle sind unverzüglich mitzuteilen; bei Unfällen ist die Polizei hinzuzuziehen."],
      ["§ 6 Haftung des Vermieters", "Der Vermieter haftet für Vorsatz und grobe Fahrlässigkeit. Bei leichter Fahrlässigkeit besteht eine Haftung nur bei Verletzung wesentlicher Vertragspflichten. Die Haftung für Leben, Körper und Gesundheit bleibt unberührt."],
      ["§ 7 Haftung des Mieters", "Der Mieter haftet für von ihm zu vertretende Schäden. Die vereinbarte Selbstbeteiligung gilt nicht bei grober Fahrlässigkeit oder Vorsatz."],
      ["§ 8 Stornierung und Rücktritt", "Die konkreten Stornofristen und Gebühren ergeben sich aus der Buchungsbestätigung. Bei höherer Gewalt oder kurzfristigem Defekt kann der Vermieter zurücktreten; bereits gezahlter Mietpreis wird in diesem Fall erstattet."],
      ["§ 9 Datenschutz", "Personenbezogene Daten werden gemäß unserer Datenschutzerklärung und der DS-GVO verarbeitet."],
      ["§ 10 Schlussbestimmungen", "Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Erfüllungsort und Gerichtsstand ist Dresden, soweit der Mieter Kaufmann ist. Die Unwirksamkeit einzelner Regelungen berührt die übrigen Bestimmungen nicht."],
    ],
  },
} as const;

export function generateStaticParams() { return Object.keys(pages).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const page = pages[slug as keyof typeof pages]; return { title: `${page?.title || "Legal"} — MLT` }; }

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug as keyof typeof pages];
  if (!page) return <main className="not-found"><h1>Page not found</h1></main>;
  return <main className="legal-page light-legal"><header className="legal-nav"><a className="legal-logo" href="/"><img src="/mlt-logo-bronze.png" alt="MLT" /></a><a href="/">Zurück ×</a></header><article><p className="light-section-label">MLT / Rechtliches</p><h1>{page.title}</h1><p className="legal-intro">{page.intro}</p><div className="legal-sections">{page.sections.map(([title, text], index) => <section key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{text}</p></div></section>)}</div><footer><a href="/legal/privacy">Datenschutz</a><a href="/legal/imprint">Impressum</a><a href="/legal/terms">AGB</a><a href="/">MLT entdecken</a></footer></article></main>;
}
