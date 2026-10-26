import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = process.env.MLT_EXPORT_DIR
  ? path.resolve(root, process.env.MLT_EXPORT_DIR)
  : path.join(root, "static-export");
const port = 4173;
const origin = `http://127.0.0.1:${port}`;
const pageRoutes = [
  "",
  "/account",
  "/account/documents",
  "/account/journeys",
  "/account/profile",
  "/account/vouchers",
  "/vouchers",
  "/plan",
  "/proposal",
  "/collections/freedom",
  "/collections/signature",
  "/collections/concierge",
  "/collections/private",
  "/collections/honeymoon",
  "/collections/proposal",
  "/legal/imprint",
  "/legal/privacy",
  "/legal/terms",
];
const locales = ["en", "de", "ru", "it", "pl"];
// Each public listing has its own HTML document, never the catalog's document.
const inventoryResponse = await fetch("https://mlt-lifestyle.com/api/acquisitions.php", { signal: AbortSignal.timeout(30000) });
if (!inventoryResponse.ok) throw new Error(`Cannot export listing URLs: ${inventoryResponse.status}`);
const inventory = await inventoryResponse.json();
if (!Array.isArray(inventory.items)) throw new Error("Invalid acquisition inventory");
const listingSlugs = [...new Set(inventory.items.map(item => item.slug))];
if (listingSlugs.some(slug => typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug))) throw new Error("Invalid acquisition slug");
const mobilePreviewCollections = ["freedom", "signature", "concierge", "private", "honeymoon"];
const isMobileRoute = (route) => route === "/mobile-preview"
  || /\/(mobile-preview|mobile-site)$/.test(route);
const routes = [
  "/",
  "/mobile-preview",
  "/concierge",
  "/concierge/overview",
  "/concierge/applications",
  "/concierge/payments",
  "/concierge/catalog",
  "/concierge/chat",
  "/concierge/team",
  "/admin",
  "/admin/overview",
  "/admin/applications",
  "/admin/payments",
  "/admin/catalog",
  "/admin/base-location",
  "/scout-passport",
  "/admin/acquisitions",
  "/admin/team",
  "/admin/chat",
  "/manager",
  "/manager/chat",
  "/manager/catalog",
  "/sales",
  "/sales/chat",
  "/sales/catalog",
  "/sales/investments",
  "/admin/investments",
  "/admin/users",
  "/admin/vouchers",
  "/sales/acquisitions",
  ...pageRoutes.filter(Boolean),
  ...locales.flatMap((locale) => pageRoutes.map((route) => `/${locale}${route}`)),
  ...locales.flatMap((locale) => [`/${locale}/investments`, `/${locale}/acquisitions`, `/${locale}/contact`, `/${locale}/about`, `/${locale}/smart-map`]),
  ...locales.flatMap(locale => listingSlugs.map(slug => `/${locale}/acquisitions/${slug}`)),
  ...locales.map((locale) => `/${locale}/scout-passport`),
  ...locales.map((locale) => `/${locale}/mobile-preview`),
  ...locales.flatMap((locale) => mobilePreviewCollections.map((slug) => `/${locale}/collections/${slug}/mobile-preview`)),
  ...locales.map((locale) => `/${locale}/mobile-site`),
  ...locales.flatMap((locale) => mobilePreviewCollections.map((slug) => `/${locale}/collections/${slug}/mobile-site`)),
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, "dist", "client"), output, { recursive: true });

const server = spawn(process.execPath, [
  path.join(root, "node_modules", "vinext", "dist", "cli.js"),
  "start",
  "--port",
  String(port),
], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });

let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error(`Preview server did not start.\n${serverLog}`);

  for (const route of routes) {
    const response = await fetch(`${origin}${route}`);
    if (!response.ok) throw new Error(`Failed to render ${route}: ${response.status}`);
    let html = await response.text();
    if (/\/(en|de|ru|it|pl)\/acquisitions\/[a-z0-9-]+$/.test(route) && (!html.includes('class="listing-heading') || html.includes('class="market-hero'))) {
      throw new Error(`Listing URL did not render its detail document: ${route}`);
    }
    if (isMobileRoute(route)) {
      html = html.replace(
        /(<meta\s+name=["']viewport["']\s+content=["'][^"']*)(["'])/i,
        (match, content, quote) => content.includes("viewport-fit=")
          ? match
          : `${content}, viewport-fit=cover${quote}`,
      );
    }
    const target = route === "/"
      ? path.join(output, "index.html")
      : path.join(output, route.slice(1), "index.html");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, "utf8");
  }
} finally {
  server.kill();
}

console.log(`Static preview exported to ${output}`);
