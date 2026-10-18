import { optimizedImage } from "../optimizedImage";
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
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";
import { supabase } from "../supabase";
import { useTranslation } from "../i18n/useTranslation";

const serviceIntro = {
  en: { title: "Shopping, gaming and invitations in Tunisia", cards: [
    ["International shopping", "Send an AliExpress, Shein or Temu product link to request a price in Tunisian dinars. Review your quote and follow your order from your Jibli account.", "/request"],
    ["Gaming top-ups and gift cards", "Browse Robux, Valorant Points, Free Fire, Steam and other gaming products. Ask us on WhatsApp for current prices and availability for your platform and account region.", "/gaming"],
    ["Personalised digital invitations", "Choose a wedding, engagement, birthday or celebration design. Enter your event details, preview your card and share your published invitation link with guests.", "/invitations"],
  ] },
  fr: { title: "Achats, gaming et invitations en Tunisie", cards: [
    ["Achats à l’international", "Envoyez un lien AliExpress, Shein ou Temu pour demander un prix en dinars tunisiens. Consultez votre devis et suivez votre commande depuis votre compte Jibli.", "/request"],
    ["Recharges gaming et cartes cadeaux", "Découvrez Robux, Valorant Points, Free Fire, Steam et d’autres produits gaming. Demandez les prix et la disponibilité sur WhatsApp pour votre plateforme et la région de votre compte.", "/gaming"],
    ["Invitations digitales personnalisées", "Choisissez un modèle pour votre mariage, fiançailles, anniversaire ou fête. Ajoutez vos informations, prévisualisez votre carte et partagez le lien publié avec vos invités.", "/invitations"],
  ] },
  ar: { title: "تسوق وألعاب ودعوات في تونس", cards: [
    ["التسوق من الخارج", "أرسل رابط منتج من علي إكسبريس أو شي إن أو تيمو لطلب السعر بالدينار التونسي. راجع عرض السعر وتابع طلبك من حسابك على جيبلي.", "/request"],
    ["شحن الألعاب وبطاقات الهدايا", "اكتشف روبوكس وفالورانت وفري فاير وستيم وغيرها من منتجات الألعاب. اسألنا عبر واتساب عن الأسعار والتوفر حسب منصتك ومنطقة حسابك.", "/gaming"],
    ["دعوات رقمية مخصصة", "اختر تصميماً للزفاف أو الخطوبة أو عيد الميلاد أو غيرها من المناسبات. أضف بيانات الحفل وعاين بطاقتك وشارك رابط الدعوة المنشورة مع ضيوفك.", "/invitations"],
  ] },
};

function Home() {
  const { t, language } = useTranslation();
  const services = serviceIntro[language];
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

        <div className="heroVisual">
          <img
            src={optimizedImage("/yes.png")}
            alt="Jibli — based in Deguach, Tunisia, bringing gaming top-ups and shopping from AliExpress, Shein, Temu and more"
            className="heroImage"
          />
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
          <img src={optimizedImage("/games/league-of-legends.jpg")} loading="lazy" decoding="async" alt="League of Legends" />
          <img src={optimizedImage("/games/valorant.jpg")} loading="lazy" decoding="async" alt="Valorant" />
          <img src={optimizedImage("/games/freefire.jpg")} loading="lazy" decoding="async" alt="Free Fire" />
          <img src={optimizedImage("/games/roblox.png")} loading="lazy" decoding="async" alt="Roblox" />
          <img src={optimizedImage("/games/chess.jpg")} loading="lazy" decoding="async" alt="Chess.com" />
          <img src={optimizedImage("/games/spotify.png")} loading="lazy" decoding="async" alt="Spotify" />
        </div>

        <Link to="/gaming" className="primaryBtn gamingTeaserBtn"><Gamepad2 size={16} /> {t("home.exploreGaming")}</Link>
      </section>

      <section className="section serviceOverview" aria-labelledby="jibli-services">
        <h2 id="jibli-services">{services.title}</h2>
        <div className="serviceOverviewGrid">{services.cards.map(([title, description, path]) => <article className="card" key={path}>
          <h3><Link to={path}>{title}</Link></h3><p>{description}</p>
        </article>)}</div>
      </section>
      <Footer />
    </div>
  );
}

export default Home;
