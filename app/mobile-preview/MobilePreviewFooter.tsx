import type { Locale } from "../../content/i18n";
import styles from "./mobile-preview-footer.module.css";

const copy={en:{tagline:"Individual Road Expeditions across Europe.",explore:"Explore",collections:"Collections",experiences:"Experiences",map:"Smart map",contact:"Contact",email:"Email us",privacy:"Privacy",imprint:"Imprint"},de:{tagline:"Individuelle Road Expeditions durch Europa.",explore:"Entdecken",collections:"Kollektionen",experiences:"Erlebnisse",map:"Smart Map",contact:"Kontakt",email:"E-Mail",privacy:"Datenschutz",imprint:"Impressum"},ru:{tagline:"Индивидуальные автопутешествия по Европе.",explore:"Разделы",collections:"Коллекции",experiences:"Впечатления",map:"Карта",contact:"Контакты",email:"Написать нам",privacy:"Конфиденциальность",imprint:"Реквизиты"}} as const;

export default function MobilePreviewFooter({locale,withStickyBar=false,previewMode=true}:{locale:Locale;withStickyBar?:boolean;previewMode?:boolean}){
 const t=copy[locale],home=previewMode?`/${locale}/mobile-preview/`:`/${locale}/`;
 return <footer className={`${styles.footer} ${withStickyBar?styles.withStickyBar:""}`}><div className={styles.brand}><img src="/mlt-logo.svg" alt="MLT"/><p>{t.tagline}</p></div><div className={styles.links}><div><strong>{t.explore}</strong><a href={`${home}#collections`}>{t.collections}</a><a href={`${home}#experiences`}>{t.experiences}</a><a href={`${home}#map`}>{t.map}</a></div><div><strong>{t.contact}</strong><a href="mailto:concierge@mlt-travel.com">{t.email}</a><a href="tel:+4917632523799">+49 176 325 23 799</a></div></div><div className={styles.bottom}><span>© 2026 MLT</span><a href={`/${locale}/legal/privacy`}>{t.privacy}</a><a href={`/${locale}/legal/imprint`}>{t.imprint}</a></div></footer>;
}
