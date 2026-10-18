import { optimizedImage } from "../optimizedImage";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Gamepad2, MessageCircle, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";
import { useTranslation } from "../i18n/useTranslation";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

type GamingTier = {
  label: string;
  features?: string[];
};

type GamingGame = {
  id: string;
  name: string;
  category: string;
  image: string;
  logo?: boolean;
  tiers: GamingTier[];
};

const GAMING_CATALOG: GamingGame[] = [
  { id: "ea-sports-fc", name: "FIFA / EA SPORTS FC", category: "Game code", image: "/games/ea-sports-fc.svg", tiers: [{ label: "Available packages" }] },
  { id: "pubg-mobile", name: "PUBG Mobile", category: "Game top-up", image: "/games/pubg-mobile.jpg", tiers: [{ label: "Available packages" }] },
  { id: "fortnite", name: "Fortnite", category: "Game top-up", image: "/games/fortnite.jpg", tiers: [{ label: "Available packages" }] },
  { id: "fc-mobile", name: "EA SPORTS FC Mobile", category: "Game top-up", image: "/games/fc-mobile.jpg", tiers: [{ label: "Available packages" }] },
  { id: "call-of-duty-mobile", name: "Call of Duty: Mobile", category: "Game top-up", image: "/games/call-of-duty-mobile.webp", tiers: [{ label: "Available packages" }] },
  { id: "mobile-legends", name: "Mobile Legends: Bang Bang", category: "Game top-up", image: "/games/mobile-legends.jpg", tiers: [{ label: "Available packages" }] },
  { id: "genshin-impact", name: "Genshin Impact", category: "Game top-up", image: "/games/genshin-impact.jpg", tiers: [{ label: "Available packages" }] },
  { id: "honkai-star-rail", name: "Honkai: Star Rail", category: "Game top-up", image: "/games/honkai-star-rail.png", tiers: [{ label: "Available packages" }] },
  { id: "brawl-stars", name: "Brawl Stars", category: "Game top-up", image: "/games/brawl-stars.png", tiers: [{ label: "Available packages" }] },
  { id: "clash-of-clans", name: "Clash of Clans", category: "Game top-up", image: "/games/clash-of-clans.jpg", tiers: [{ label: "Available packages" }] },
  { id: "clash-royale", name: "Clash Royale", category: "Game top-up", image: "/games/clash-royale.jpg", tiers: [{ label: "Available packages" }] },
  { id: "playstation", name: "PlayStation Store", category: "Gift card", image: "/games/playstation.png", tiers: [{ label: "Available packages" }] },
  { id: "xbox", name: "Xbox", category: "Gift card", image: "/games/xbox.jpg", tiers: [{ label: "Available packages" }] },

  {
    id: "riot-points",
    category: "Gift card",
    name: "League of Legends — Riot Gift Card",
    image: "/games/league-of-legends.jpg",
    tiers: [
      { label: "5 USD Riot Key" },
      { label: "10 USD Riot Key" },
      { label: "25 USD Riot Key" },
      { label: "80 USD Riot Key" },
    ],
  },
  {
    id: "valorant-vp",
    category: "Game top-up",
    name: "Valorant — VP",
    image: "/games/valorant.jpg",
    tiers: [{ label: "475 VP Key" }],
  },
  {
    id: "free-fire",
    category: "Game top-up",
    name: "Free Fire — Diamonds",
    image: "/games/freefire.jpg",
    tiers: [
      { label: "110 Diamonds" },
      { label: "231 Diamonds" },
      { label: "583 Diamonds" },
      { label: "1188 Diamonds" },
      { label: "2420 Diamonds" },
    ],
  },
  {
    id: "robux",
    category: "Game top-up",
    name: "Roblox — Robux",
    image: "/games/roblox.png",
    tiers: [
      { label: "100 Robux" },
      { label: "200 Robux" },
      { label: "500 Robux" },
      { label: "800 Robux" },
    ],
  },
  {
    id: "efootball",
    category: "Game top-up",
    name: "eFootball — Coins",
    image: "/games/efootball.png",
    tiers: [{ label: "Message us for current packages & pricing" }],
  },
  {
    id: "chess-premium",
    category: "Subscription",
    name: "Chess.com Premium (1 month)",
    image: "/games/chess.jpg",
    tiers: [
      {
        label: "Gold",

        features: ["Unlimited Puzzles", "Unlimited Lessons", "Unlock All Bots", "No Ads"],
      },
      {
        label: "Platinum",

        features: [
          "Unlimited Game Review",
          "Unlimited Puzzles",
          "Unlimited Lessons",
          "Unlock All Bots",
          "No Ads",
        ],
      },
      {
        label: "Diamond",

        features: [
          "Unlimited Game Review",
          "Unlimited Coach Explanations",
          "Unlimited Insights",
          "Unlimited Puzzles",
          "Unlimited Lessons",
          "Unlock All Bots",
          "No Ads",
          "Access 300+ Free Courses",
        ],
      },
    ],
  },
  {
    id: "spotify-premium",
    category: "Subscription",
    name: "Spotify Premium (1 month)",
    image: "/games/spotify.png",
    tiers: [
      { label: "Personnel" },
      { label: "Étudiants" },
      { label: "Duo" },
      { label: "Familier" },
    ],
  },
  {
    id: "netflix",
    category: "Subscription",
    name: "Netflix",
    image: "/games/netflix.png",
    tiers: [{ label: "Message us for current plans & pricing" }],
  },
  {
    id: "minecraft",
    category: "Game code",
    name: "Minecraft — Java & Bedrock Edition (PC)",
    image: "/games/minecraft.jpg",
    tiers: [{ label: "Full game" }],
  },
  {
    id: "steam-gift-cards",
    category: "Gift card",
    name: "Steam Wallet Gift Card",
    image: "/games/steam.jpg",
    tiers: [
      { label: "15 USD Steam Key" },
      { label: "20 USD Steam Key" },
      { label: "30 USD Steam Key" },
      { label: "50 USD Steam Key" },
    ],
  },
  { id: "chatgpt", name: "ChatGPT", category: "Subscription", image: "/games/chatgpt.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "claude", name: "Claude", category: "Subscription", image: "/games/claude.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "canva", name: "Canva", category: "Subscription", image: "/games/canva.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "gemini", name: "Google Gemini", category: "Subscription", image: "/games/gemini.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "notion", name: "Notion", category: "Subscription", image: "/games/notion.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "capcut", name: "CapCut", category: "Subscription", image: "/games/capcut.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "youtube-premium", name: "YouTube Premium", category: "Subscription", image: "/games/youtube-premium.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "discord-nitro", name: "Discord Nitro", category: "Subscription", image: "/games/discord-nitro.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "apple-gift-card", name: "Apple Gift Card", category: "Gift card", image: "/games/apple-gift-card.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "google-play-gift-card", name: "Google Play Gift Card", category: "Gift card", image: "/games/google-play-gift-card.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "amazon-gift-card", name: "Amazon Gift Card", category: "Gift card", image: "/games/amazon-gift-card.png", logo: true, tiers: [{ label: "Available packages" }] },
  { id: "nintendo-gift-card", name: "Nintendo eShop Gift Card", category: "Gift card", image: "/games/nintendo-gift-card.png", logo: true, tiers: [{ label: "Available packages" }] },
];

