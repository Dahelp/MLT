import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

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
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>MLT .* Individual Road Expeditions<\/title>/);
  assert.match(html, /name="robots" content="noindex, nofollow, nocache"/);
  assert.match(html, /MLT Smart Map/);
  assert.match(html, /Four ways to travel/i);
  assert.match(html, /MLT Freedom Collection/i);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("renders all public MVP routes", async () => {
  const routes = [
    "/plan", "/proposal",
    "/collections/freedom", "/collections/signature", "/collections/concierge", "/collections/private",
    "/fleet/explorer", "/fleet/granduca", "/fleet/compatto",
    "/legal/imprint", "/legal/privacy", "/legal/terms",
  ];
  for (const route of routes) {
    const response = await render(route);
    assert.equal(response.status, 200, `${route} should render`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  }
});

test("keeps safeguards and critical interactions in source", async () => {
  const [layout, home, planner, map, robots, htaccess, gitignore] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/plan/page.tsx", root), "utf8"),
    readFile(new URL("app/plan/RealRouteMap.tsx", root), "utf8"),
    readFile(new URL("public/robots.txt", root), "utf8"),
    readFile(new URL("public/.htaccess", root), "utf8"),
    readFile(new URL(".gitignore", root), "utf8"),
  ]);
  assert.match(layout, /index:\s*false/);
  assert.match(robots, /Disallow:\s*\//);
  assert.match(htaccess, /X-Robots-Tag "noindex, nofollow, noarchive"/);
  assert.match(gitignore, /\.env\*/);
  assert.match(home, /collection-rail/);
  assert.match(home, /mlt-brand-film\.mp4/);
  assert.match(home, /localStorage\.setItem\("mlt-locale"/);
  assert.match(home, /href="\/plan"/);
  assert.match(planner, /mlt-journey-draft/);
  assert.match(planner, /disabled=\{submitting\}/);
  assert.match(map, /ResizeObserver/);
  assert.match(map, /aria-pressed/);
  assert.match(map, /map-status/);
});
