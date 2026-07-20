import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Link as LinkIcon, CreditCard, ShieldCheck, Truck } from "lucide-react";
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

    navigate(trimmedLink ? `/order?link=${encodeURIComponent(trimmedLink)}` : "/order");
  };

  return (
    <div>
      <Navbar>
        {isAuthenticated ? (
          <>
            <Link to="/tracking#panier" className="outlineBtn">Panier</Link>
            <ProfileNavLink />
          </>
        ) : (
          <>
            <Link to="/login" className="outlineBtn">Login</Link>
            <Link to="/register" className="primaryBtn">Register</Link>
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
    </div>
  );
}

export default Home;
