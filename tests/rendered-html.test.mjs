import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("every admin route renders exactly one shared workspace with the same navigation", async () => {
  const sections = ['overview','applications','payments','vouchers','catalog','acquisitions','investments','users','base-location','team','chat'];
  for (const section of ['', ...sections]) {
    const response = await render(`/admin/${section ? section + '/' : ''}`);
    assert.equal(response.status, 200, section);
    const html = await response.text();
    assert.ok(html.indexOf('root.dataset.operationsLocale') >= 0 && html.indexOf('root.dataset.operationsLocale') < html.indexOf('<body'), 'Saved operations language must be applied in head');
    assert.match(html, /class="operations-localized"><span lang="en">Overview<\/span><span lang="de">Übersicht<\/span><span lang="ru">Обзор<\/span>/);
    assert.equal((html.match(/class="staff-sidebar"/g) || []).length, 1, section);
    assert.equal((html.match(/class="staff-topbar"/g) || []).length, 1, section);
    assert.equal((html.match(/class="staff-logout"/g) || []).length, 1, section);
    const nav = html.match(/<nav aria-label="Workspace navigation">(.*?)<\/nav>/s)?.[1];
    assert.ok(nav, section);
    assert.deepEqual([...nav.matchAll(/href="([^"]+)"/g)].map(match => match[1]), sections.map(key => `/admin/${key}/`), section);
    const active = section || 'overview';
    assert.match(nav, new RegExp(`href="/admin/${active}/"[^>]*aria-current="page"`), active);
    assert.doesNotMatch(html.match(/class="staff-topbar-start"(.*?)<\/div>/s)?.[1] || '', /vouchers/);
  }
});

test("Scout Passport exports its mobile form, brand strip and private admin destination", async () => {
  const response = await render('/scout-passport/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /MLT Scout Passport/);
  assert.match(html, /Находите\. Снимайте\. Дополняйте маршруты MLT/);
  for (const field of ['scoutName','title','country','latitude','longitude','description','parking','booking']) assert.ok(html.includes(`name="${field}"`), field);
  assert.doesNotMatch(html, /mlt-site-header|data-site-footer=|<footer\b/);
  assert.match(html, /<header class="scout-banner"><div class="scout-banner-language"><div class="header-language-menu"/);
  assert.doesNotMatch(html, /class="mlt-chat-widget/);
  assert.equal((await render('/admin/base-location/')).status, 200);
});

test("all scout languages render the hero language menu and translated form without site navigation or footer", async () => {
  const translations = JSON.parse(await readFile(new URL('public/data/scout-i18n.json', root), 'utf8'));
  for (const locale of ['en','de','ru','it','pl']) {
    const response = await render(`/${locale}/scout-passport/`);
    assert.equal(response.status,200);
    const html = await response.text();
    assert.ok(html.includes(`class="scout-page" lang="${locale}"`));
    assert.doesNotMatch(html,/mlt-site-header|data-site-footer=|<footer\b/);
    assert.match(html,/<header class="scout-banner"><div class="scout-banner-language"><div class="header-language-menu"/);
    assert.ok(html.includes(`<span>${locale.toUpperCase()}</span>`));
    assert.ok(html.includes(translations[locale].form.scoutName));
    assert.ok(html.includes(translations[locale].form.sectionPhotos));
    assert.ok(html.includes(translations[locale].form.submit));
    assert.doesNotMatch(html,/class="scout-intro"|class="scout-meta"|class="mlt-chat-widget/);
  }
});

test("voucher offer is present in both home layouts and localized purchase pages preserve the shared footer", async () => {
  for(const locale of ["en","de","ru","it","pl"]){
    for(const suffix of ["","mobile-site/"]){
      const path=`/${locale}/${suffix}`;
      const html=await (await render(path)).text();
      assert.match(html,/<section class="voucher-section" id="vouchers">/,path);
      assert.ok(html.includes(`href="/${locale}/vouchers/"`),path);
      assert.match(html,/class="voucher-card"/);
      assert.doesNotMatch(html,/50 of 50 vouchers remaining/,'Stock must come from the live database, never fabricated in static HTML');
    }
    const response=await render(`/${locale}/vouchers/`);assert.equal(response.status,200);
    const html=await response.text();assert.match(html,/id="voucher-conditions"/);assert.match(html,/data-site-footer="main"/);assert.ok(html.includes(`/${locale}/legal/terms/`));
    assert.equal((await render(`/${locale}/account/vouchers/`)).status,200);
  }
  assert.equal((await render('/admin/vouchers/')).status,200);
});

test("public chats are online before staff presence loads in both departments and layouts", async () => {
  for (const locale of ["en", "de", "ru", "it", "pl"]) {
    for (const route of ["", "mobile-site/", "acquisitions/", "investments/"]) {
      const path = `/${locale}/${route}`;
      const response = await render(path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.match(html, /class="mlt-chat-widget is-online\b/, path);
    }
  }
  const css = await readFile(new URL("app/chat.css", root), "utf8");
  const indicators = css.match(/\.mlt-chat-launcher:after\s*\{[^}]*\}/g) || [];
  assert.equal(indicators.length, 1, "one launcher indicator rule prevents offline overrides");
  assert.match(indicators[0], /background:#65bb7b/);
});

test("separate public layouts share footer identity and legal links", async () => {
  for (const locale of ["en", "de", "ru", "it", "pl"]) {
    for (const route of [`/${locale}/`, `/${locale}/mobile-site/`, `/${locale}/contact/`]) {
      const response = await render(route);
      assert.equal(response.status, 200, route);
      const html = await response.text();
      const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
      assert.ok(footer, `${route} has a footer`);
      for (const slug of ["privacy", "imprint", "terms"]) assert.ok(footer.includes(`/${locale}/legal/${slug}/`), `${route}: ${slug}`);
      assert.ok(footer.includes("MLT Maschinenhandel GmbH Import-Export"), route);
      assert.ok(footer.includes("mailto:info@mlt-lifestyle.com"), route);
      assert.ok(footer.includes("tel:+4917632523799"), route);
    }
  }
});

test("public pages share one footer with voucher navigation limited to journey discovery", async () => {
  for (const locale of ["en", "de", "ru", "it", "pl"]) {
    let reference;
    for (const route of ["", "vouchers/", "about/", "contact/", "investments/", "acquisitions/", "smart-map/", "collections/freedom/", "proposal/", "legal/privacy/", "legal/imprint/", "legal/terms/"]) {
      const pathname = `/${locale}/${route}`;
      const response = await render(pathname);
      assert.equal(response.status, 200, pathname);
      const html = await response.text();
      const footers = html.match(/<footer\b[\s\S]*?<\/footer>/g) || [];
      assert.equal(footers.length, 1, pathname);
      assert.match(footers[0], /data-site-footer="main"/);
      assert.doesNotMatch(footers[0], /commercial-footer/);
      assert.ok(footers[0].includes(`/${locale}/investments/`),pathname);
      assert.ok(footers[0].includes(`/${locale}/acquisitions/`),pathname);
      assert.ok(!footers[0].includes('#experiences'),pathname);
      assert.equal(footers[0].includes(`/${locale}/vouchers/`),route===''||route==='vouchers/'||route.startsWith('collections/')||route==='proposal/',pathname);
      const normalized = footers[0].replace(/ data-home-reveal="[^"]*"/g, "").replace(/<a href="[^"]*\/vouchers\/">[^<]*<\/a>/g, "");
      reference ??= normalized;
      assert.equal(normalized, reference, `${pathname} has the same footer as the home page`);
    }
    const mobile = await (await render(`/${locale}/mobile-site/`)).text();
    assert.match(mobile, /<footer data-site-footer="mobile"/);
    assert.doesNotMatch(mobile, /<footer data-site-footer="main"/);
  }
});

test("Freedom omits products while other collections retain their shared carousel", async () => {
  const lastProduct = { freedom: "Black Forest Trail", signature: "Black Forest Signature Retreat", concierge: "Black Forest Family Forest &amp; Lore", private: "Black Forest Experience", honeymoon: "Black Forest Fairy Tale" };
  for (const [slug, last] of Object.entries(lastProduct)) {
    for (const suffix of ["", "mobile-site/"]) {
      const route = `/en/collections/${slug}/${suffix}`;
      const response = await render(route);
      assert.equal(response.status, 200, route);
      const html = await response.text();
      const classes = Array.from(html.matchAll(/class="([^"]*)"/g), match => match[1].split(/\s+/));
      assert.equal(classes.filter(tokens => tokens.includes("swiper")).length, slug === "freedom" ? 0 : 1, `${route} must not mount hidden carousels`);
      assert.equal(html.includes(last), slug !== "freedom", `${route} product visibility`);
    }
  }
});

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("GTM appears once in head and its noscript fallback opens the body on both public layouts", async () => {
  for (const route of ["/en/", "/it/", "/en/mobile-site/", "/it/collections/private/mobile-site/"]) {
    const response = await render(route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1] || "";
    assert.equal((head.match(/id="mlt-google-tag-manager"/g) || []).length, 1, route);
    assert.match(head, /GTM-KPR2RQPG/, route);
    assert.ok(head.indexOf('id="mlt-google-tag-manager"') < head.indexOf('root.dataset.operationsLocale'), route);
    assert.match(html, /<body><noscript><iframe src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-KPR2RQPG" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"><\/iframe><\/noscript>/, route);
  }
});

test("renders the public MLT experience with indexable metadata", async () => {
  const redirect = await render("/");
  assert.equal(redirect.status, 307);
  assert.equal(new URL(redirect.headers.get("location"), "http://localhost").pathname, "/en/");
  const response = await render("/en/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Luxury Motorhome Holidays in Europe \| MLT<\/title>/);
  assert.match(html, /name="robots" content="index, follow"/);
  assert.doesNotMatch(html, /name="(?:robots|googlebot)" content="[^"]*noindex/);
  assert.match(html, /MLT Smart Map/);
  assert.match(html, /Five ways to travel/i);
  assert.match(html, /MLT Freedom Collection/i);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("renders all public MVP routes", async () => {
  const routes = [
    "/en/", "/de/", "/ru/",
    "/en/smart-map/", "/de/smart-map/", "/ru/smart-map/", "/it/smart-map/", "/pl/smart-map/",
    "/en/investments/", "/ru/acquisitions/", "/en/contact/", "/de/about/",
    "/en/collections/freedom/", "/en/collections/signature/", "/en/collections/concierge/", "/en/collections/private/", "/en/collections/honeymoon/",
    "/en/legal/imprint/", "/de/legal/privacy/", "/ru/legal/terms/",
  ];
  for (const route of routes) {
    const response = await render(route);
    assert.equal(response.status, 200, `${route} should render`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  }
});

test("listing URLs render the vehicle in the initial HTML and reject unknown slugs", async () => {
  const seed = JSON.parse(await readFile(new URL("public/data/acquisitions/mercedes-benz-v-300-marco-polo.json", root), "utf8"));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, ...options) => {
    if (String(input) === "https://mlt-lifestyle.com/api/acquisitions.php") return Response.json({ items: [{ ...seed, id: 1 }] });
    return originalFetch(input, ...options);
  };
  try {
    for (const locale of ["en", "ru"]) {
      const path = `/${locale}/acquisitions/${seed.slug}/`;
      const response = await render(path);
      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /<h1>Mercedes-Benz V 300 Marco Polo<\/h1>/);
      assert.ok(html.includes(`<title>Mercedes-Benz V 300 Marco Polo | MLT ${locale === "en" ? "Acquisitions" : "Покупка автодома"}</title>`));
      assert.ok(html.includes(`rel="canonical" href="https://mlt-lifestyle.com${path}"`), "Canonical URL must identify the vehicle");
      assert.ok(html.includes(JSON.parse(seed.images_json)[0]), "First photo must be present without JavaScript");
      assert.doesNotMatch(html, /Find your next|Explore motorhomes|Loading residence/);
    }
    const missing = await render("/en/acquisitions/no-such-vehicle/");
    assert.equal(missing.status, 404);
  } finally { globalThis.fetch = originalFetch; }
});

test("keeps safeguards and critical interactions in source", async () => {
  const [layout, home, header, anchors, smartMap, cookies, map, italy, austria, germany, robots, htaccess, gitignore] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/HomePage.tsx", root), "utf8"),
    readFile(new URL("app/SiteHeader.tsx", root), "utf8"),
    readFile(new URL("app/AnchorNavigation.tsx", root), "utf8"),
    readFile(new URL("app/SmartMapPage.tsx", root), "utf8"),
    readFile(new URL("app/CookieConsent.tsx", root), "utf8"),
    readFile(new URL("app/plan/RealRouteMap.tsx", root), "utf8"),
    readFile(new URL("public/data/countries/italy.geojson", root), "utf8"),
    readFile(new URL("public/data/countries/austria.geojson", root), "utf8"),
    readFile(new URL("public/data/countries/germany.geojson", root), "utf8"),
    readFile(new URL("public/robots.txt", root), "utf8"),
    readFile(new URL("public/.htaccess", root), "utf8"),
    readFile(new URL(".gitignore", root), "utf8"),
  ]);
  assert.match(layout, /index:\s*false/);
  assert.match(robots, /Allow:\s*\//);
  assert.doesNotMatch(robots, /Disallow:\s*\/\s*(?:\r?\n|$)/);
  assert.match(robots, /Sitemap: https:\/\/mlt-lifestyle\.com\/sitemap\.xml/);
  assert.match(htaccess, /X-Robots-Tag "noindex, nofollow, noarchive" "expr=/);
  assert.match(gitignore, /\.env\*/);
  assert.match(home, /collection-rail/);
  assert.match(home, /href=\{localPath\("\/smart-map\/"\)\}/);
  assert.match(header, /\/smart-map\//);
  assert.doesNotMatch(header, /t\.home|t\.about/);
  assert.match(anchors, /window\.scrollTo/);
  assert.match(anchors, /history\.replaceState/);
  assert.match(smartMap, /<RealRouteMap/);
  assert.match(smartMap, /<SiteFooter/);
  assert.match(cookies, /locales\.map\(\(language\)/);
  assert.match(cookies, /Ваша конфиденциальность/);
  assert.match(cookies, /location\.pathname\.split/);
  assert.match(map, /ResizeObserver/);
  assert.match(map, /aria-pressed/);
  assert.match(map, /map-status/);
  assert.match(map, /router\.project-osrm\.org\/route\/v1\/driving/);
  assert.match(map, /overview=full&geometries=geojson/);
  assert.match(home, /className="smart-map-canvas"/);
  for (const boundary of [italy, austria, germany]) assert.equal(JSON.parse(boundary).type, "FeatureCollection");
});

test("home hero keeps a persistent still while video waits until after page load", async () => {
  for (const pathname of ["/en/", "/en/mobile-site/"]) {
    const response = await render(pathname);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /class="light-hero-image hero-video-poster"[^>]+fetchPriority="high"/);
    assert.match(html, /<video[^>]+muted=""[^>]+preload="none"/);
    assert.doesNotMatch(html, /<video[^>]+autoPlay=/);
    assert.ok(html.indexOf("hero-video-poster") < html.indexOf("<video"));
    assert.match(html, /<source[^>]+media="\(max-width: 700px\)"[^>]+srcSet="\/hero-sunset-mobile-v4.webp"/);
    assert.match(html, /<source[^>]+media="\(max-width: 700px\)"[^>]+src="\/hero-sunset-mobile-v4.mp4"/);
    assert.match(html, /hero-sunset-desktop-v4.mp4/);
    assert.ok(html.indexOf("hero-sunset-mobile-v4.webm") < html.indexOf("hero-sunset-mobile-v4.mp4"));
    assert.ok(html.indexOf("hero-sunset-desktop-v4.webm") < html.indexOf("hero-sunset-desktop-v4.mp4"));
    assert.doesNotMatch(html, /hero-mediterranean-sunset(?:-loop-v2)?\.(?:mp4|webp)/);
    assert.match(html, /class="deferred-route-map"/);
    assert.doesNotMatch(html, /maplibregl-canvas/);
  }
});

test("acquisitions catalog and vehicle details are localized in every site language", async () => {
  const seed = JSON.parse(await readFile(new URL("public/data/acquisitions/mercedes-benz-v-300-marco-polo.json", root), "utf8"));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, ...options) => String(input) === "https://mlt-lifestyle.com/api/acquisitions.php" ? Response.json({ items: [{ ...seed, id: 1 }] }) : originalFetch(input, ...options);
  const labels = {
    en: ["Explore motorhomes", "Specifications", "Contact Manager"],
    de: ["Wohnmobile entdecken", "Technische Daten", "Ansprechpartner kontaktieren"],
    ru: ["Каталог автодомов", "Характеристики", "Связаться с менеджером"],
    it: ["Scopri i camper", "Dati tecnici", "Contatta il responsabile"],
    pl: ["Odkryj kampery", "Dane techniczne", "Skontaktuj się z opiekunem"],
  };
  try {
    for (const [locale, expected] of Object.entries(labels)) {
      const catalog = await (await render(`/${locale}/acquisitions/`)).text();
      assert.ok(catalog.includes(expected[0]));
      assert.match(catalog, new RegExp(`<a class="market-card" href="/${locale}/acquisitions/${seed.slug}/"`));
      const card = catalog.match(/<a class="market-card"[^>]*>[\s\S]*?<\/a>/)?.[0];
      assert.ok(card?.includes('class="market-card-spec"'), "The price and specification area must be inside the card link");
      assert.equal((card?.match(/<a /g) || []).length, 1, "No nested links");
      const detail = await (await render(`/${locale}/acquisitions/${seed.slug}/`)).text();
      assert.ok(detail.includes(expected[1]));
      assert.ok(detail.includes(expected[2]));
      if (locale !== "en") {
        assert.doesNotMatch(detail.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ""), /The seller describes|Source discrepancies requiring clarification|Parking distance control|Contact Manager|Back to acquisitions/);
        assert.doesNotMatch(catalog, /Search listed models|Clear filters|View details/);
      }
      assert.ok(detail.includes("Mercedes-Benz V 300 Marco Polo"));
      assert.ok(detail.includes('priceCurrency":"EUR"'));
    }
  } finally { globalThis.fetch = originalFetch; }
});

test("listing specifications show eight rows and retain the rest in a closed disclosure", async () => {
  const seed = JSON.parse(await readFile(new URL("public/data/acquisitions/mercedes-benz-v-300-marco-polo.json", root), "utf8"));
  const originalFetch = globalThis.fetch;
  let compact = false;
  globalThis.fetch = async (input, ...options) => String(input) === "https://mlt-lifestyle.com/api/acquisitions.php"
    ? Response.json({ items: [{ ...seed, id: 1, specifications_json: compact ? "[]" : seed.specifications_json }] }) : originalFetch(input, ...options);
  try {
    for (const locale of ["en", "ru"]) {
      const html = await (await render(`/${locale}/acquisitions/${seed.slug}/`)).text();
      const preview = html.match(/<dl class="listing-specifications-preview">([\s\S]*?)<\/dl>/)?.[1];
      assert.equal((preview?.match(/<dt>/g) || []).length, 8);
      const disclosure = html.match(/<details class="listing-specifications-more"[^>]*>[\s\S]*?<\/details>/)?.[0];
      assert.ok(disclosure);
      assert.doesNotMatch(disclosure, /^<details[^>]*\sopen(?:=|\s|>)/);
      assert.equal((disclosure.match(/<dt>/g) || []).length, JSON.parse(seed.specifications_json).length + 4 - 8);
      assert.match(html, /<aside class="listing-camper-equipment">/);
      assert.ok(html.includes(locale === "ru" ? "Все характеристики" : "All specifications"));
      assert.ok(html.includes(locale === "ru" ? "Свернуть характеристики" : "Collapse specifications"));
    }
    compact = true;
    const html = await (await render(`/en/acquisitions/${seed.slug}/`)).text();
    assert.doesNotMatch(html, /<details class="listing-specifications-more"/);
    assert.equal((html.match(/<dl class="listing-specifications-preview">([\s\S]*?)<\/dl>/)?.[1].match(/<dt>/g) || []).length, 4);
  } finally { globalThis.fetch = originalFetch; }
});

test("investment page translates headings, calculator and metadata for every site language",async()=>{
 const labels={en:"Full Management",ru:"Полное управление",de:"Umfassende Verwaltung",it:"Gestione completa",pl:"Pełne zarządzanie"};
 for(const [locale,label] of Object.entries(labels)){
  const html=await (await render(`/${locale}/investments/`)).text();
  assert.ok(html.includes(label),locale);
  if(locale!=="en"){assert.ok(!html.includes('>Investment Amount'),locale);assert.ok(!html.includes('>Calculate Returns<'),locale);assert.ok(!html.includes('>Investment Inquiry<'),locale);}
 }
});

test("legal pages translate content and metadata for every locale and use current company contacts", async () => {
  const copy = JSON.parse(await readFile(new URL("content/legal.json", root), "utf8"));
  for (const locale of ["en", "de", "ru", "it", "pl"]) {
    for (const slug of ["imprint", "privacy", "terms"]) {
      const response = await render(`/${locale}/legal/${slug}/`);
      assert.equal(response.status, 200);
      const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
      const page = copy[locale].pages[slug];
      assert.ok(html.includes(`<h1>${page.title}</h1>`), `${locale}/${slug}`);
      assert.ok(html.includes(`<title>${page.title} — MLT</title>`), `${locale}/${slug} metadata`);
      assert.ok(html.includes(`MLT / ${copy[locale].eyebrow}`));
      assert.equal((html.match(/<section>/g) || []).length, page.sections.length);
      assert.doesNotMatch(html, /Elena Bokova|dresden@mlt-maschinen\.de|www\.mlt-maschinen\.de|§ 5 TMG/);
      if (locale !== "de") assert.doesNotMatch(html, /Wir nehmen den Schutz|§ 1 Geltungsbereich|Vertretung/);
      if (slug !== "terms") assert.ok(html.includes('href="mailto:info@mlt-lifestyle.com"'));
      if (slug === "imprint") {
        assert.equal(page.sections.length, 5);
        assert.ok(html.includes('href="https://mlt-lifestyle.com"'));
        assert.ok(page.intro.includes("5 DDG"));
      }
    }
  }
});


test("all collections omit the legacy journey flow in every language and layout", async () => {
  for (const locale of ["en", "de", "ru", "it", "pl"]) {
    for (const slug of ["freedom", "signature", "concierge", "private", "honeymoon"]) {
      for (const suffix of ["", "mobile-site/", "mobile-preview/"]) {
        const route = '/' + locale + '/collections/' + slug + '/' + suffix;
        const response = await render(route);
        assert.equal(response.status, 200, route);
        const html = await response.text();
        assert.doesNotMatch(html, /class="detail-flow"|class="flow-grid"/, route);
        assert.ok(html.includes("#concierge-chat"), route + ' retains its contact action');
        assert.ok(html.includes('data-site-footer='), route + ' retains its footer');
      }
    }
  }
  for (const slug of ["freedom", "signature", "concierge", "private", "honeymoon"]) {
    const html = await (await render('/collections/' + slug + '/')).text();
    assert.doesNotMatch(html, /class="detail-flow"|class="flow-grid"/);
    assert.ok(html.includes('class="detail-intro"'));
    assert.ok(html.includes('class="detail-cta"'));
  }
});

test('customers see calculated payment amounts before confirmation in every supported language and layout',async()=>{
 for(const locale of ['en','de','ru','it','pl'])for(const slug of ['freedom','signature','concierge','private'])for(const suffix of ['','mobile-site/']){
  const route=`/${locale}/collections/${slug}/${suffix}`;const html=await(await render(route)).text();assert.match(html,/data-journey-costs/,route);assert.match(html,/1500|1[\s\u00a0\u202f,.]500|2000|2[\s\u00a0\u202f,.]000|3000|3[\s\u00a0\u202f,.]000/,route);
  if(slug==='freedom')assert.match(html,/298/,route+' advance');
  if(slug==='private')assert.match(html,/3[\s\u00a0\u202f,.]?980/,route+' advance');
 }
});
