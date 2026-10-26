import type {StaffLocale} from "../content/operations-navigation";
import "./operations-text.css";

// All three strings are present in static HTML. The head bootstrap selects the
// saved language through CSS before paint, without changing React's DOM.
export default function OperationsText({values}: {values: Record<StaffLocale, string>}) {
  return <span className="operations-localized">{(["en", "de", "ru"] as const).map(locale => <span key={locale} lang={locale}>{values[locale]}</span>)}</span>;
}
