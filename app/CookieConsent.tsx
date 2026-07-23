"use client";
import { useEffect, useState } from "react";
export default function CookieConsent() {
  const [open, setOpen] = useState(false); const [settings, setSettings] = useState(false); const [analytics, setAnalytics] = useState(false);
  useEffect(() => { setOpen(!localStorage.getItem("mlt-cookie-consent")); }, []);
  const save = (choice: "essential" | "all") => { localStorage.setItem("mlt-cookie-consent", JSON.stringify({ choice, analytics: choice === "all" || analytics, date: new Date().toISOString() })); setOpen(false); };
  if (!open) return null;
  return <div className="cookie-overlay"><section className="cookie-panel" role="dialog" aria-modal="true" aria-label="Cookie preferences"><div><p className="section-label">MLT / Privacy</p><h2>Your privacy,<br /><em>considered.</em></h2><p>We use essential storage to remember your journey. Optional analytics will only be activated with your permission.</p><a href="/legal/privacy">Privacy policy</a></div>{settings && <div className="cookie-settings"><label><span><strong>Essential</strong><small>Journey progress, language and consent choice</small></span><input type="checkbox" checked disabled /></label><label><span><strong>Analytics</strong><small>Anonymous usage insights — not active in this preview</small></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /></label></div>}<div className="cookie-actions"><button onClick={() => save("essential")}>Essential only</button><button onClick={() => setSettings(!settings)}>{settings ? "Close settings" : "Preferences"}</button><button onClick={() => save("all")}>Accept all</button></div></section></div>;
}
