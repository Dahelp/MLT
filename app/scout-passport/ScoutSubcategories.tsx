"use client";

import { scoutSubcategoriesFor } from "../../content/scout-subcategories";
import { scoutCopy, scoutCategoriesFor } from "../../content/scout-i18n";
import type { Locale } from "../../content/i18n";

export default function ScoutSubcategories({category, selected, other, onChange, locale}: {
  category: string; selected: string[]; other: string;
  onChange: (selected: string[], other: string) => void; locale: Locale;
}) {
  const t = scoutCopy[locale].subcategories;
  const categoryTitle = scoutCategoriesFor(locale).find(item => item.id === category)?.title;
  const toggle = (id: string, checked: boolean) => {
    const next = checked ? [...selected, id] : selected.filter(value => value !== id);
    onChange(next, next.includes("other") ? other : "");
  };
  return <details className="scout-subcategories" key={category} open onInvalidCapture={event => { event.currentTarget.open = true; }}>
    <summary><span>{t.title} · {categoryTitle}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
    <fieldset className="scout-subcategory-options"><legend className="sr-only">{t.title} · {categoryTitle}</legend>
      {scoutSubcategoriesFor(category, locale).map(item => <label key={item.id} className="scout-subcategory-option">
        <input type="checkbox" name="subcategories" value={item.id} checked={selected.includes(item.id)} onChange={event => toggle(item.id, event.target.checked)}/>
        <span><strong>{item.title}</strong>{item.hint && <span>{item.hint}</span>}</span>
      </label>)}
      {selected.includes("other") && <label className="scout-subcategory-other">{t.otherLabel}<input required name="subcategoryOther" value={other} maxLength={500} placeholder={t.otherPlaceholder} onChange={event => onChange(selected, event.target.value)}/></label>}
    </fieldset>
  </details>;
}
