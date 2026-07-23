import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, LogIn, UserPlus } from "lucide-react";
import { getCurrentSession } from "../auth";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import Footer from "../components/Footer";
import { supabase } from "../supabase";
import { useTranslation } from "../i18n/LanguageContext";

function NotFound() {
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

      <main className="page notFoundPage">
        <div className="center">
          <span className="notFoundCode">404</span>
          <h1>{t("notFound.title")}</h1>
          <p>{t("notFound.text")}</p>
          <Link to="/" className="primaryBtn"><Home size={16} /> {t("notFound.backHome")}</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default NotFound;
