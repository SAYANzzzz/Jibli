import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/translations";

function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((option) => option.value === language) ?? LANGUAGES[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="langSwitcher" ref={wrapRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="langSwitcherToggle"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <img src={current.flag} alt="" className="langFlag" />
        <span>{current.label}</span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <ul className="langSwitcherMenu" role="listbox">
          {LANGUAGES.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === language}
                className={option.value === language ? "langSwitcherOption active" : "langSwitcherOption"}
                onClick={() => {
                  setLanguage(option.value);
                  setIsOpen(false);
                }}
              >
                <img src={option.flag} alt="" className="langFlag" />
                <span>{option.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
