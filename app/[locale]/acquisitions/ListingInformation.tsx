import { acquisitionText } from "../../../content/acquisition-i18n";
import type { Locale } from "../../../content/i18n";

const previewCount = 8;
type Specification = { label: string; value: string };

export default function ListingInformation({ locale, description, included, specifications }: {
  locale: Locale;
  description: string;
  included: string;
  specifications: Specification[];
}) {
  const t = (text: string) => acquisitionText(text, locale);
  const remaining = specifications.slice(previewCount);
  const rows = (items: Specification[]) => items.map((item, index) => <div key={`${item.label}-${index}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>);
  return <section className="listing-information commercial-section">
    <div className="listing-introduction">
      <p className="commercial-eyebrow">{t("The residence")}</p>
      <h2>{t("Every detail,")}<br/><em>{t("considered.")}</em></h2>
      <div className="listing-description">{description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    </div>
    <div className="listing-specifications">
      <h3>{t("Specifications")}</h3>
      <dl className="listing-specifications-preview">{rows(specifications.slice(0, previewCount))}</dl>
      {remaining.length > 0 && <details className="listing-specifications-more">
        <summary>
          <span className="listing-specifications-show">{t("All specifications")}<span className="listing-specifications-count">+{remaining.length}</span></span>
          <span className="listing-specifications-hide">{t("Collapse specifications")}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
        </summary>
        <dl>{rows(remaining)}</dl>
      </details>}
    </div>
    <aside className="listing-camper-equipment">
      <h3>{t("Camper equipment")}</h3>
      <ul>{included.split("\n").filter(Boolean).map((line, index) => <li key={index}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg><span>{line}</span></li>)}</ul>
    </aside>
  </section>;
}
