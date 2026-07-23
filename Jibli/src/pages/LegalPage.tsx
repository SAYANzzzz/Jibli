import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";
import { getCurrentSession } from "../auth";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import Footer from "../components/Footer";
import { supabase } from "../supabase";
import { useTranslation } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";

function LegalPage({ namespace, sectionCount }: { namespace: string; sectionCount: number }) {
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

  const sections = Array.from({ length: sectionCount }, (_, index) => index + 1);

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
          <h1>{t(`${namespace}.title` as TranslationKey)}</h1>
          <p className="mutedText">{t(`${namespace}.updated` as TranslationKey)}</p>
        </div>

        <div className="aboutContent legalContent">
          <p>{t(`${namespace}.intro` as TranslationKey)}</p>

          {sections.map((n) => (
            <section key={n}>
              <h2>{t(`${namespace}.s${n}Title` as TranslationKey)}</h2>
              <p>{t(`${namespace}.s${n}Body` as TranslationKey)}</p>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default LegalPage;
