import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Menu, X } from "lucide-react";
import { useTranslation } from "../i18n/useTranslation";
import { LANGUAGES } from "../i18n/translations";

function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const dropdown = useRef<HTMLDetailsElement>(null);
  const selected = LANGUAGES.find((option) => option.value === language) ?? LANGUAGES[0];
  const label = language === "ar" ? "اللغة" : language === "fr" ? "Langue" : "Language";

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !dropdown.current?.contains(event.target)) {
        dropdown.current?.removeAttribute("open");
      }
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dropdown.current?.open) {
        dropdown.current.removeAttribute("open");
        dropdown.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  return <details className="languageSelect" ref={dropdown} onClick={(event) => event.stopPropagation()}>
    <summary className="languageTrigger" aria-label={`${label}: ${selected.name}`}>
      <img className="languageFlag" src={selected.flag} alt="" />
      <span lang={selected.value}>{selected.name}</span>
      <ChevronDown className="languageChevron" size={15} aria-hidden="true" />
    </summary>
    <div className="languageDropdown" role="group" aria-label={label}>
      <span className="languageDropdownLabel">{label}</span>
      {LANGUAGES.map((option) => <button key={option.value} type="button" className="languageOption" aria-pressed={language === option.value} onClick={() => {
        setLanguage(option.value);
        dropdown.current?.removeAttribute("open");
        dropdown.current?.querySelector("summary")?.focus();
      }}>
        <img className="languageFlag" src={option.flag} alt="" />
        <span lang={option.value} dir="auto">{option.name}</span>
        {language === option.value ? <Check size={16} aria-hidden="true" /> : <small>{option.label}</small>}
      </button>)}
    </div>
  </details>;
}

function Navbar({ children, hidePrimaryNav }: { children: ReactNode; hidePrimaryNav?: boolean }) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" className="brand" onClick={() => setIsMenuOpen(false)}>
        <img src="/Logo.png" alt="Jibli" className="logoImg" />
      </Link>

      <button
        type="button"
        className="navMenuToggle"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* display:contents on desktop so navPrimary/navActions become direct
          grid items of .navbar (for true full-width centering); on mobile
          this becomes a real box that the two stack inside as one dropdown,
          toggled together by isMenuOpen. */}
      <div className={isMenuOpen ? "navLinks open" : "navLinks"} onClick={() => setIsMenuOpen(false)}>
        {!hidePrimaryNav && (
          <div className="navPrimary">
            <Link to="/">{t("nav.home")}</Link>
            <Link to="/gaming">{t("nav.gaming")}</Link>
            <Link to="/invitations">{t("nav.invitations")}</Link>
            <Link to="/about">{t("nav.aboutUs")}</Link>
            <Link to="/contact">{t("nav.contact")}</Link>
          </div>
        )}
        <div className="navActions">
          {children}
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
