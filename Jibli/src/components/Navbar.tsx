import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../assets/Fast-Logo.gif";

function Navbar({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      </div>
    </nav>
  );
}

export default Navbar;
