import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, MessageCircle, Mail, Camera, UserPlus } from "lucide-react";
import { getCurrentSession } from "../auth";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import { supabase } from "../supabase";
import { useTranslation } from "../i18n/LanguageContext";

const ADMIN_WHATSAPP_NUMBER = "21692001397";
const CONTACT_EMAIL = "jiblitunisia@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/jibli.tunisia";

function Contact() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getCurrentSession()
      .then((session) => setIsAuthenticated(Boolean(session)))
      .catch(() => setIsAuthenticated(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <Navbar>
        {isAuthenticated ? (
          <ProfileNavLink />
        ) : (
          <>
            <Link to="/login" className="outlineBtn"><LogIn size={16} /> {t("nav.login")}</Link>
            <Link to="/register" className="primaryBtn"><UserPlus size={16} /> {t("nav.register")}</Link>
          </>
        )}
      </Navbar>

      <main className="page">
        <div className="center trackingIntro">
          <h1>{t("contact.title")}</h1>
          <p>{t("contact.subtitle")}</p>
        </div>

        <div className="contactGrid">
          <a
            className="card contactCard"
            href={`https://wa.me/${ADMIN_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
          >
            <span className="contactCardIcon">
              <MessageCircle size={26} />
            </span>
            <h3>{t("contact.whatsappTitle")}</h3>
            <p>{t("contact.whatsappText")}</p>
            <span className="contactCardBtn">{t("contact.whatsappBtn")}</span>
          </a>

          <a className="card contactCard" href={`mailto:${CONTACT_EMAIL}`}>
            <span className="contactCardIcon">
              <Mail size={26} />
            </span>
            <h3>{t("contact.emailTitle")}</h3>
            <p>{t("contact.emailText")}</p>
            <span className="contactCardBtn">{CONTACT_EMAIL}</span>
          </a>

          <a className="card contactCard" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            <span className="contactCardIcon">
              <Camera size={26} />
            </span>
            <h3>{t("contact.instagramTitle")}</h3>
            <p>{t("contact.instagramText")}</p>
            <span className="contactCardBtn">@jibli.tunisia</span>
          </a>
        </div>
      </main>
    </div>
  );
}

export default Contact;
