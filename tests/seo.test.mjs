import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { createSitemap, finalizeSeoHtml } from "../scripts/seo-export.mjs";

const pages = JSON.parse(await fs.readFile(new URL("../content/seo-pages.json", import.meta.url), "utf8"));
const {default:worker} = await import("../dist/server/index.js");
const decode = s => s.replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_,h,d)=>String.fromCodePoint(parseInt(h||d,h?16:10))).replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&apos;/g,"'");
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1].toLowerCase(),decode(m[2])]));
async function render(pathname) { return worker.fetch(new Request(`http://localhost${pathname}`, {headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}}); }
function headData(html){const head=html.split(/<\/head>/i)[0];return {head,title:decode(head.match(/<title>(.*?)<\/title>/)?.[1]||""),meta:[...head.matchAll(/<meta\b[^>]*>/g)].map(m=>attrs(m[0])),links:[...head.matchAll(/<link\b[^>]*>/g)].map(m=>attrs(m[0]))};}

test("all localized public documents have the intended metadata and self canonical",async()=>{
 assert.equal(Object.keys(pages).length,75);
 for(const [pathname,p] of Object.entries(pages)){
  const response=await render(pathname);assert.equal(response.status,200,pathname);
  const html=await response.text(),data=headData(html),meta=name=>data.meta.find(m=>m.name===name)?.content;
  assert.equal(data.title,p.title,pathname);assert.equal(meta("description"),p.description,pathname);
  assert.deepEqual(meta("keywords")?.split(",").map(s=>s.trim()),p.keywords,pathname);
  assert.match(meta("robots")||"",/^index, follow$/,pathname);
  assert.doesNotMatch(meta("googlebot")||"",/noindex|nofollow|noimageindex/,pathname);
  assert.deepEqual(data.links.filter(l=>l.rel==="canonical").map(l=>l.href),["https://mlt-lifestyle.com"+pathname],pathname);
  assert.equal(data.links.filter(l=>l.rel==="alternate"&&l.hreflang).length,6,pathname);
  assert.equal(data.meta.find(m=>m.property==="og:url")?.content,"https://mlt-lifestyle.com"+pathname,pathname);
  assert.equal(p.googleAverageMonthlySearches,null,"Do not fabricate Google frequency data");
 }
});

test("mobile responses preserve the primary document SEO and remain indexable",async()=>{
 for(const [pathname,p] of Object.entries(pages).filter(([,p])=>p.key==="home"||p.key.startsWith("collections/"))){
  const response=await render(pathname+"mobile-site/");assert.equal(response.status,200,pathname);
  const data=headData(await response.text());assert.equal(data.title,p.title,pathname);
  assert.equal(data.links.find(l=>l.rel==="canonical")?.href,"https://mlt-lifestyle.com"+pathname,pathname);
  assert.equal(data.meta.find(m=>m.name==="robots")?.content,"index, follow",pathname);
 }
});

test("utility pages stay noindex and invalid collections return a real 404",async()=>{
 for(const route of ["/en/account/","/ru/account/profile/","/en/proposal/","/de/scout-passport/","/admin/","/concierge/","/manager/","/sales/","/en/mobile-preview/","/en/collections/private/mobile-preview/"]){
  const response=await render(route);assert.equal(response.status,200,route);
  const data=headData(await response.text());assert.match(data.meta.find(m=>m.name==="robots")?.content||"",/noindex/,route);
 }
 for(const route of ["/en/collections/proposal/","/ru/collections/missing/","/en/legal/missing/"])assert.equal((await render(route)).status,404,route);
});

test("sitemap contains only canonical public URLs with language alternates",()=>{
 const xml=createSitemap(["mercedes-benz-v-300-marco-polo"]);
 const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,80);assert.equal(new Set(urls).size,80);
 assert.doesNotMatch(xml,/mobile-site|mobile-preview|account|proposal|scout-passport/);
 assert.match(xml,/hreflang="x-default"/);assert.throws(()=>createSitemap(["bad&slug"]));
 const html=finalizeSeoHtml('<html lang="en"><head><title>Private</title><meta name="robots" content="noindex, nofollow"/></head></html>',"/ru/account");
 assert.match(html,/<html lang="ru">/);assert.match(html,/href="https:\/\/mlt-lifestyle.com\/ru\/account\/"/);assert.match(html,/noindex, nofollow/);
 const mobile=finalizeSeoHtml('<html lang="en"><head><link rel="canonical" href="https://mlt-lifestyle.com/de/"/></head></html>',"/de/mobile-site");
 assert.equal((mobile.match(/rel="canonical"/g)||[]).length,1);assert.match(mobile,/href="https:\/\/mlt-lifestyle.com\/de\/"/);
});
