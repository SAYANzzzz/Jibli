import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext";
import pages from "./searchPages.json";
import type { Language } from "./i18n/translations";

const modules = import.meta.glob<{ default: React.ComponentType }>("./pages/*.tsx");

/** Build only public pages, with no sessions, customer drafts or API calls. */
export async function render(path: keyof typeof pages | "/404") {
  const load = modules[`./pages/${path === "/404" ? "NotFound" : pages[path].component}.tsx`];
  if (!load) throw new Error(`Missing public page: ${path}`);
  const { default: Page } = await load();
  const language = path === "/404" ? "en" : pages[path].language as Language;
  const basename = language === "en" ? undefined : `/${language}`;
  return renderToString(<StaticRouter location={path} basename={basename}><LanguageProvider initialLanguage={language}>{createElement(Page)}</LanguageProvider></StaticRouter>);
}