function buildWhatsappUrl(gameName: string, tierLabel: string, language: string) {
  const message = language === "fr"
    ? `Bonjour Jibli ! Quel est le prix pour ${gameName} ?\nOption : ${tierLabel}\nPouvez-vous confirmer les offres disponibles pour ma plateforme et ma région ?`
    : language === "ar"
      ? `?????? ????! ???? ????? ??? ${gameName}.\n??????: ${tierLabel}\n?? ?????? ????? ??????? ???????? ?????? ????????`
      : `Hi Jibli! What is the price for ${gameName}?\nOption: ${tierLabel}\nPlease confirm the available packages for my platform and region.`;
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const PRICE_COPY = {
  en: { ask: "Ask for a price on WhatsApp", browse: "Explore the catalog", action: "View packages", hero: "Gaming prices on WhatsApp", note: "Contact us for current prices and availability. Tell us your platform and account region.", packages: "Available packages", other: "Ask about another product" },
  fr: { ask: "Demander le prix sur WhatsApp", browse: "Découvrir le catalogue", action: "Voir les offres", hero: "Prix gaming sur WhatsApp", note: "Contactez-nous pour les prix et la disponibilité. Précisez votre plateforme et la région de votre compte.", packages: "Offres disponibles", other: "Demander un autre produit" },
  ar: { ask: "???? ?? ????? ??? ??????", browse: "???? ???????", action: "??? ???????", hero: "????? ??????? ??? ??????", note: "????? ???? ?????? ??????? ???????. ?????? ?????? ?????? ?????.", packages: "??????? ????????", other: "???? ?? ???? ????" },
};

const CATEGORY_KEYS: Record<string, "categoryTopup" | "categorySubscription" | "categoryGameCode" | "categoryGiftCard"> = {
  "Game top-up": "categoryTopup",
  Subscription: "categorySubscription",
  "Game code": "categoryGameCode",
  "Gift card": "categoryGiftCard",
};

function GamingStore() {
  const { t, language } = useTranslation();
  const copy = PRICE_COPY[language];
  const tierLabel = (label: string) => label === "Available packages" || label.startsWith("Message us for") ? copy.packages : label;
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const selectedGame = GAMING_CATALOG.find((game) => game.id === selectedGameId) ?? null;
  const selectedTier = selectedGame?.tiers[selectedTierIndex] ?? null;

  const categoryLabel = (category: string) => {
    const key = CATEGORY_KEYS[category];
    return key ? t(`gaming.${key}`) : category;
  };

  const openGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setSelectedTierIndex(0);
  };

  return (
    <div>
      <Navbar>
        <Link to="/request" className="outlineBtn">{t("nav.orderAProduct")}</Link>
        <ProfileNavLink />
      </Navbar>

      <main className="requestPage gamingStorePage">
        <section className="gamingEditorialHero">
          <div className="gamingEditorialContent">
            <span className="gamingEditorialEyebrow"><Zap size={15} /> {copy.hero}</span>
            <h1>{t("gaming.title")}</h1>
            <p>{copy.note}</p>
            <a className="gamingBrowseBtn" href="#gaming-catalog"><Gamepad2 size={17} /> {copy.browse}</a>
          </div>
        </section>

        {!selectedGame ? (
          <div className="gamingGameGrid" id="gaming-catalog">
            {GAMING_CATALOG.map((game) => (
              <button
                type="button"
                key={game.id}
                className="gamingGameCard"
                onClick={() => openGame(game.id)}
              >
                <div className="gamingGameImageWrap">
                  <img src={optimizedImage(game.image)} alt={`${game.name} logo / artwork`} className={game.logo ? "gamingBrandLogo" : game.id === "ea-sports-fc" ? "gamingFcLogo" : undefined} loading="lazy" />
                </div>
                <strong>{game.name}</strong>
                <span className="platformBadge">{categoryLabel(game.category)}</span>
                <span className="gamingGameAction">{copy.action} <ArrowUpRight size={15} /></span>
              </button>
            ))}
          </div>
        ) : (
          <div className="gamingOffersView">
            <button type="button" className="outlineBtn gamingBackBtn" onClick={() => setSelectedGameId(null)}>
              {t("gaming.backToGames")}
            </button>

            <div className="card gamingOffersCard">
              <div className="gamingOffersHero">
                <div className="gamingOffersHeroImageWrap">
                  <img src={optimizedImage(selectedGame.image)} alt={`${selectedGame.name} logo / artwork`} className={`gamingOffersHeroImage${selectedGame.logo ? " gamingBrandLogo" : selectedGame.id === "ea-sports-fc" ? " gamingFcLogo" : ""}`} />
                </div>
                <div>
                  <span className="platformBadge">{categoryLabel(selectedGame.category)}</span>
                  <h3>{selectedGame.name}</h3>
                  {selectedGame.tiers.length === 1 && (
                    <p className="mutedText">{tierLabel(selectedGame.tiers[0].label)}</p>
                  )}
                </div>
              </div>

              {selectedGame.tiers.length > 1 && (
                <>
                  <label>{t("gaming.chooseOption")}</label>
                  <div className="gamingTierTiles">
                    {selectedGame.tiers.map((tier, index) => (
                      <button
                        type="button"
                        key={tier.label}
                        className={index === selectedTierIndex ? "gamingTierTile active" : "gamingTierTile"}
                        onClick={() => setSelectedTierIndex(index)}
                      >
                        <strong>{tierLabel(tier.label)}</strong>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selectedTier?.features && (
                <ul className="gamingTierFeatures gamingSelectedFeatures">
                  {selectedTier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              )}

              {selectedTier && (
                <div className="gamingOffersFooter">
                  <p className="gamingPriceNote">{copy.note}</p>
                  <a className="primaryBtn gamingWhatsappQuote" href={buildWhatsappUrl(selectedGame.name, tierLabel(selectedTier.label), language)} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} />{copy.ask}<ArrowUpRight size={16} /></a>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="secureText">{t("gaming.notFound")}</p>
        <a className="outlineBtn gamingOtherGame" href={buildWhatsappUrl(copy.other, copy.packages, language)} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} />{copy.other}</a>
      </main>

      <Footer />
    </div>
  );
}

export default GamingStore;
