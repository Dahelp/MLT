"use client";

import { useEffect, useRef, useState } from "react";

export type SiteLanguage = "en" | "de" | "ru";

export function LanguageMenu({ locale, onChange }: { locale: SiteLanguage; onChange: (locale: SiteLanguage) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return <div className="header-language-menu" ref={root}>
    <button type="button" className="header-language-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>
      <span>{locale.toUpperCase()}</span><i aria-hidden="true" />
    </button>
    {open && <div className="header-language-dropdown" role="menu">{(["en", "de", "ru"] as SiteLanguage[]).map((language) => <button type="button" role="menuitem" key={language} className={language === locale ? "active" : ""} onClick={() => { setOpen(false); onChange(language); }}>{language.toUpperCase()}</button>)}</div>}
  </div>;
}
