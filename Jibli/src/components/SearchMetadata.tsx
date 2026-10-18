import { searchStructuredData } from "../../shared/search.mjs";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import pages from "../searchPages.json";

const origin = "https://www.jiblitunisia.com";

/** Keep SPA navigation consistent with the HTML produced for direct visits. */
export default function SearchMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const fullPath = window.location.pathname.replace(/\/$/, "") || "/";
    const page = pages[fullPath as keyof typeof pages];
    // Guest invitation metadata belongs to the invitation endpoint and viewer.
    if (/^\/invit(?:e|ation)\//.test(pathname)) {
      document.getElementById("jibli-search-data")?.remove();
      return;
    }
    const meta = (attribute: "name" | "property", key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key); document.head.append(element); }
      element.content = content;
    };
    meta("name", "robots", page ? "index, follow, max-image-preview:large" : "noindex, nofollow");
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!page) {
      document.title = "Jibli";
      canonical?.remove();
      document.getElementById("jibli-search-data")?.remove();
      return;
    }
    document.title = page.title;
    meta("name", "description", page.description);
    meta("property", "og:title", page.title);
    meta("property", "og:description", page.description);
    meta("property", "og:url", origin + fullPath);
    meta("name", "twitter:title", page.title);
    meta("name", "twitter:description", page.description);
    const link = canonical || document.createElement("link");
    link.rel = "canonical"; link.href = origin + fullPath;
    if (!canonical) document.head.append(link);
    let script = document.getElementById("jibli-search-data");
    if (!script) { script = document.createElement("script"); script.id = "jibli-search-data"; script.setAttribute("type", "application/ld+json"); document.head.append(script); }
    script.textContent = JSON.stringify(searchStructuredData(fullPath, page));
    document.head.querySelectorAll('link[hreflang]').forEach(element => element.remove());
    for (const language of ["en", "fr", "ar", "x-default"]) {
      const alternate = document.createElement("link");
      alternate.rel = "alternate"; alternate.hreflang = language;
      alternate.href = origin + (language === "en" || language === "x-default" ? page.basePath : `/${language}${page.basePath === "/" ? "" : page.basePath}`);
      document.head.append(alternate);
    }
  }, [pathname]);
  return null;
}
