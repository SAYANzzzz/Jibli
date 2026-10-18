import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { invitationSharePath, invitationToken } from "../shared/invitation-links.mjs";

const origin = "https://www.jiblitunisia.com";
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

async function invitationTemplate() {
  const candidates = [new URL("../dist/_app.html", import.meta.url), join(process.cwd(), "dist", "_app.html"), join(process.cwd(), "Jibli", "dist", "_app.html"), new URL("../dist/index.html", import.meta.url), join(process.cwd(), "dist", "index.html"), join(process.cwd(), "Jibli", "dist", "index.html")];
  for (const path of candidates) {
    try { return await readFile(path, "utf8"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  throw new Error("Invitation HTML was not bundled.");
}

export function invitationHead(template, invitation, path) {
  const details = invitation?.details || {};
  const name = details.couple?.trim() || details.name?.trim() || invitation?.title;
  const language = details.language?.toLowerCase() || "";
  const label = language.startsWith("arabic") ? "دعوة من Jibli" : language.startsWith("french") ? "Invitation par Jibli" : "Invitation by Jibli";
  const title = name ? `${name} | ${label}` : "Your invitation | Jibli";
  const description = "A personal invitation, created with care by Jibli. Open the envelope to discover your invitation. Une invitation personnelle, créée avec soin. دعوة خاصة لكم من جيبلي.";
  const canonical = `${origin}${invitation ? invitationSharePath(path, invitation) : path}`;
  const image = `${origin}/invitations/jibli-invitation-preview.png`;
  // Replace homepage metadata so crawlers see exactly one invitation preview.
  const clean = template.replace(/<title>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+|description)["'][^>]*>/gi, "")
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, "")
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, "");
  const metadata = `<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${escape(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Jibli Invitations">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${escape(canonical)}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Jibli — Your personal invitation">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${image}">`;
  return clean.replace("</head>", `${metadata}\n</head>`);
}

export function invitationBootstrap(invitation, token) {
  if (!invitation) return "";
  const data = JSON.stringify({ token, invitation }).replace(/[<>&\u2028\u2029]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  return `<script id="jibli-invitation-data" type="application/json">${data}</script>`;
}

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("token") ? `/invite/${url.searchParams.get("token")}`
    : url.searchParams.get("slug") ? `/invitation/${url.searchParams.get("slug")}` : url.pathname;
  const token = invitationToken(path);
  if (!token) return new Response("Invitation not found.", { status: 404 });
  let invitation = null;
  let status = 200;
  try {
    const api = process.env.VITE_API_URL;
    if (api && /^https:\/\//.test(api)) {
      const result = await fetch(`${api.replace(/\/$/, "")}/invitations/${token}`, { signal: AbortSignal.timeout(3500), cache: "no-store" });
      if (result.ok) invitation = (await result.json()).invitation;
      else if (result.status === 404) status = 404;
    }
    const template = await invitationTemplate();
    return new Response(invitationHead(template, invitation, path).replace("</head>", `${invitationBootstrap(invitation, token)}</head>`), { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch (error) {
    console.error("Invitation preview unavailable:", error.name);
    try {
      const template = await invitationTemplate();
      return new Response(invitationHead(template, null, path), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" } });
    } catch { return new Response("Invitation temporarily unavailable.", { status: 503 }); }
  }
}

export async function HEAD(request) {
  const result = await GET(request);
  return new Response(null, { status: result.status, headers: result.headers });
}
