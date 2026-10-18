import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pages from "../src/searchPages.json" with { type: "json" };

const origin = "https://www.jiblitunisia.com";
const sitemap = await readFile("dist/sitemap.xml", "utf8");
const robots = (await readFile("dist/robots.txt", "utf8")).replace(/\r\n/g, "\n");
const config = JSON.parse(await readFile("vercel.json", "utf8"));
const titles = new Set();
for (const [path, page] of Object.entries(pages)) {
  const file = path === "/" ? "dist/index.html" : `dist${path}/index.html`;
  const html = await readFile(file, "utf8");
  assert.equal((html.match(/<title>/g) || []).length, 1, path);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1, path);
  assert(html.includes(`href="${origin}${path}"`), path);
  assert(html.includes('content="index, follow, max-image-preview:large"'), path);
  assert(!html.includes('content="noindex'), path);
  assert(html.includes("<h1"), `${path}: missing rendered page heading`);
  assert(html.includes('class="siteFooter"'), `${path}: missing rendered content`);
  const data = JSON.parse(html.match(/<script id="jibli-search-data" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const webpage = data["@graph"].find(node => node["@type"] === "WebPage");
  assert.equal(webpage.url, origin + path);
  assert.equal(webpage.name, page.title);
  assert.equal(webpage.inLanguage, page.language);
  assert(html.includes(`<html lang="${page.language}"`));
  for (const language of ["en", "fr", "ar", "x-default"]) assert(html.includes(`hreflang="${language}"`), path);
  assert(!titles.has(page.title)); titles.add(page.title);
  assert(sitemap.includes(`<loc>${origin}${path}</loc>`));
  if (path !== "/") assert(config.rewrites.some(rule => rule.source === path && rule.destination === `${path}/index.html`));
}
for (const path of ["/login", "/register", "/admin", "/account", "/payment", "/tracking"]) {
  assert(!sitemap.includes(`<loc>${origin}${path}</loc>`));
  assert(config.headers.some(rule => rule.source === path && rule.headers.some(header => header.key === "X-Robots-Tag" && header.value.includes("noindex"))));
}
assert(!sitemap.includes("/invite/"));
assert(robots.includes("User-agent: OAI-SearchBot\nAllow: /"));
assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`));
assert((await readFile("dist/_app.html", "utf8")).includes('<div id="root"></div>'));
assert((await readFile("dist/404.html", "utf8")).includes('content="noindex, nofollow"'));
assert(!config.rewrites.some(rule => rule.source === "/(.*)"));
assert.equal(config.functions["api/invitation.mjs"].includeFiles, "dist/_app.html");
console.log(`PASS: ${titles.size} prerendered pages, unique metadata, schema, sitemap, crawler access and private-route exclusions.`);
