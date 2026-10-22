import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

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

test("renders the light MLT experience with noindex metadata", async () => {
  const redirect = await render("/");
  assert.equal(redirect.status, 307);
  assert.equal(new URL(redirect.headers.get("location"), "http://localhost").pathname, "/en/");
  const response = await render("/en/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>MLT .* Individual Road Expeditions<\/title>/);
  assert.match(html, /name="robots" content="noindex, nofollow, nocache"/);
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
    "/en/collections/freedom/", "/en/collections/signature/", "/en/collections/concierge/", "/en/collections/private/", "/en/collections/honeymoon/", "/en/collections/proposal/",
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
  assert.match(robots, /Disallow:\s*\//);
  assert.match(htaccess, /X-Robots-Tag "noindex, nofollow, noarchive"/);
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

test("home hero keeps a persistent still beneath native autoplay and defers the map", async () => {
  for (const pathname of ["/en/", "/en/mobile-site/"]) {
    const response = await render(pathname);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /class="light-hero-image hero-video-poster"[^>]+fetchPriority="high"/);
    assert.match(html, /<video[^>]+autoPlay=""[^>]+muted=""/);
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
