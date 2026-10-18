# Search visibility

Public pages are rendered to HTML by `npm run build`. Page titles, descriptions and the sitemap come from `src/searchPages.json`. Structured data comes from `shared/search.mjs`. Keep service descriptions accurate; do not add unsupported prices, reviews, ratings or business locations.

There are 15 public pages in each of English, French (`/fr`) and Arabic (`/ar`). Every localized page has a self-referencing canonical URL, reciprocal language alternates, and links within its language. The normal language selector remains available. Account and checkout routes, including their localized versions, are excluded from indexing.

## Register the website

1. In [Google Search Console](https://search.google.com/search-console/), add the domain property `jiblitunisia.com`. Copy Google's DNS verification TXT record to your DNS provider, then verify. A URL-prefix property for `https://www.jiblitunisia.com/` also works if domain verification is unavailable; its HTML verification file or meta tag must be added exactly as supplied.
2. Submit `https://www.jiblitunisia.com/sitemap.xml` in Sitemaps. Inspect the homepage, `/gaming`, `/invitations`, and important invitation categories; request indexing where appropriate.
3. In [Bing Webmaster Tools](https://www.bing.com/webmasters/), add the same site or import the verified Search Console property, then submit the sitemap.
4. Monitor indexed pages, crawl errors, search queries and clicks. Avoid submitting customer invitation links, account pages or checkout URLs.

Search Console and Bing verification require access to the owner's account and the exact verification record. The website cannot complete account verification by itself.

## AI search

`robots.txt` allows public pages and explicitly permits OpenAI's `OAI-SearchBot`. Search access is separate from model training access. No training-specific policy was changed. Public content and contact information are available in the HTML without JavaScript, with Organization, WebSite, WebPage and breadcrumb structured data.

Crawler access and structured data do not guarantee indexing, rankings, autocomplete suggestions, or citations in ChatGPT or other assistants. Useful content, genuine mentions and links from relevant websites, and consistent business information help discovery over time. Do not buy fake reviews or publish invented claims.

## Verification

Run `npm run lint`, `npm run build`, and `node scripts/test-search.mjs`. Test production HTML with JavaScript disabled, check canonical redirects and 404 responses, and ensure customer invitations retain `noindex` and their separate server endpoint.

References: [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [OpenAI crawlers](https://developers.openai.com/api/docs/bots).
