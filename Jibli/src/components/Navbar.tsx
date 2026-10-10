import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "../i18n/useTranslation";
import { LANGUAGES } from "../i18n/translations";

function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  return <label className="languageSelect"><span className="srOnly">Language</span><select aria-label="Language" value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>{LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.name}</option>)}</select></label>;
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
