import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../assets/Fast-Logo.gif";
import { useTranslation } from "../i18n/LanguageContext";
import { LANGUAGES } from "../i18n/translations";

function Navbar({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage } = useTranslation();

  return (
    <nav className="navbar">
      <Link to="/" className="brand" onClick={() => setIsMenuOpen(false)}>
        <img src={logo} alt="Jibli logo" className="logoImg" />
        <span>Jibli</span>
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

      <div className={isMenuOpen ? "navLinks open" : "navLinks"} onClick={() => setIsMenuOpen(false)}>
        {children}
        <div className="langSwitcher" role="group" aria-label="Language" onClick={(event) => event.stopPropagation()}>
          {LANGUAGES.map((option) => (
            <button
              type="button"
              key={option.value}
              className={option.value === language ? "langSwitcherBtn active" : "langSwitcherBtn"}
              onClick={() => setLanguage(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
