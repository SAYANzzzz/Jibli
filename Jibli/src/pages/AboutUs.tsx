import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { getCurrentSession } from "../auth";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import { supabase } from "../supabase";
import { useTranslation } from "../i18n/LanguageContext";

function AboutUs() {
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
          <h1>{t("about.title")}</h1>
          <p>{t("about.comingSoonNotice")}</p>
        </div>
      </main>
    </div>
  );
}

export default AboutUs;
