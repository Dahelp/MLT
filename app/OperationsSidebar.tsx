"use client";
import {operationsLabels, operationsNavigation, type OperationsScope, type OperationsSection, type StaffLocale} from "../content/operations-navigation";
export type {StaffLocale} from "../content/operations-navigation";

function Icon({section}: {section: OperationsSection | "logout"}) {
 const paths: Record<string,string> = {
  overview:"m3 10 9-7 9 7v10H3V10ZM9 20v-6h6v6", applications:"M5 3h14v18H5V3Zm3 5h8M8 12h8M8 16h5", payments:"M12 3v18M16 7H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7",
  vouchers:"M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Zm10 0v3m0 3v2m0 3v3", catalog:"m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5", sales:"M3 6h12v11H3V6Zm12 4h4l3 4v3h-7M5 20h3m9 0h3", investments:"M4 3v17h17M7 15l4-5 4 3 6-8",
  users:"M4 21v-3a5 5 0 0 1 10 0v3M16 13a5 5 0 0 1 5 5v3M6 6a3 3 0 1 0 6 0 3 3 0 0 0-6 0ZM16 3a3 3 0 0 1 0 6", "base-location":"M12 21S4 14 4 9a8 8 0 1 1 16 0c0 5-8 12-8 12ZM9 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z", team:"M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Zm-4 9 3 3 5-6", chat:"M3 4h18v13H9l-6 4V4Zm4 5h10M7 13h7", logout:"M10 4H4v16h6M14 7l5 5-5 5M8 12h11"
 };
 return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[section]||paths.sales}/></svg>;
}
export default function OperationsSidebar({scope,active,role,name,locale,onNavigate}:{scope:OperationsScope;active:OperationsSection;role:string;name:string;locale:StaffLocale;onNavigate?:()=>void}) {
 const t=operationsLabels[locale];
 const roleLabel=role==="admin"?t.admin:scope==="sales"?t.salesmanager:scope==="manager"?t.manager:t.concierge;
 return <aside className="staff-sidebar" id="operations-navigation"><a className="staff-brand" href="/"><img src="/mlt-logo.svg" alt="MLT"/></a><div className="staff-identity"><strong>{name}</strong><small>{roleLabel}</small></div><nav aria-label={t.navigation}>{operationsNavigation(scope,locale).map(({href,label,key})=><a key={key} href={href} onClick={onNavigate} title={label} aria-label={label} aria-current={active===key?"page":undefined} className={active===key?"active":""}><Icon section={key}/><span className="staff-nav-label">{label}</span></a>)}{role==="admin"&&scope!=="admin"&&<a className="staff-admin-link" href="/admin/team/" title={t.team}><span className="staff-nav-label">← {t.team}</span></a>}</nav><button type="button" className="staff-logout" title={t.logout} aria-label={t.logout} onClick={()=>{localStorage.removeItem("mlt-account-token");location.assign("/account/")}}><span className="staff-nav-label">{t.logout}</span><Icon section="logout"/></button></aside>;
}
