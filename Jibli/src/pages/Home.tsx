import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Link as LinkIcon, CreditCard, Gamepad2, LogIn, ShieldCheck, ShoppingCart, Truck, UserPlus } from "lucide-react";
import { getCurrentSession } from "../auth";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import { supabase } from "../supabase";

function Home() {
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
        <Link to="/gaming" className="outlineBtn"><Gamepad2 size={16} /> Gaming</Link>
        {isAuthenticated ? (
          <>
            <Link to="/tracking#panier" className="outlineBtn"><ShoppingCart size={16} /> Panier</Link>
            <ProfileNavLink />
          </>
        ) : (
          <>
            <Link to="/login" className="outlineBtn"><LogIn size={16} /> Login</Link>
            <Link to="/register" className="primaryBtn"><UserPlus size={16} /> Register</Link>
          </>
        )}
      </Navbar>

      <section className="hero">
        <div className="heroText">
          <h1>
            Paste the link. <br />
            We bring it to Tunisia.
          </h1>

          <p>
            Order from AliExpress, Amazon, Shein and more without international
            payment problems.
          </p>

          <form className="linkBox" onSubmit={handlePriceRequest}>
            <LinkIcon size={18} />
            <input
              value={productLink}
              onChange={(event) => setProductLink(event.target.value)}
              placeholder="Paste AliExpress or Shein link here..."
            />
            <button type="submit">Get my price</button>
          </form>

          <div className="trustRow">
            <span>No international card needed</span>
            <span>Clear price before ordering</span>
            <span>Track your order</span>
          </div>
        </div>

        <div className="heroVisual">
          <img
            src="/hero-delivery.png"
            alt="Worldwide delivery route to Tunisia"
            className="heroImage"
          />
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>

        <div className="steps">
          <div className="step">
            <div className="stepIcon"><LinkIcon /></div>
            <h3>Paste link</h3>
            <p>Send us the product link from any supported online shop.</p>
          </div>

          <div className="step">
            <div className="stepIcon"><CreditCard /></div>
            <h3>Get price</h3>
            <p>We calculate product price, shipping, customs estimate and fee.</p>
          </div>

          <div className="step">
            <div className="stepIcon"><ShieldCheck /></div>
            <h3>Confirm order</h3>
            <p>You confirm the price and pay a small deposit.</p>
          </div>

          <div className="step">
            <div className="stepIcon"><Truck /></div>
            <h3>Receive product</h3>
            <p>We order it and you track the package until delivery.</p>
          </div>
        </div>
      </section>

      <section className="section gamingTeaserSection">
        <h2>Gaming top-ups & subscriptions</h2>
        <p className="gamingTeaserText">
          Riot Points, Valorant VP, Free Fire Diamonds, Robux, Chess.com and Spotify Premium,
          Steam gift cards and more — no password needed, fast delivery on WhatsApp.
        </p>

        <div className="gamingTeaserLogos">
          <img src="/games/league-of-legends.jpg" alt="League of Legends" />
          <img src="/games/valorant.jpg" alt="Valorant" />
          <img src="/games/freefire.jpg" alt="Free Fire" />
          <img src="/games/roblox.png" alt="Roblox" />
          <img src="/games/chess.jpg" alt="Chess.com" />
          <img src="/games/spotify.png" alt="Spotify" />
        </div>

        <Link to="/gaming" className="primaryBtn gamingTeaserBtn"><Gamepad2 size={16} /> Explore gaming top-ups</Link>
      </section>
    </div>
  );
}

export default Home;
