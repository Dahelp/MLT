"use client";
import {createContext, useContext, useEffect, useMemo, useState, type ComponentProps, type Dispatch, type ReactNode, type SetStateAction} from "react";
import {usePathname} from "next/navigation";
import OperationsSidebar from "./OperationsSidebar";
import OperationsTopbar from "./OperationsTopbar";
import {useOperatorIdentity} from "./OperatorIdentity";
import {useOperationsLocale} from "./useOperationsLocale";
import {operationsLabels, type OperationsScope, type OperationsSection} from "../content/operations-navigation";
import "./operations-shell.css";

type TopbarState = Pick<ComponentProps<typeof OperationsTopbar>, "department" | "unread" | "enableNotifications" | "applicationCount">;
const ShellContext = createContext<{setTopbar: Dispatch<SetStateAction<TopbarState | undefined>>} | null>(null);
type Props = {
  scope: OperationsScope;
  active: OperationsSection;
  children: ReactNode;
  operator?: {name: string; role: string} | null;
  contentClassName?: string;
  className?: string;
  topbar?: TopbarState;
  overlay?: ReactNode;
  persistent?: boolean;
};

// All operations modules supply content; navigation and workspace controls live here.
export default function OperationsShell({scope, active, children, operator, contentClassName = "", className = "", topbar, overlay, persistent = false}: Props) {
  const parent = useContext(ShellContext);
  const identity = useOperatorIdentity(!parent && !operator?.name);
  const [locale, setLocale] = useOperationsLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [pageTopbar, setPageTopbar] = useState<TopbarState>();
  const context = useMemo(() => ({setTopbar: setPageTopbar}), []);
  const {department, unread, enableNotifications, applicationCount} = topbar || {};
  useEffect(() => {
    if (!parent) return;
    parent.setTopbar({...department && {department}, unread, enableNotifications, applicationCount});
    return () => parent.setTopbar(undefined);
  }, [parent, department, unread, enableNotifications, applicationCount]);
  useEffect(() => {setCollapsed(localStorage.getItem("mlt-operations-collapsed") === "true")}, []);
  useEffect(() => {
    const media = matchMedia("(max-width:760px)");
    const update = () => {setMobile(media.matches); setMobileOpen(false)};
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {setMobileOpen(false)}, [pathname]);
  useEffect(() => {
    if (!mobile || !mobileOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {if (event.key === "Escape") setMobileOpen(false)};
    window.addEventListener("keydown", close);
    return () => {document.body.style.overflow = overflow; window.removeEventListener("keydown", close)};
  }, [mobile, mobileOpen]);
  const toggleSidebar = () => mobile ? setMobileOpen(value => !value) : setCollapsed(value => {
    localStorage.setItem("mlt-operations-collapsed", String(!value));
    return !value;
  });
  const current = operator?.name ? operator : identity;
  if (parent) return <><div className={`operations-content ${contentClassName} ${className}`}>{children}</div>{overlay}</>;
  return <ShellContext.Provider value={context}><main lang={locale} data-mobile-open={mobileOpen} className={`staff-workspace operations-shell ${className} ${active === "chat" ? "operations-chat" : ""}`}>
    <OperationsSidebar scope={scope} active={active} role={current?.role || scope} name={current?.name || "MLT"} locale={locale} onNavigate={() => setMobileOpen(false)}/>
    {mobileOpen && <button type="button" className="operations-menu-backdrop" aria-label={operationsLabels[locale].closeMenu} onClick={() => setMobileOpen(false)}/>}
    <div className="staff-main operations-main">
      <OperationsTopbar locale={locale} onLocaleChange={setLocale} collapsed={mobile ? !mobileOpen : collapsed} onToggleSidebar={toggleSidebar} chatHref={`/${scope}/chat/`} applicationsHref={`/${scope}/applications/`} department={scope === "sales" ? "sales" : scope === "admin" ? "all" : "concierge"} {...(pageTopbar || topbar)}/>
      {persistent ? children : <div className={`operations-content ${contentClassName}`}>{children}</div>}
    </div>
    {overlay}
  </main></ShellContext.Provider>;
}
