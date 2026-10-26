export type StaffLocale = "en" | "de" | "ru";
export type OperationsScope = "admin" | "concierge" | "sales" | "manager";
export type OperationsSection = "overview" | "applications" | "payments" | "vouchers" | "catalog" | "products" | "sales" | "investments" | "users" | "base-location" | "team" | "chat";

export const operationsLabels = {
  ru: { overview: "Обзор", applications: "Заявки", payments: "Платежи", vouchers: "Ваучеры", catalog: "Каталог", products: "Автодома и капсулы", sales: "Продажи", investments: "Расчёт инвестиций", users: "Пользователи", "base-location": "База локаций", team: "Команда и доступ", chat: "Чат", logout: "Выйти", closeMenu: "Закрыть меню", navigation: "Рабочие разделы", admin: "Администратор", concierge: "Консьерж", manager: "Менеджер по туризму", salesmanager: "Менеджер по продажам" },
  en: { overview: "Overview", applications: "Applications", payments: "Payments", vouchers: "Vouchers", catalog: "Catalog", products: "Motorhomes & capsule homes", sales: "Sales", investments: "Investment calculations", users: "Users", "base-location": "Location database", team: "Team & access", chat: "Chat", logout: "Sign out", closeMenu: "Close menu", navigation: "Workspace navigation", admin: "Administrator", concierge: "Concierge", manager: "Tourism manager", salesmanager: "Sales manager" },
  de: { overview: "Übersicht", applications: "Anfragen", payments: "Zahlungen", vouchers: "Gutscheine", catalog: "Katalog", products: "Wohnmobile & Kapselhäuser", sales: "Verkauf", investments: "Investitionsberechnung", users: "Benutzer", "base-location": "Standortdatenbank", team: "Team & Zugriff", chat: "Chat", logout: "Abmelden", closeMenu: "Menü schließen", navigation: "Arbeitsbereiche", admin: "Administrator", concierge: "Concierge", manager: "Reisemanager", salesmanager: "Verkaufsmanager" },
} as const;

// The order, destinations and translations are shared by every operations page.
const sections: Record<OperationsScope, readonly OperationsSection[]> = {
  admin: ["overview", "applications", "payments", "vouchers", "catalog", "sales", "investments", "users", "base-location", "team", "chat"],
  concierge: ["overview", "applications", "payments", "vouchers", "catalog", "chat"],
  sales: ["overview", "products", "sales", "investments", "vouchers", "chat"],
  manager: ["chat", "vouchers"],
};

export function operationsNavigation(scope: OperationsScope, locale: StaffLocale) {
  return sections[scope].map(key => ({
    key,
    label: operationsLabels[locale][key],
    href: key === "vouchers" ? "/admin/vouchers/" : key === "sales" ? `/${scope}/acquisitions/` : key === "products" ? "/sales/catalog/" : scope === "sales" && key === "overview" ? "/sales/" : `/${scope}/${key}/`,
  }));
}
