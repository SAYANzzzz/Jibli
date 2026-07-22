import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Link as LinkIcon,
  CreditCard,
  Gamepad2,
  LogIn,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserPlus,
  Zap,
} from "lucide-react";
import { getCurrentSession } from "../auth";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import { supabase } from "../supabase";
import { useTranslation } from "../i18n/LanguageContext";

function Home() {
  const { t } = useTranslation();
  const [productLink, setProductLink] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

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

  const handlePriceRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLink = productLink.trim();

    navigate(trimmedLink ? `/request?link=${encodeURIComponent(trimmedLink)}` : "/request");
  };

  return (
    <div>
      <Navbar>
        {isAuthenticated ? (
          <>
            <Link to="/tracking#panier" className="outlineBtn"><ShoppingCart size={16} /> {t("nav.panier")}</Link>
            <ProfileNavLink />
          </>
        ) : (
          <>
            <Link to="/login" className="outlineBtn"><LogIn size={16} /> {t("nav.login")}</Link>
            <Link to="/register" className="primaryBtn"><UserPlus size={16} /> {t("nav.register")}</Link>
          </>
        )}
      </Navbar>

      <section className="hero">
        <div className="heroText">
          <h1>
            {t("home.heroTitle1")} <br />
            <span className="heroAccent">{t("home.heroTitle2")}</span>
          </h1>

          <p>{t("home.heroSubtitle")}</p>

          <form className="linkBox" onSubmit={handlePriceRequest}>
            <LinkIcon size={18} />
            <input
              value={productLink}
              onChange={(event) => setProductLink(event.target.value)}
              placeholder={t("home.linkPlaceholder")}
            />
            <button type="submit">{t("home.getMyPrice")}</button>
          </form>

        </div>
      </section>

      <section className="trustBar">
        <div className="trustBarItem">
          <Zap size={18} />
          <span>{t("home.trust1")}</span>
        </div>
        <span className="trustBarDivider" />
        <div className="trustBarItem">
          <ShieldCheck size={18} />
          <span>{t("home.trust2")}</span>
        </div>
        <span className="trustBarDivider" />
        <div className="trustBarItem">
          <PackageSearch size={18} />
          <span>{t("home.trust3")}</span>
        </div>
      </section>

      <div className="shopNowWrap">
        <Link to="/request" className="shopNowBtn">
          <ShoppingCart size={16} /> {t("home.shopNow")}
        </Link>
      </div>

      <section className="section">
        <h2>{t("home.howItWorks")}</h2>

        <div className="steps">
          <div className="step">
            <div className="stepIcon"><LinkIcon /></div>
            <h3>{t("home.step1Title")}</h3>
            <p>{t("home.step1Text")}</p>
          </div>

          <div className="step">
            <div className="stepIcon"><CreditCard /></div>
            <h3>{t("home.step2Title")}</h3>
            <p>{t("home.step2Text")}</p>
          </div>

          <div className="step">
            <div className="stepIcon"><ShieldCheck /></div>
            <h3>{t("home.step3Title")}</h3>
            <p>{t("home.step3Text")}</p>
          </div>

          <div className="step">
            <div className="stepIcon"><Truck /></div>
            <h3>{t("home.step4Title")}</h3>
            <p>{t("home.step4Text")}</p>
          </div>
        </div>
      </section>

      <section className="section gamingTeaserSection">
        <h2>{t("home.gamingSectionTitle")}</h2>
        <p className="gamingTeaserText">{t("home.gamingSectionText")}</p>

        <div className="gamingTeaserLogos">
          <img src="/games/league-of-legends.jpg" alt="League of Legends" />
          <img src="/games/valorant.jpg" alt="Valorant" />
          <img src="/games/freefire.jpg" alt="Free Fire" />
          <img src="/games/roblox.png" alt="Roblox" />
          <img src="/games/chess.jpg" alt="Chess.com" />
          <img src="/games/spotify.png" alt="Spotify" />
        </div>

        <Link to="/gaming" className="primaryBtn gamingTeaserBtn"><Gamepad2 size={16} /> {t("home.exploreGaming")}</Link>
      </section>
    </div>
  );
}

export default Home;
