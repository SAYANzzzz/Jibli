import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

type GamingTier = {
  label: string;
  priceTnd: number | null;
  note?: string;
  features?: string[];
};

type GamingProduct = {
  id: string;
  category: string;
  name: string;
  tiers: GamingTier[];
};

const GAMING_CATALOG: GamingProduct[] = [
  {
    id: "riot-points",
    category: "Game top-up",
    name: "League of Legends — Riot Points",
    tiers: [{ label: "575 RP", priceTnd: 24 }],
  },
  {
    id: "valorant-vp",
    category: "Game top-up",
    name: "Valorant — VP",
    tiers: [{ label: "475 VP", priceTnd: 30 }],
  },
  {
    id: "free-fire",
    category: "Game top-up",
    name: "Free Fire — Diamonds",
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
    tiers: [{ label: "Message us for current packages & pricing", priceTnd: null }],
  },
  {
    id: "chess-premium",
    category: "Subscription",
    name: "Chess.com Premium (1 month)",
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
    tiers: [{ label: "Message us for current plans & pricing", priceTnd: null }],
  },
  {
    id: "human-fall-flat",
    category: "Game code",
    name: "Human: Fall Flat (Steam code)",
    tiers: [{ label: "Full game", priceTnd: 6 }],
  },
  {
    id: "minecraft",
    category: "Game code",
    name: "Minecraft (PC Edition)",
    tiers: [{ label: "Full game", priceTnd: null }],
  },
  {
    id: "steam-gift-cards",
    category: "Gift card",
    name: "Steam Gift Cards",
    tiers: [{ label: "Message us for available amounts", priceTnd: null }],
  },
];

function buildWhatsappUrl(productName: string, tierLabel: string, priceTnd: number | null) {
  const priceLine = priceTnd !== null ? ` — ${priceTnd} TND` : "";
  const message = `Hi! I'd like to order:\n${productName}\n${tierLabel}${priceLine}`;
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function GamingStore() {
  return (
    <div>
      <Navbar>
        <Link to="/request" className="outlineBtn">Order a product</Link>
        <ProfileNavLink />
      </Navbar>

      <main className="requestPage gamingStorePage">
        <section className="requestHero">
          <div className="requestHeroText">
            <h1>Gaming top-ups & subscriptions</h1>
            <p>
              Riot Points, Valorant VP, Free Fire Diamonds, Robux, Chess.com and Spotify
              Premium, game codes and more — fast, no password needed. Pick what you want and
              send us the order on WhatsApp.
            </p>
          </div>
        </section>

        <div className="gamingCatalog">
          {GAMING_CATALOG.map((product) => (
            <div className="card gamingProductCard" key={product.id}>
              <div className="cardTitleRow">
                <div>
                  <h3>{product.name}</h3>
                  <span className="platformBadge">{product.category}</span>
                </div>
              </div>

              <div className="gamingTierList">
                {product.tiers.map((tier) => (
                  <div className="gamingTierRow" key={tier.label}>
                    <div className="gamingTierInfo">
                      <strong>{tier.label}</strong>
                      {tier.features && (
                        <ul className="gamingTierFeatures">
                          {tier.features.map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="gamingTierAction">
                      {tier.priceTnd !== null && <span className="gamingTierPrice">{tier.priceTnd} TND</span>}
                      <a
                        href={buildWhatsappUrl(product.name, tier.label, tier.priceTnd)}
                        target="_blank"
                        rel="noreferrer"
                        className="primaryBtn"
                      >
                        Order on WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="secureText">
          Don't see what you're looking for? Message us on WhatsApp and we'll check it for you.
        </p>
      </main>
    </div>
  );
}

export default GamingStore;
