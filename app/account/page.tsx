"use client";
import { FormEvent, useEffect, useState } from "react";
import RealRouteMap from "../plan/RealRouteMap";
import { mapPoints } from "../../content/mlt";
import "./account.css";
type L = "en" | "de" | "ru" | "it" | "pl";
type U = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  locale: L;
  role?: string;
};
type D = {
  confirmationId?: string;
  collection: string;
  collectionName: string;
  country: string;
  days: number;
  arrival: string;
  departure: string;
  guests: number;
  route: string;
  rate: string;
  signatureTailored?: boolean;
  freedomPlus?: boolean;
  tailoredInterests?: string[];
  vehicle: string;
};
type O = {
  reference_code: string;
  status: string;
  amount: string | null;
  total_amount?: string | null;
  deposit_amount?: string | null;
  paid_amount?: string | null;
  currency: string;
  collection_name: string;
  country_name: string;
  arrival_date: string;
  departure_date: string;
  created_at: string;
  paid_at: string | null;
  travel_days?: number;
  guests?: string;
  route_json?: string;
  route_points_json?: string;
  extras_json?: string;
  service_items_json?: string;
  client_note?: string | null;
  vehicle_name?: string;
};
const baseTx = {
  ru: {
    eyebrow: "ЛИЧНЫЙ КАБИНЕТ",
    login: "Войти",
    register: "Создать аккаунт",
    email: "Электронная почта",
    pass: "Пароль",
    name: "Имя",
    last: "Фамилия",
    phone: "Телефон",
    logout: "Выйти",
    home: "Обзор",
    journeys: "Мои поездки",
    documents: "Документы",
    profile: "Профиль",
    support: "Связь с консьержем",
    welcome: "Добро пожаловать",
    current: "Текущая заявка",
    history: "История поездок",
    deposit: "Оплатить аванс 20%",
    full: "Оплатить полностью",
    balance: "Оплатить остаток",
    pay: "Перейти к оплате",
    method: "Выберите способ оплаты",
    consent:
      "Я принимаю условия бронирования, политику конфиденциальности и правила отмены.",
    secure: "Безопасная оплата через PayPal или Stripe",
    empty: "Путешествие начинается с выбора коллекции.",
    explore: "Выбрать коллекцию",
    total: "Полная стоимость",
    paid: "Оплачено",
    due: "Осталось",
    dates: "Даты",
    guests: "Гости",
    status: "Статус",
    save: "Сохранить",
    language: "Язык",
    details: "Подробнее",
    partial: "Аванс получен",
    paidStatus: "Оплачено полностью",
    pending: "Ожидает оплаты",
  },
  en: {
    eyebrow: "PRIVATE ACCOUNT",
    login: "Sign in",
    register: "Create account",
    email: "Email",
    pass: "Password",
    name: "First name",
    last: "Last name",
    phone: "Phone",
    logout: "Sign out",
    home: "Overview",
    journeys: "My journeys",
    documents: "Documents",
    profile: "Profile",
    support: "Contact concierge",
    welcome: "Welcome back",
    current: "Current application",
    history: "Journey history",
    deposit: "Pay 20% deposit",
    full: "Pay in full",
    balance: "Pay balance",
    pay: "Continue to payment",
    method: "Choose payment method",
    consent:
      "I accept the booking terms, privacy policy and cancellation terms.",
    secure: "Secure payment via PayPal or Stripe",
    empty: "Every journey starts with a collection.",
    explore: "Explore collections",
    total: "Full investment",
    paid: "Paid",
    due: "Remaining",
    dates: "Dates",
    guests: "Guests",
    status: "Status",
    save: "Save changes",
    language: "Language",
    details: "Details",
    partial: "Deposit received",
    paidStatus: "Paid in full",
    pending: "Awaiting payment",
  },
  de: {
    eyebrow: "PRIVATES KONTO",
    login: "Anmelden",
    register: "Konto erstellen",
    email: "E-Mail",
    pass: "Passwort",
    name: "Vorname",
    last: "Nachname",
    phone: "Telefon",
    logout: "Abmelden",
    home: "Übersicht",
    journeys: "Meine Reisen",
    documents: "Dokumente",
    profile: "Profil",
    support: "Concierge kontaktieren",
    welcome: "Willkommen zurück",
    current: "Aktueller Antrag",
    history: "Reisehistorie",
    deposit: "20 % Anzahlung",
    full: "Vollständig bezahlen",
    balance: "Restbetrag bezahlen",
    pay: "Zur Zahlung",
    method: "Zahlungsart wählen",
    consent:
      "Ich akzeptiere Buchungsbedingungen, Datenschutzerklärung und Stornierungsbedingungen.",
    secure: "Sichere Zahlung über PayPal oder Stripe",
    empty: "Jede Reise beginnt mit einer Kollektion.",
    explore: "Kollektionen entdecken",
    total: "Gesamtbetrag",
    paid: "Bezahlt",
    due: "Restbetrag",
    dates: "Daten",
    guests: "Gäste",
    status: "Status",
    save: "Speichern",
    language: "Sprache",
    details: "Details",
    partial: "Anzahlung erhalten",
    paidStatus: "Vollständig bezahlt",
    pending: "Zahlung ausstehend",
  },
} as const;
const tx = {
  ...baseTx,
  it: { ...baseTx.en, eyebrow:"AREA PERSONALE",login:"Accedi",register:"Crea un account",pass:"Password",name:"Nome",last:"Cognome",phone:"Telefono",logout:"Esci",home:"Panoramica",journeys:"I miei viaggi",documents:"Documenti",profile:"Profilo",support:"Contatta il concierge",welcome:"Bentornato",current:"Richiesta attuale",history:"Storico viaggi",full:"Paga l’intero importo",balance:"Paga il saldo",total:"Importo totale",paid:"Pagato",due:"Da pagare",dates:"Date",guests:"Ospiti",status:"Stato",save:"Salva",language:"Lingua",details:"Dettagli",pending:"In attesa del pagamento" },
  pl: { ...baseTx.en, eyebrow:"KONTO KLIENTA",login:"Zaloguj się",register:"Utwórz konto",pass:"Hasło",name:"Imię",last:"Nazwisko",phone:"Telefon",logout:"Wyloguj się",home:"Przegląd",journeys:"Moje podróże",documents:"Dokumenty",profile:"Profil",support:"Skontaktuj się z concierge",welcome:"Witaj ponownie",current:"Bieżące zgłoszenie",history:"Historia podróży",full:"Zapłać całość",balance:"Zapłać resztę",total:"Łączna kwota",paid:"Zapłacono",due:"Pozostało",dates:"Daty",guests:"Goście",status:"Status",save:"Zapisz",language:"Język",details:"Szczegóły",pending:"Oczekuje na płatność" },
};
const Icon = ({ n }: { n: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d={
        n === "home"
          ? "M3 11.5 12 4l9 7.5v8.2a1.3 1.3 0 0 1-1.3 1.3H4.3A1.3 1.3 0 0 1 3 19.7zM9 21v-6h6v6"
          : n === "trip"
            ? "M4 6h16M6 3v6m12-6v6M5 10h14v10H5z"
            : n === "user"
              ? "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0"
              : n === "menu"
                ? "M4 7h16M4 12h16M4 17h16"
                : n === "docs"
                  ? "M6 3h9l3 3v15H6zM15 3v4h4M9 12h6M9 16h6"
                  : "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2"
      }
    />
  </svg>
);
const money = (n: number | string | undefined, c = "EUR") =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
const collectionTitle = (name: string) =>
  `MLT ${name.charAt(0).toUpperCase()}${name.slice(1)} Collection`;
const jsonList = (value?: string) => {
  try {
    const result = JSON.parse(value || "[]");
    return Array.isArray(result)
      ? result.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};
const jsonServices = (value?: string) => {
  try {
    const result = JSON.parse(value || "[]");
    return Array.isArray(result)
      ? result.filter(
          (item): item is { title: string; price: number } =>
            typeof item?.title === "string",
        )
      : [];
  } catch {
    return [];
  }
};
const routeDefaults: Record<string, string[]> = {
  "dolomites-grand-tour": ["dolomites", "como"],
  "lakes-of-bavaria": ["bavaria", "blackforest"],
  "alpine-escape": ["tyrol", "salzburg"],
  "wine-roads-collection": ["tuscany", "como"],
  "mediterranean-discovery": ["tuscany", "amalfi"],
  "winter-alps-expedition": ["tyrol", "salzburg"],
  "black-forest-experience": ["blackforest", "bavaria"],
};
const mapRouteIds = (items: string[]) =>
  Array.from(
    new Set(
      items.flatMap((item) => {
        const found = mapPoints.find(
          (point) =>
            point.id === item.toLowerCase() ||
            point.name.toLowerCase() === item.toLowerCase(),
        )?.id;
        return found && routeDefaults[found]
          ? routeDefaults[found]
          : found
            ? [found]
            : [];
      }),
    ),
  );
export default function Account({
  initialTab,
}: {
  initialTab?: "home" | "journeys" | "documents" | "profile";
}) {
  const operationsDestination = (role?: string) => {
    const next = new URLSearchParams(location.search).get("next") || "";
    if (role === "manager") return "/manager/chat/";
    if (role === "admin") return "/admin/overview/";
    return /^\/concierge(?:\/|$)/.test(next) ? next : "/concierge/overview/";
  };
  const initial: L =
    typeof window !== "undefined" && location.pathname.startsWith("/ru/")
      ? "ru"
      : typeof window !== "undefined" && location.pathname.startsWith("/it/")
        ? "it"
        : typeof window !== "undefined" && location.pathname.startsWith("/pl/")
          ? "pl"
          : typeof window !== "undefined" && location.pathname.startsWith("/de/")
        ? "de"
        : "en";
  const [locale, setLocale] = useState<L>(initial),
    t = tx[locale];
  const [user, setUser] = useState<U | null>(null),
    [draft, setDraft] = useState<D | null>(null),
    [orders, setOrders] = useState<O[]>([]),
    [journeyPage, setJourneyPage] = useState(1),
    [selectedOrder, setSelectedOrder] = useState<O | null>(null),
    [paymentOrderState, setPaymentOrder] = useState<O | null>(null),
    [tab, setTab] = useState<"home" | "journeys" | "documents" | "profile">(
      initialTab || "home",
    ),
    [ready, setReady] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    [modal, setModal] = useState<"deposit" | "full" | "balance" | null>(null),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [paymentProvider, setPaymentProvider] = useState<
      "paypal" | "stripe" | null
    >(null),
    [paymentError, setPaymentError] = useState(""),
    [message, setMessage] = useState(""),
    [auth, setAuth] = useState<"login" | "register">("login"),
    [form, setForm] = useState({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
    });
  const token = () => localStorage.getItem("mlt-account-token") || "";
  const api = async (a: string, d: object = {}) => {
    const r = await fetch("/api/account.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      },
      body: JSON.stringify({ action: a, ...d }),
    });
    const j = await r.json();
    if (!r.ok) { const error = new Error(j.error || "Request failed") as Error & { status?: number }; error.status = r.status; throw error; }
    return j;
  };
  const load = async () => {
    try {
      let j = await api("orders");
    if (["admin", "concierge", "manager"].includes(j.user?.role)) {
      localStorage.removeItem("mlt-account-draft");
      setDraft(null);
      location.assign(operationsDestination(j.user?.role));
      return;
    }
      const hasOpen = (j.orders || []).some(
        (o: O) => !["completed", "cancelled"].includes(o.status),
      );
      let next: D | null = null;
      try {
        next = JSON.parse(localStorage.getItem("mlt-account-draft") || "null");
      } catch {}
      if (next && (j.user?.role === "agency" || !hasOpen)) {
        const created = await api("create_application", next);
        localStorage.removeItem("mlt-account-draft");
        setDraft(null);
        j = await api("orders");
        if (!created.created && j.user?.role !== "agency") setMessage(locale === "ru" ? "У вас уже есть текущая заявка. Новую можно оформить после завершения поездки." : "You can book a new journey after your current trip ends.");
      } else if (next) {
        localStorage.removeItem("mlt-account-draft");
        setDraft(null);
        setMessage(locale === "ru" ? "У вас уже есть текущая заявка. Новую можно оформить после завершения поездки." : "You can book a new journey after your current trip ends.");
      }
      setUser(j.user);
      setLocale(j.user.locale);
      setOrders(j.orders || []);
    } catch (error) {
      if ((error as { status?: number }).status === 401) localStorage.removeItem("mlt-account-token");
      else setMessage(error instanceof Error ? error.message : "Could not load your journeys.");
    } finally {
      setReady(true);
    }
  };
  useEffect(() => {
    try {
      setDraft(JSON.parse(localStorage.getItem("mlt-account-draft") || "null"));
    } catch {}
    if (new URLSearchParams(location.search).get("payment") === "success") {
      localStorage.removeItem("mlt-account-draft");
      setDraft(null);
      setMessage("✓ Payment received");
      setTab("journeys");
    }
    token() ? load() : setReady(true);
  }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [message]);
  const sign = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const j = await api(auth, { ...form, locale });
      localStorage.setItem("mlt-account-token", j.token);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };
  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const j = await api("profile", {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        locale,
      });
      setUser(j.user);
      setLocale(j.user.locale);
      setMessage(
        locale === "ru"
          ? "✓ Профиль сохранён"
          : locale === "de"
            ? "✓ Profil gespeichert"
            : "✓ Profile saved",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };
  const pay = async (provider: "paypal" | "stripe") => {
    if (!modal || !consent || !paymentOrderState) return;
    setPaymentError("");
    setPaymentProvider(provider);
    setBusy(true);
    try {
      const r = await fetch(
        provider === "stripe" ? "/api/stripe-payment.php" : "/api/payment.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            collection: paymentOrderState.collection_name,
            days: paymentOrderState.travel_days,
            reference: paymentOrderState.reference_code,
            paymentKind: modal,
            consent: true,
          }),
        },
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url)
        throw Error(
          j.error ||
            (provider === "paypal"
              ? "PayPal is temporarily unavailable. Please try Stripe or contact MLT Concierge."
              : "Unable to start secure payment."),
        );
      location.assign(j.url);
    } catch (e) {
      setPaymentError(
        e instanceof Error ? e.message : "Unable to start secure payment.",
      );
      setPaymentProvider(null);
      setBusy(false);
    }
  };
  const paid = orders.reduce((s, o) => s + Number(o.paid_amount || 0), 0);
  const paymentTotal = Number(
    paymentOrderState?.total_amount || paymentOrderState?.amount || 0,
  );
  const paymentPaid = Number(paymentOrderState?.paid_amount || 0);
  const paymentDeposit =
    Number(paymentOrderState?.deposit_amount || 0) || paymentTotal * 0.2;
  const depositLabel = (order: O) => {
    const amount = Number(order.deposit_amount || 0);
    return amount
      ? locale === "ru"
        ? `Оплатить аванс ${money(amount, order.currency)}`
        : locale === "de"
          ? `Anzahlung ${money(amount, order.currency)} bezahlen`
          : `Pay deposit ${money(amount, order.currency)}`
      : t.deposit;
  };
  const depositTitle =
    paymentOrderState && Number(paymentOrderState.deposit_amount || 0) > 0
      ? locale === "ru"
        ? "Оплатить аванс"
        : locale === "de"
          ? "Anzahlung bezahlen"
          : "Pay deposit"
      : t.deposit;
  const openOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  );
  const agency = user?.role === "agency";
  const noteText = {
    en: { eyebrow: "COMMENTS & REQUESTS", title: "Tell your concierge what matters to you", intro: "Share preferences for stays, dining, special dates or route details.", label: "Message for your concierge", placeholder: "Write your requests…", send: "Send to concierge", sent: "✓ Your wishes were sent to the concierge", failed: "Could not send your wishes" },
    de: { eyebrow: "KOMMENTARE & WÜNSCHE", title: "Sagen Sie Ihrem Concierge, was Ihnen wichtig ist", intro: "Teilen Sie Wünsche zu Unterkünften, Restaurants, besonderen Tagen oder zur Route mit.", label: "Nachricht an den Concierge", placeholder: "Schreiben Sie Ihre Wünsche…", send: "An Concierge senden", sent: "✓ Wünsche an den Concierge gesendet", failed: "Wünsche konnten nicht gesendet werden" },
    ru: { eyebrow: "КОММЕНТАРИЙ И ПОЖЕЛАНИЯ", title: "Расскажите консьержу, что важно именно вам", intro: "Предпочтения по отелям, ресторанам, питанию, особые даты или детали маршрута.", label: "Пожелания для консьержа", placeholder: "Напишите ваши пожелания…", send: "Отправить консьержу", sent: "✓ Пожелания отправлены консьержу", failed: "Не удалось отправить пожелания" },
    it: { eyebrow: "COMMENTI E RICHIESTE", title: "Racconta al concierge cosa conta per te", intro: "Condividi preferenze su soggiorni, ristoranti, date speciali o itinerario.", label: "Messaggio per il concierge", placeholder: "Scrivi le tue richieste…", send: "Invia al concierge", sent: "✓ Richieste inviate al concierge", failed: "Impossibile inviare le richieste" },
    pl: { eyebrow: "KOMENTARZE I ŻYCZENIA", title: "Powiedz concierge, co jest dla Ciebie ważne", intro: "Podziel się preferencjami dotyczącymi noclegów, restauracji, ważnych dat lub trasy.", label: "Wiadomość do concierge", placeholder: "Napisz swoje życzenia…", send: "Wyślij do concierge", sent: "✓ Życzenia wysłano do concierge", failed: "Nie udało się wysłać życzeń" },
  }[locale];
  const visibleOpenOrders = agency ? openOrders.slice(0, 1) : openOrders;
  const listedOrders = agency ? orders : orders.filter((o) => ["completed", "cancelled"].includes(o.status));
  const journeyPageCount = Math.max(1, Math.ceil(listedOrders.length / 10));
  const pagedOrders = listedOrders.slice((journeyPage - 1) * 10, journeyPage * 10);
  const toast = message ? (
    <div
      className={`account-toast ${message.startsWith("✓") ? "is-success" : "is-error"}`}
      role={message.startsWith("✓") ? "status" : "alert"}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setMessage("")}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  ) : null;
  const routeLocale = typeof window === "undefined" ? "" : location.pathname.split("/")[1];
  const accountBase = (["en", "de", "ru", "it", "pl"].includes(routeLocale) ? `/${routeLocale}` : "") + "/account";
  if (!ready) return <main className="account-page account-loading" />;
  if (!user)
    return (
      <main className="account-page">
        <a className="account-brand" href="/">
          MLT
        </a>
        <section className="account-auth">
              <p className="account-eyebrow">{t.eyebrow}</p>
          <h1>{auth === "login" ? t.login : t.register}</h1>
          <form onSubmit={sign}>
            {auth === "register" && (
              <>
                <label>
                  {t.name}
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </label>
                <label>
                  {t.last}
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            <label>
              {t.email}
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              {t.pass}
              <input
                type="password"
                minLength={8}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <button className="bronze-button">
              {auth === "login" ? t.login : t.register}
              <span>→</span>
            </button>
          </form>
          <button
            className="account-switch"
            onClick={() => setAuth(auth === "login" ? "register" : "login")}
          >
            {auth === "login" ? t.register : t.login}
          </button>
          {toast}
        </section>
      </main>
    );
  return (
    <main
      className={`account-page account-premium ${collapsed ? "is-collapsed" : ""}`}
    >
      <aside className="client-side">
        <a className="account-brand" href="/">
          MLT
        </a>
        <button
          className="side-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle menu"
        >
          <Icon n="menu" />
        </button>
        <nav>
          <a
            className={tab === "home" ? "active" : ""}
            href={`${accountBase}/`}
          >
            <Icon n="home" />
            <span>{t.home}</span>
          </a>
          <a
            className={tab === "journeys" ? "active" : ""}
            href={`${accountBase}/journeys/`}
          >
            <Icon n="trip" />
            <span>{t.journeys}</span>
          </a>
          <a
            className={tab === "documents" ? "active" : ""}
            href={`${accountBase}/documents/`}
          >
            <Icon n="docs" />
            <span>{t.documents}</span>
          </a>
          <a
            className={tab === "profile" ? "active" : ""}
            href={`${accountBase}/profile/`}
          >
            <Icon n="user" />
            <span>{t.profile}</span>
          </a>
        </nav>
        <a className="client-support" href="mailto:info@mlt-lifestyle.com">
          {t.support} ↗
        </a>
      </aside>
      <section className="client-main">
        <header>
          <div>
            <p className="account-eyebrow">{agency ? (locale === "ru" ? "КАБИНЕТ ТУРАГЕНТСТВА" : locale === "it" ? "AGENZIA VIAGGI" : locale === "pl" ? "BIURO PODRÓŻY" : locale === "de" ? "REISEAGENTUR" : "TRAVEL AGENCY") : t.eyebrow}</p>
            <h1>
              {t.welcome}, {user.firstName}.
            </h1>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("mlt-account-token");
              setUser(null);
            }}
          >
            {t.logout}
          </button>
        </header>
        {toast}
        {tab === "home" && (
          <>
            {agency && <a className="agency-new-tour bronze-button" href={`/${locale}/#collections`}>{locale === "ru" ? "Добавить новый тур" : locale === "it" ? "Aggiungi un viaggio" : locale === "pl" ? "Dodaj nową podróż" : "Add a new journey"} →</a>}
            <div className="client-widgets">
              <article>
                <span>
                  <Icon n="trip" />
                </span>
                <small>{t.journeys}</small>
                <b>{orders.length}</b>
                <p>{t.current}</p>
              </article>
              <article>
                <span>
                  <Icon n="user" />
                </span>
                <small>{t.paid}</small>
                <b>{money(paid)}</b>
                <p>{paid ? "Payment record updated" : "No payments yet"}</p>
              </article>
              <article>
                <span>
                  <Icon n="home" />
                </span>
                <small>{t.support}</small>
                <b>24/7</b>
                <p>MLT Concierge</p>
              </article>
            </div>
            {openOrders.length > 0 && (
              <section className="open-applications">
                <p className="account-eyebrow">{agency ? t.current : locale === "ru" ? "Текущие заявки" : locale === "de" ? "Aktuelle Anfragen" : locale === "it" ? "Richieste attuali" : locale === "pl" ? "Bieżące zgłoszenia" : "Current applications"}</p>
                <div className="open-app-grid">
                  {visibleOpenOrders.map((o, index) => {
                    const orderTotal = Number(o.total_amount || o.amount || 0),
                      orderPaid = Number(o.paid_amount || 0),
                      orderDue = Math.max(
                        0,
                        orderTotal -
                          Math.max(orderPaid, Number(o.deposit_amount || 0)),
                      );
                    return (
                      <article
                        className="open-order-card"
                        key={o.reference_code}
                        style={{
                          backgroundImage: `linear-gradient(90deg,rgba(15,17,15,.42),rgba(15,17,15,.32)),image-set(url(/collection-${o.collection_name}.avif) type("image/avif"),url(/collection-${o.collection_name}.webp) type("image/webp"))`,
                        }}
                      >
                        <span className="open-order-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p>
                            {o.country_name} · {o.travel_days}{" "}
                            {locale === "ru" ? "дней" : "days"}
                          </p>
                          <h2>{collectionTitle(o.collection_name)}</h2>
                          <strong>
                            {jsonList(o.route_json).join(" · ") ||
                              "MLT journey"}
                          </strong>
                          <dl>
                            <div>
                              <dt>{t.dates}</dt>
                              <dd>
                                {o.arrival_date} — {o.departure_date}
                              </dd>
                            </div>
                            <div>
                              <dt>{t.guests}</dt>
                              <dd>{o.guests || "—"}</dd>
                            </div>
                            <div>
                              <dt>{t.total}</dt>
                              <dd>{money(orderTotal, o.currency)}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="open-order-actions">
                          <p>
                            {o.status === "paid"
                              ? t.paidStatus
                              : orderPaid > 0
                                ? t.partial
                                : t.pending}
                          </p>
                          <b>
                            {t.total}: {money(orderTotal, o.currency)}
                          </b>
                          {(orderPaid > 0 ||
                            Number(o.deposit_amount || 0) > 0) && (
                            <small>
                              {Number(o.deposit_amount || 0) > 0
                                ? (locale === "ru"
                                    ? "Аванс"
                                    : locale === "de"
                                      ? "Anzahlung"
                                      : "Deposit") +
                                  `: ${money(o.deposit_amount || 0, o.currency)} · `
                                : ""}
                              {t.due}: {money(orderDue, o.currency)}
                            </small>
                          )}
                          {o.status === "paid" ? null : orderPaid > 0 ? (
                            <button
                              onClick={() => {
                                setPaymentOrder(o);
                                setModal("balance");
                                setConsent(false);
                              }}
                            >
                              {t.balance} →
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setPaymentOrder(o);
                                  setModal("deposit");
                                  setConsent(false);
                                }}
                              >
                                {depositLabel(o)} →
                              </button>
                              <button
                                className="open-order-full"
                                onClick={() => {
                                  setPaymentOrder(o);
                                  setModal("full");
                                  setConsent(false);
                                }}
                              >
                                {t.full} →
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="journey-visible-details">
                  {visibleOpenOrders.map((o) => {
                    const mapQuery =
                      [
                        ...jsonList(o.route_json),
                        ...jsonList(o.route_points_json),
                      ]
                        .filter(Boolean)
                        .join(" → ") || o.country_name;
                    return (
                      <>
                        <section
                          className="journey-plan"
                          key={`${o.reference_code}-plan`}
                        >
                          <header>
                            <div>
                              <p className="account-eyebrow">ВАШ МАРШРУТ</p>
                              <h2>План путешествия</h2>
                            </div>
                            <span>{o.reference_code}</span>
                          </header>
                          <div className="journey-plan-grid">
                            <RealRouteMap
                              selected={mapRouteIds([
                                ...jsonList(o.route_json),
                                ...jsonList(o.route_points_json),
                              ])}
                              country={o.country_name || "All"}
                              onToggle={() => {}}
                              locale={locale}
                              className="account-route-map"
                            />
                            <div className="journey-plan-content">
                              <article>
                                <small>ВЫБРАННЫЕ ТОЧКИ МАРШРУТА</small>
                                <p>
                                  {jsonList(o.route_json).join(" → ") ||
                                    "Маршрут готовится консьержем"}
                                </p>
                                <ul>
                                  {mapRouteIds([
                                    ...jsonList(o.route_json),
                                    ...jsonList(o.route_points_json),
                                  ]).map((id, index) => {
                                    const point = mapPoints.find(
                                      (item) => item.id === id,
                                    );
                                    return (
                                      point && (
                                        <li key={id}>
                                          <b>
                                            {String(index + 1).padStart(2, "0")}
                                          </b>
                                          <span>
                                            {point.name}
                                            <small>{point.type}</small>
                                          </span>
                                        </li>
                                      )
                                    );
                                  })}
                                </ul>
                              </article>
                              <article>
                                <small>ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ</small>
                                {jsonServices(o.service_items_json).length ? (
                                  jsonServices(o.service_items_json).map(
                                    (service) => (
                                      <p key={service.title}>
                                        {service.title}
                                        <b>
                                          {money(service.price, o.currency)}
                                        </b>
                                      </p>
                                    ),
                                  )
                                ) : (
                                  <p>Дополнительных услуг пока нет.</p>
                                )}
                              </article>
                            </div>
                          </div>
                        </section>
                        <form
                          className="journey-client-comment"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const note =
                              (new FormData(e.currentTarget).get(
                                "clientNote",
                              ) as string) || "";
                            try {
                              await api("client_note", {
                                reference: o.reference_code,
                                note,
                              });
                              setOrders(
                                orders.map((item) =>
                                  item.reference_code === o.reference_code
                                    ? { ...item, client_note: note }
                                    : item,
                                ),
                              );
                              setMessage(noteText.sent);
                            } catch {
                              setMessage(noteText.failed);
                            }
                          }}
                        >
                          <div>
                            <p className="account-eyebrow">
                              {noteText.eyebrow}
                            </p>
                            <h3>{noteText.title}</h3>
                            <p>
                              {noteText.intro}
                            </p>
                          </div>
                          <label>
                            <textarea
                              name="clientNote"
                              defaultValue={o.client_note || ""}
                              placeholder={noteText.placeholder}
                            />
                          </label>
                          <button className="bronze-button">
                            {noteText.send}
                          </button>
                        </form>
                      </>
                    );
                  })}
                </div>
              </section>
            )}
            {openOrders.length ? null : (
              <section className="client-empty">
                <p className="account-eyebrow">MLT</p>
                <h2>{t.empty}</h2>
                <a href="/collections/concierge/">{t.explore} →</a>
              </section>
            )}
          </>
        )}
        {tab === "journeys" && (
          <section className="client-panel">
            <p className="account-eyebrow">{t.journeys}</p>
            <h2>{agency ? (locale === "ru" ? "Все туры агентства" : locale === "it" ? "Tutti i viaggi dell’agenzia" : locale === "pl" ? "Wszystkie podróże biura" : locale === "de" ? "Alle Reisen der Agentur" : "All agency journeys") : t.history}</h2>
            {agency && <a className="agency-new-tour bronze-button" href={`/${locale}/#collections`}>{locale === "ru" ? "Добавить новый тур" : locale === "it" ? "Aggiungi un viaggio" : locale === "pl" ? "Dodaj nową podróż" : "Add a new journey"} →</a>}
            {pagedOrders.map((o) => (
                <article className="journey-row" key={o.reference_code}>
                  <div>
                    <b>{collectionTitle(o.collection_name)}</b>
                    <small>
                      {o.arrival_date} — {o.departure_date} · {o.country_name}
                    </small>
                  </div>
                  <div>
                    <small>
                      {o.status === "cancelled"
                        ? "Отменена"
                        : Number(o.total_amount || o.amount || 0) <= 0
                          ? "Стоимость уточняется"
                          : Number(o.paid_amount || 0) + 0.009 >=
                              Number(o.total_amount || o.amount || 0)
                            ? t.paidStatus
                            : o.status === "selected"
                              ? "Выбрано для оплаты"
                              : Number(o.paid_amount || 0) > 0
                                ? t.partial
                                : t.pending}
                    </small>
                    <b>
                      {t.paid}: {money(o.paid_amount || 0, o.currency)}
                    </b>
                    <small>
                      {t.total}: {money(o.total_amount || o.amount, o.currency)}
                    </small>
                    <small>
                      {t.due}:{" "}
                      {money(
                        Math.max(
                          0,
                          Number(o.total_amount || o.amount || 0) -
                            Number(o.paid_amount || 0),
                        ),
                        o.currency,
                      )}
                    </small>
                  </div>
                  <button onClick={() => setSelectedOrder(o)}>
                    {t.details} →
                  </button>
                </article>
              ))}
            {journeyPageCount > 1 && <nav className="journey-pagination" aria-label={locale === "ru" ? "Страницы туров" : "Journey pages"}><button type="button" disabled={journeyPage === 1} onClick={() => setJourneyPage((page) => page - 1)}>←</button><span>{journeyPage} / {journeyPageCount}</span><button type="button" disabled={journeyPage === journeyPageCount} onClick={() => setJourneyPage((page) => page + 1)}>→</button></nav>}
          </section>
        )}
        {tab === "documents" && (
          <section className="client-panel documents-panel">
            <p className="account-eyebrow">{t.documents}</p>
            <h2>
              {locale === "ru"
                ? "Документы поездки"
                : locale === "de"
                  ? "Reiseunterlagen"
                  : "Journey documents"}
            </h2>
            <p className="documents-intro">
              {locale === "ru"
                ? "Здесь консьерж публикует договор, подтверждения оплаты и другие документы по вашей поездке."
                : locale === "de"
                  ? "Hier veröffentlicht Ihr Concierge Vertrag, Zahlungsbestätigungen und weitere Reiseunterlagen."
                  : "Your concierge will publish the agreement, payment confirmations and other journey documents here."}
            </p>
            <div className="documents-grid">
              <article>
                <span>01</span>
                <div>
                  <small>{locale === "ru" ? "ДОГОВОР" : "AGREEMENT"}</small>
                  <b>
                    {locale === "ru"
                      ? "Договор путешествия"
                      : "Journey agreement"}
                  </b>
                  <p>
                    {locale === "ru"
                      ? "Будет доступен после подготовки консьержем."
                      : "Available once prepared by your concierge."}
                  </p>
                </div>
              </article>
              <article>
                <span>02</span>
                <div>
                  <small>{locale === "ru" ? "ОПЛАТА" : "PAYMENT"}</small>
                  <b>
                    {locale === "ru"
                      ? "Подтверждение оплаты"
                      : "Payment confirmation"}
                  </b>
                  <p>
                    {locale === "ru"
                      ? "Появится после успешной оплаты."
                      : "Available after a successful payment."}
                  </p>
                </div>
              </article>
            </div>
          </section>
        )}
        {tab === "profile" && (
          <section className="client-panel">
            <p className="account-eyebrow">{t.profile}</p>
            <h2>
              {user.firstName} {user.lastName}
            </h2>
            <div className="account-profile-grid">
              <label>
                {t.name}
                <input
                  value={user.firstName}
                  onChange={(e) =>
                    setUser({ ...user, firstName: e.target.value })
                  }
                />
              </label>
              <label>
                {t.last}
                <input
                  value={user.lastName}
                  onChange={(e) =>
                    setUser({ ...user, lastName: e.target.value })
                  }
                />
              </label>
              <label>
                {t.phone}
                <input
                  value={user.phone || ""}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                />
              </label>
              <label>
                {t.language}
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as L)}
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pl">Polski</option>
                </select>
              </label>
            </div>
            <button
              className="bronze-button"
              disabled={busy}
              onClick={saveProfile}
            >
              {t.save}
            </button>
          </section>
        )}
      </section>
      {selectedOrder && (
        <div className="journey-detail-modal">
          <section>
            <button
              className="journey-detail-close"
              onClick={() => setSelectedOrder(null)}
            >
              ×
            </button>
            <p className="account-eyebrow">{selectedOrder.reference_code}</p>
            <h2>{collectionTitle(selectedOrder.collection_name)}</h2>
            <dl>
              <div>
                <dt>{t.dates}</dt>
                <dd>
                  {selectedOrder.arrival_date} — {selectedOrder.departure_date}
                </dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{selectedOrder.country_name}</dd>
              </div>
              <div>
                <dt>Выбранный продукт</dt>
                <dd>{jsonList(selectedOrder.route_json).join(" · ") || "—"}</dd>
              </div>
              <div>
                <dt>Дополнительно</dt>
                <dd>
                  {jsonList(selectedOrder.extras_json).join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt>{t.status}</dt>
                <dd>
                  {selectedOrder.status === "cancelled"
                    ? "Отменена"
                    : selectedOrder.status === "selected"
                      ? "Выбрано для оплаты"
                      : selectedOrder.status === "partially_paid"
                        ? t.partial
                        : selectedOrder.status === "paid"
                          ? t.paidStatus
                          : t.pending}
                </dd>
              </div>
              <div>
                <dt>{t.total}</dt>
                <dd>
                  {money(
                    selectedOrder.total_amount || selectedOrder.amount,
                    selectedOrder.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>{t.paid}</dt>
                <dd>
                  {money(
                    selectedOrder.paid_amount || selectedOrder.amount,
                    selectedOrder.currency,
                  )}
                </dd>
              </div>
            </dl>
            <section className="journey-client-updates">
              <p className="account-eyebrow">ВАША ПОЕЗДКА</p>
              <div>
                <small>Маршрут</small>
                <p>
                  {jsonList(selectedOrder.route_json).join(" → ") ||
                    "Маршрут готовится консьержем"}
                </p>
              </div>
              <div>
                <small>Места и точки</small>
                <p>
                  {jsonList(selectedOrder.route_points_json).join(" · ") ||
                    "Точки маршрута будут добавлены консьержем"}
                </p>
              </div>
              <div>
                <small>Дополнительные услуги</small>
                {jsonServices(selectedOrder.service_items_json).length ? (
                  jsonServices(selectedOrder.service_items_json).map((s) => (
                    <p key={s.title}>
                      {s.title} — {money(s.price, selectedOrder.currency)}
                    </p>
                  ))
                ) : (
                  <p>Дополнительных услуг пока нет.</p>
                )}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const note =
                    (new FormData(e.currentTarget).get(
                      "clientNote",
                    ) as string) || "";
                  try {
                    await api("client_note", {
                      reference: selectedOrder.reference_code,
                      note,
                    });
                    setSelectedOrder({ ...selectedOrder, client_note: note });
                    setOrders(
                      orders.map((o) =>
                        o.reference_code === selectedOrder.reference_code
                          ? { ...o, client_note: note }
                          : o,
                      ),
                    );
                    setMessage(noteText.sent);
                  } catch {
                    setMessage(noteText.failed);
                  }
                }}
              >
                <label>
                  {noteText.label}
                  <textarea
                    name="clientNote"
                    defaultValue={selectedOrder.client_note || ""}
                    placeholder={noteText.placeholder}
                  />
                </label>
                <button className="bronze-button">{noteText.send}</button>
              </form>
            </section>
          </section>
        </div>
      )}
      {modal && (
        <div className="pay-modal">
          <section>
            <button
              onClick={() => {
                setModal(null);
                setPaymentOrder(null);
                setPaymentError("");
                setPaymentProvider(null);
              }}
            >
              ×
            </button>
            <p className="account-eyebrow">{t.secure}</p>
            <h2>
              {modal === "deposit"
                ? depositTitle
                : modal === "balance"
                  ? t.balance
                  : t.full}
            </h2>
            <b>
              {money(
                modal === "deposit"
                  ? paymentDeposit
                  : modal === "balance"
                    ? paymentTotal - paymentPaid
                    : paymentTotal,
              )}
            </b>
            <label className="legal-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>{t.consent}</span>
            </label>
            <div>
              <button
                className={paymentProvider === "paypal" ? "is-loading" : ""}
                disabled={!consent || busy}
                onClick={() => pay("paypal")}
              >
                {paymentProvider === "paypal" ? "Opening PayPal…" : "PayPal"}
              </button>
              <button
                className={paymentProvider === "stripe" ? "is-loading" : ""}
                disabled={!consent || busy}
                onClick={() => pay("stripe")}
              >
                {paymentProvider === "stripe" ? "Opening Stripe…" : "Stripe"}
              </button>
            </div>
            {paymentError && <p className="payment-error">{paymentError}</p>}
          </section>
        </div>
      )}
    </main>
  );
}
