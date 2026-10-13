"use client";

import { useEffect, useRef, useState } from "react";

export type SiteLanguage = "en" | "de" | "ru" | "it" | "pl";

export function LanguageMenu({ locale, onChange }: { locale: SiteLanguage; onChange: (locale: SiteLanguage) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const hoverEnabled = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  return <div className="header-language-menu" ref={root} onMouseEnter={() => { if (hoverEnabled()) setOpen(true); }} onMouseLeave={() => { if (hoverEnabled()) setOpen(false); }}>
    <button type="button" className="header-language-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>
      <span>{locale.toUpperCase()}</span><i aria-hidden="true" />
    </button>
    {open && <div className="header-language-dropdown" role="menu">{(["en", "de", "ru", "it", "pl"] as SiteLanguage[]).map((language) => <button type="button" role="menuitem" key={language} className={language === locale ? "active" : ""} onClick={() => { setOpen(false); onChange(language); }}>{language.toUpperCase()}{language === locale && <svg className="header-language-check" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3.2 3.2L13 4.5"/></svg>}</button>)}</div>}
  </div>;
}
