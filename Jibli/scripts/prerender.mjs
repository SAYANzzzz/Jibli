import { searchStructuredData } from "../shared/search.mjs";
import { createServer } from "vite";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import pages from "../src/searchPages.json" with { type: "json" };

const origin = "https://www.jiblitunisia.com";
const escape = value => String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
const json = value => JSON.stringify(value).replace(/</g, "\\u003c");
const template = await readFile("dist/index.html", "utf8");
await writeFile("dist/_app.html", template.replace("</head>", '<meta name="robots" content="noindex, nofollow"></head>'));
const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { render } = await server.ssrLoadModule("/src/entry-prerender.tsx");
  for (const [path, page] of Object.entries(pages)) {
    const canonical = origin + path;
    let html=template.replace(/<title>[\s\S]*?<\/title>/gi,"")
      .replace(/<meta\b[^>]*(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+|description|robots)["'][^>]*>/gi,"")
      .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,"")
      .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,"");
    const metadata=`<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
${["en","fr","ar","x-default"].map(language=>`<link rel="alternate" hreflang="${language}" href="${origin}${language==="en"||language==="x-default"?page.basePath:`/${language}${page.basePath==="/"?"":page.basePath}`}">`).join("\n")}
<meta property="og:type" content="website"><meta property="og:site_name" content="Jibli">
<meta property="og:url" content="${canonical}"><meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}"><meta property="og:image" content="${origin}/og-image.png">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(page.title)}">
<meta name="twitter:description" content="${escape(page.description)}"><meta name="twitter:image" content="${origin}/og-image.png">
<script id="jibli-search-data" type="application/ld+json">${json(searchStructuredData(path, page))}</script>`;
    html=html.replace('<html lang="en">',`<html lang="${page.language}" dir="${page.language==="ar"?"rtl":"ltr"}">`).replace("</head>",metadata+"\n</head>").replace('<div id="root"></div>',`<div id="root">${await render(path)}</div>`);
    const output=join("dist",path==="/"?"index.html":path.slice(1)+"/index.html");
    await mkdir(dirname(output),{recursive:true}); await writeFile(output,html);
  }
  await writeFile("dist/404.html", template.replace(/<title>[\s\S]*?<\/title>/i,"<title>Page not found | Jibli</title>").replace("</head>",'<meta name="robots" content="noindex, nofollow"></head>').replace('<div id="root"></div>',`<div id="root">${await render("/404")}</div>`));
  await writeFile("dist/sitemap.xml",`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(pages).map(path=>`\n  <url><loc>${origin}${path}</loc></url>`).join("")}\n</urlset>\n`);
  console.log(`Prerendered ${Object.keys(pages).length} public pages with unique metadata and structured data.`);
} finally { await server.close(); }
