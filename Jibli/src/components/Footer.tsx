import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext";

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="siteFooter">
      <div className="siteFooterTop">
        <div className="siteFooterBrand">
          <img src="/Logo.png" alt="Jibli" className="logoImg" />
          <p>{t("footer.tagline")}</p>
          <p className="mutedText">{t("footer.basedIn")}</p>
        </div>

        <div className="siteFooterCol">
          <strong>{t("footer.linksTitle")}</strong>
          <Link to="/">{t("footer.home")}</Link>
          <Link to="/gaming">{t("footer.gaming")}</Link>
          <Link to="/about">{t("footer.aboutUs")}</Link>
          <Link to="/contact">{t("footer.contact")}</Link>
        </div>

        <div className="siteFooterCol">
          <strong>{t("footer.legalTitle")}</strong>
          <Link to="/terms">{t("footer.terms")}</Link>
          <Link to="/privacy">{t("footer.privacy")}</Link>
          <Link to="/refund">{t("footer.refund")}</Link>
        </div>

        <div className="siteFooterCol">
          <strong>{t("footer.contactTitle")}</strong>
          <a href="https://wa.me/21692001397" target="_blank" rel="noreferrer">WhatsApp</a>
          <a href="mailto:jiblitunisia@gmail.com">jiblitunisia@gmail.com</a>
          <a href="https://www.instagram.com/jibli.tunisia" target="_blank" rel="noreferrer">Instagram</a>
        </div>
      </div>

      <div className="siteFooterBottom">
        <span>© {year} Jibli. {t("footer.rights")}</span>
      </div>
    </footer>
  );
}

export default Footer;
