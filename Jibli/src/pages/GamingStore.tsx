import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import { useTranslation } from "../i18n/LanguageContext";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

type GamingTier = {
  label: string;
  priceTnd: number | null;
  features?: string[];
};

type GamingGame = {
  id: string;
  name: string;
  category: string;
  image?: string;
  tiers: GamingTier[];
};

const GAMING_CATALOG: GamingGame[] = [
  {
    id: "riot-points",
    category: "Gift card",
    name: "League of Legends — Riot Gift Card",
    image: "/games/league-of-legends.jpg",
    tiers: [
      { label: "5 USD Riot Key", priceTnd: 22 },
      { label: "10 USD Riot Key", priceTnd: 40 },
      { label: "25 USD Riot Key", priceTnd: 90 },
      { label: "80 USD Riot Key", priceTnd: 280 },
    ],
  },
  {
    id: "valorant-vp",
    category: "Game top-up",
    name: "Valorant — VP",
    image: "/games/valorant.jpg",
    tiers: [{ label: "475 VP Key", priceTnd: 30 }],
  },
  {
    id: "free-fire",
    category: "Game top-up",
    name: "Free Fire — Diamonds",
    image: "/games/freefire.jpg",
    tiers: [
      { label: "110 Diamonds", priceTnd: 5 },
      { label: "231 Diamonds", priceTnd: 10 },
      { label: "583 Diamonds", priceTnd: 24 },
      { label: "1188 Diamonds", priceTnd: 45 },
      { label: "2420 Diamonds", priceTnd: 82 },
    ],
  },
  {
    id: "robux",
    category: "Game top-up",
    name: "Roblox — Robux",
    image: "/games/roblox.png",
    tiers: [
      { label: "100 Robux", priceTnd: 12 },
      { label: "200 Robux", priceTnd: 18 },
      { label: "500 Robux", priceTnd: 38 },
      { label: "800 Robux", priceTnd: 50 },
    ],
  },
  {
    id: "efootball",
    category: "Game top-up",
    name: "eFootball — Coins",
    image: "/games/efootball.png",
    tiers: [{ label: "Message us for current packages & pricing", priceTnd: null }],
  },
  {
    id: "chess-premium",
    category: "Subscription",
    name: "Chess.com Premium (1 month)",
    image: "/games/chess.jpg",
    tiers: [
      {
        label: "Gold",
        priceTnd: 30,
        features: ["Unlimited Puzzles", "Unlimited Lessons", "Unlock All Bots", "No Ads"],
      },
      {
        label: "Platinum",
        priceTnd: 42,
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
        priceTnd: 60,
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
      { label: "Personnel", priceTnd: 15 },
      { label: "Étudiants", priceTnd: 10 },
      { label: "Duo", priceTnd: 20 },
      { label: "Familier", priceTnd: 25 },
    ],
  },
  {
    id: "netflix",
    category: "Subscription",
    name: "Netflix",
    image: "/games/netflix.png",
    tiers: [{ label: "Message us for current plans & pricing", priceTnd: null }],
  },
  {
    id: "minecraft",
    category: "Game code",
    name: "Minecraft — Java & Bedrock Edition (PC)",
    image: "/games/minecraft.jpg",
    tiers: [{ label: "Full game", priceTnd: 90 }],
  },
  {
    id: "steam-gift-cards",
    category: "Gift card",
    name: "Steam Wallet Gift Card",
    image: "/games/steam.jpg",
    tiers: [
      { label: "15 USD Steam Key", priceTnd: 65 },
      { label: "20 USD Steam Key", priceTnd: 85 },
      { label: "30 USD Steam Key", priceTnd: 130 },
      { label: "50 USD Steam Key", priceTnd: 220 },
    ],
  },
];

function buildWhatsappUrl(gameName: string, tierLabel: string, priceTnd: number | null) {
  const priceLine = priceTnd !== null ? ` — ${priceTnd} TND` : "";
  const message = `Hi! I'd like to order:\n${gameName}\n${tierLabel}${priceLine}`;
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const CATEGORY_KEYS: Record<string, "categoryTopup" | "categorySubscription" | "categoryGameCode" | "categoryGiftCard"> = {
  "Game top-up": "categoryTopup",
  Subscription: "categorySubscription",
  "Game code": "categoryGameCode",
  "Gift card": "categoryGiftCard",
};

function GamingStore() {
  const { t } = useTranslation();
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
        <section className="requestHero">
          <div className="requestHeroText">
            <h1>{t("gaming.title")}</h1>
            <p>{t("gaming.subtitle")}</p>
          </div>
        </section>

        {!selectedGame ? (
          <div className="gamingGameGrid">
            {GAMING_CATALOG.map((game) => (
              <button
                type="button"
                key={game.id}
                className="gamingGameCard"
                onClick={() => openGame(game.id)}
              >
                <div className="gamingGameImageWrap">
                  {game.image ? (
                    <img src={game.image} alt="" />
                  ) : (
                    <span className="gamingGameFallback">{game.name.slice(0, 1)}</span>
                  )}
                </div>
                <strong>{game.name}</strong>
                <span className="platformBadge">{categoryLabel(game.category)}</span>
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
                  {selectedGame.image ? (
                    <img src={selectedGame.image} alt="" className="gamingOffersHeroImage" />
                  ) : (
                    <span className="gamingGameFallback">{selectedGame.name.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <span className="platformBadge">{categoryLabel(selectedGame.category)}</span>
                  <h3>{selectedGame.name}</h3>
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
                        <strong>{tier.label}</strong>
                        {tier.priceTnd !== null && <span>{tier.priceTnd} TND</span>}
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
                  {selectedTier.priceTnd !== null && (
                    <span className="gamingTierPrice">{selectedTier.priceTnd} TND</span>
                  )}
                  <a
                    href={buildWhatsappUrl(selectedGame.name, selectedTier.label, selectedTier.priceTnd)}
                    target="_blank"
                    rel="noreferrer"
                    className="primaryBtn wideBtn"
                  >
                    {t("gaming.orderOnWhatsapp")}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="secureText">{t("gaming.notFound")}</p>
      </main>
    </div>
  );
}

export default GamingStore;
