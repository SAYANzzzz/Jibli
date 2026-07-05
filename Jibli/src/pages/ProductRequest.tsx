import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProfile, getSheinPanier, saveCartItems, submitOrder, updateProfile } from "../api";
import ProfileNavLink from "../components/ProfileNavLink";
import { supabase } from "../supabase";
import logo from "../assets/Fast-Logo.gif";

type SupportedPlatform = "AliExpress" | "Shein";
type Platform = SupportedPlatform | "Unknown";

type ProductInfo = {
  name: string;
  price: string;
  estimatedPrice: number | null;
  imageLabel: string;
  imageUrl?: string | null;
  rating?: string;
  soldCount?: string;
  shipping?: string;
  deliveryEta?: string;
  seller?: string;
  variants: { label: string; name: string; options: string[] }[];
};

const demoProducts: Record<SupportedPlatform, ProductInfo> = {
  AliExpress: {
    name: "AliExpress product from your link",
    price: "Final price after review",
    estimatedPrice: null,
    imageLabel: "AliExpress item",
    rating: "Verified by Jibli",
    soldCount: "Options checked after link review",
    shipping: "Shipping confirmed before payment",
    deliveryEta: "Confirmed by admin",
    seller: "AliExpress seller",
    variants: [
      { label: "Color", name: "color", options: ["Black", "White", "Blue", "Red"] },
      { label: "Size", name: "size", options: ["One size", "S", "M", "L", "XL"] },
      { label: "Shipping", name: "shipping", options: ["Standard", "Saver", "Fast"] },
    ],
  },
  Shein: {
    name: "Shein product from your link",
    price: "Estimated 32 USD",
    estimatedPrice: 32,
    imageLabel: "Shein item",
    rating: "Shared panier item",
    soldCount: "Pending panier target",
    shipping: "Grouped with Shein panier",
    deliveryEta: "Launches after 129 USD",
    seller: "Shein",
    variants: [
      { label: "Color", name: "color", options: ["Black", "White", "Beige", "Pink"] },
      { label: "Size", name: "size", options: ["XS", "S", "M", "L", "XL"] },
      { label: "Category", name: "category", options: ["Women", "Men", "Kids", "Home"] },
    ],
  },
};

const SHEIN_PANIER_TARGET = 129;
const ADMIN_WHATSAPP_NUMBER = "21692001397";
const tunisianGovernorates = [
  "Ariana",
  "Beja",
  "Ben Arous",
  "Bizerte",
  "Gabes",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kebili",
  "Kef",
  "Mahdia",
  "Manouba",
  "Medenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
];

function detectPlatform(link: string): Platform {
  const normalized = link.toLowerCase();

  if (normalized.includes("aliexpress")) {
    return "AliExpress";
  }

  if (normalized.includes("shein")) {
    return "Shein";
  }

  return "Unknown";
}

function getExternalProductUrl(link: string) {
  const trimmedLink = link.trim();

  if (/^https?:\/\//i.test(trimmedLink)) {
    return trimmedLink;
  }

  if (trimmedLink.startsWith("//")) {
    return `https:${trimmedLink}`;
  }

  return `https://${trimmedLink}`;
}

function ProductRequest() {
  const [searchParams] = useSearchParams();
  const initialLink = searchParams.get("link") ?? "";
  const initialPlatform = detectPlatform(initialLink);
  const [activeShop, setActiveShop] = useState<SupportedPlatform>(
    initialPlatform === "Shein" ? "Shein" : "AliExpress",
  );
  const [aliExpressLinks, setAliExpressLinks] = useState(
    initialPlatform === "Shein" ? "" : initialLink,
  );
  const [sheinLinks, setSheinLinks] = useState(initialPlatform === "Shein" ? initialLink : "");
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSheinTotal, setSavedSheinTotal] = useState(0);
  const [savedSheinItemCount, setSavedSheinItemCount] = useState(0);

  const activeProductLinks = useMemo(
    () =>
      (activeShop === "AliExpress" ? aliExpressLinks : sheinLinks)
        .split(/\r?\n/)
        .map((link) => link.trim())
        .filter(Boolean),
    [activeShop, aliExpressLinks, sheinLinks],
  );
  const activeLinkRows = activeShop === "AliExpress" ? aliExpressLinks : sheinLinks;
  const linkRows = activeLinkRows.split("\n").length > 0 ? activeLinkRows.split("\n") : [""];
  const detectedItems = useMemo(() => {
    return activeProductLinks.map((link, index) => {
      const itemPlatform = detectPlatform(link);
      const isActiveShopLink = itemPlatform === activeShop;

      return {
        id: `${index}-${link}`,
        link,
        platform: itemPlatform,
        product: isActiveShopLink ? demoProducts[itemPlatform] : null,
      };
    });
  }, [activeProductLinks, activeShop]);
  const supportedItems = detectedItems.filter(
    (
      item,
    ): item is {
      id: string;
      link: string;
      platform: SupportedPlatform;
      product: ProductInfo;
    } => Boolean(item.product),
  );
  const hasUnsupportedItems = detectedItems.some((item) => item.platform === "Unknown");
  const hasWrongShopItems = detectedItems.some(
    (item) => item.platform !== "Unknown" && item.platform !== activeShop,
  );
  const hasSheinItems = activeShop === "Shein" && supportedItems.length > 0;
  const temporarySheinAmount = supportedItems
    .filter((item) => item.platform === "Shein")
    .reduce(
      (total, item) => total + (item.product.estimatedPrice ?? 0),
      0,
    );
  const basketAmount = savedSheinTotal + temporarySheinAmount;
  const sheinRemaining = Math.max(SHEIN_PANIER_TARGET - basketAmount, 0);
  const sheinProgress = Math.min((basketAmount / SHEIN_PANIER_TARGET) * 100, 100);
  const canSubmit =
    supportedItems.length > 0 &&
    !hasUnsupportedItems &&
    !hasWrongShopItems;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });

    getProfile()
      .then((profile) => {
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        setCity(profile.city ?? "");
        setPostalCode(profile.postal_code ?? "");
      })
      .catch((error) => {
        console.error("Could not load profile for request form", error);
      });

    getSheinPanier()
      .then((panier) => {
        setSavedSheinTotal(panier.total);
        setSavedSheinItemCount(panier.item_count);
      })
      .catch((error) => {
        console.error("Could not load Shein panier", error);
      });
  }, []);

  const setLinkRows = (rows: string[]) => {
    const nextValue = rows.join("\n");

    if (activeShop === "AliExpress") {
      setAliExpressLinks(nextValue);
      return;
    }

    setSheinLinks(nextValue);
  };

  const handleProductLinkChange = (index: number, value: string) => {
    setLinkRows(linkRows.map((link, linkIndex) => (linkIndex === index ? value : link)));
  };

  const handleAddProductLink = () => {
    setLinkRows([...linkRows, ""]);
  };

  const handleRemoveProductLink = (index: number) => {
    setLinkRows(linkRows.filter((_, linkIndex) => linkIndex !== index));
  };

  const buildWhatsAppMessage = () => {
    const itemLines = supportedItems
      .map((item, index) => {
        const description = itemNotes[item.id]?.trim();

        return [
          `${index + 1}. ${item.platform}`,
          `Link: ${item.link}`,
          `Description: ${description || "Not filled"}`,
        ].join("\n");
      })
      .join("\n\n");

    return [
      "New Jibli order request",
      `Shop: ${activeShop}`,
      hasSheinItems ? `Shein panier: ${basketAmount || 0}$ / ${SHEIN_PANIER_TARGET}$` : "",
      "",
      "Customer:",
      `Name: ${fullName.trim() || "Not filled"}`,
      `Email: ${email.trim() || "Not filled"}`,
      `Phone: ${phone.trim() || "Not filled"}`,
      `City: ${city || "Not filled"}`,
      postalCode.trim() ? `Postal code: ${postalCode.trim()}` : "",
      "",
      "Order links:",
      itemLines,
      notes.trim() ? `\nNotes: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleSubmitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage("");
    setSubmitError("");
    setIsSubmitting(true);

    const whatsappMessage = buildWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      whatsappMessage,
    )}`;

    try {
      if (fullName.trim() && phone.trim() && city) {
        await updateProfile({
          full_name: fullName.trim(),
          phone: phone.trim(),
          city,
          postal_code: postalCode.trim() || undefined,
        });
      }

      await saveCartItems({
        items: supportedItems.map((item) => ({
          product_link: item.link,
          shop: item.platform.toLowerCase() as "aliexpress" | "shein",
          product_name: `${item.platform} order link`,
          selected_options: {
            description: itemNotes[item.id]?.trim() || "",
          },
          quantity: 1,
          estimated_price: item.product.estimatedPrice ?? undefined,
        })),
        shein_panier_total: hasSheinItems ? basketAmount : undefined,
        notes,
      });

      await submitOrder();

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setSubmitMessage("Your request was saved in the database. WhatsApp opened so you can send it to admin.");
    } catch (error) {
      console.error("Could not save request before WhatsApp handoff", error);
      setSubmitError("Could not save your request yet. Please try again before sending it on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="brand">
          <img src={logo} alt="Jibli logo" className="logoImg" />
          <span>Jibli</span>
        </Link>

        <div className="navLinks">
          <Link to="/tracking#panier" className="outlineBtn">Panier</Link>
          <ProfileNavLink />
        </div>
      </nav>

      <main className="requestPage">
        <section className="requestHero">
          <div className="requestHeroText">
            <h1>Request an order</h1>
            <p>
              Paste an AliExpress link or build a Shein panier with multiple products. We
              verify every item, confirm the options, and send you the final price before
              ordering.
            </p>
          </div>

          <div className="requestHeroVisual">
            <img
              src="/shopping-panier.jfif"
              alt="Online shopping panier with packages"
              className="requestHeroImage"
            />
            <div className="floatingShopCard top logoFloat">
              <img src="/aliexpress-logo.png" alt="AliExpress logo" />
            </div>
            <div className="floatingShopCard middle logoFloat">
              <img src="/shein-logo.png" alt="Shein logo" />
            </div>
          </div>
        </section>

        <div className="linkRequestCard">
          <div className="cardTitleRow">
            <div>
              <h3>Start with your product or panier link</h3>
              <p className="mutedText">
                Choose AliExpress for direct product requests or Shein for the shared panier.
              </p>
            </div>
            <span className="platformBadge">Step 1</span>
          </div>

          <div className="shopSplitGrid">
            <button
              type="button"
              className={activeShop === "AliExpress" ? "shopChoice active" : "shopChoice"}
              onClick={() => setActiveShop("AliExpress")}
            >
              <span className="shopLogo imageLogo">
                <img src="/aliexpress-logo.png" alt="AliExpress logo" />
              </span>
              <strong>Direct order links</strong>
              <small>Paste product links or panier links and describe what you want.</small>
            </button>

            <button
              type="button"
              className={activeShop === "Shein" ? "shopChoice shein active" : "shopChoice shein"}
              onClick={() => setActiveShop("Shein")}
            >
              <span className="shopLogo imageLogo sheinImageLogo">
                <img src="/shein-logo.png" alt="Shein logo" />
              </span>
              <strong>Shared panier</strong>
              <small>{Math.round(sheinProgress)}% collected before launching the Shein order.</small>
              <div className="miniPanierTrack">
                <div style={{ width: `${sheinProgress}%` }} />
              </div>
            </button>
          </div>

          {activeShop === "AliExpress" ? (
            <div className="productLinkBuilder">
              <label>AliExpress product or panier links *</label>
              {linkRows.map((link, index) => (
                <div className="productLinkRow" key={`ali-${index}`}>
                  <span>{index + 1}</span>
                  <input
                    value={link}
                    onChange={(event) => handleProductLinkChange(index, event.target.value)}
                    placeholder="AliExpress product or panier link..."
                  />
                  {link.trim() && (
                    <a
                      className="openProductLinkBtn"
                      href={getExternalProductUrl(link)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Check link
                    </a>
                  )}
                  {linkRows.length > 1 && (
                    <button type="button" onClick={() => handleRemoveProductLink(index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button className="addProductLinkBtn" type="button" onClick={handleAddProductLink}>
                + Add another product
              </button>
            </div>
          ) : (
            <>
              <div className="sheinPanierOverview">
                <div>
                  <span className="shopLogo imageLogo sheinImageLogo">
                    <img src="/shein-logo.png" alt="Shein logo" />
                  </span>
                  <h3>Panier progress</h3>
                  <p>
                    We collect Shein products here until the panier reaches 129 USD. You can
                    still add orders after it reaches 100%.
                  </p>
                </div>

                <div
                  className="panierLiquid"
                  aria-label={`${Math.round(sheinProgress)} percent of the Shein panier target`}
                >
                  <div
                    className="panierIconShell"
                    style={{ "--panier-fill": `${sheinProgress}%` } as CSSProperties}
                  >
                    <div className="panierWater" style={{ height: `${sheinProgress}%` }}>
                      <span className="panierWave panierWaveOne" />
                      <span className="panierWave panierWaveTwo" />
                    </div>
                    <img src="/panier-outline-blue.png" alt="" className="panierArtwork" />
                  </div>
                  <div className="panierLiquidText">
                    <strong>{Math.round(sheinProgress)}%</strong>
                    <span>{basketAmount || 0}$ / {SHEIN_PANIER_TARGET}$</span>
                  </div>
                </div>
              </div>

              <div className="panierProgressTrack large">
                <div className="panierProgressFill" style={{ width: `${sheinProgress}%` }} />
              </div>
              <div className="panierBreakdown">
                <span>Saved panier: {savedSheinTotal.toFixed(2)}$</span>
                <span>Current form: +{temporarySheinAmount.toFixed(2)}$</span>
                <span>{savedSheinItemCount} saved Shein item(s)</span>
              </div>

              <div className="productLinkBuilder">
                <label>Shein product or panier links *</label>
                {linkRows.map((link, index) => (
                  <div className="productLinkRow" key={`shein-${index}`}>
                    <span>{index + 1}</span>
                    <input
                      value={link}
                      onChange={(event) => handleProductLinkChange(index, event.target.value)}
                      placeholder="Shein product or panier link..."
                    />
                    {link.trim() && (
                      <a
                        className="openProductLinkBtn"
                        href={getExternalProductUrl(link)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Check link
                      </a>
                    )}
                    {linkRows.length > 1 && (
                      <button type="button" onClick={() => handleRemoveProductLink(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button className="addProductLinkBtn" type="button" onClick={handleAddProductLink}>
                  + Add another product
                </button>
              </div>

            </>
          )}

          {detectedItems.length > 0 && (hasUnsupportedItems || hasWrongShopItems) && (
            <div className="noticeBox warning">
              {hasWrongShopItems
                ? `This section accepts only ${activeShop} links. Switch shop cards or remove the other link.`
                : "One or more links are not supported yet. Temu is currently unavailable because it does not ship to Tunisia."}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitRequest}>
          {supportedItems.length > 0 ? (
            <div className="formGrid">
            <div className="card">
              <div className="cardTitleRow">
                <div>
                  <h3>{activeShop} detected items</h3>
                  <p className="mutedText">
                    Add a short message for each link so we know the exact color, size,
                    quantity, or variant you want.
                  </p>
                </div>
                <span className="platformBadge">{supportedItems.length} item(s)</span>
              </div>

              <div className="multiProductList">
                {supportedItems.map((item, index) => (
                  <div className="productChoiceCard simpleLinkCard" key={item.id}>
                    <div className="cardTitleRow">
                      <div>
                        <h3>Link {index + 1}</h3>
                        <p className="mutedText">Describe the exact product options you want us to verify.</p>
                      </div>
                      <span className="platformBadge">{item.platform}</span>
                    </div>

                    <a
                      href={getExternalProductUrl(item.link)}
                      target="_blank"
                      rel="noreferrer"
                      className="pastedProductLink"
                    >
                      Check link
                    </a>

                    <label>Message for this link</label>
                    <textarea
                      className="itemDescriptionBox"
                      value={itemNotes[item.id] ?? ""}
                      onChange={(event) =>
                        setItemNotes((currentNotes) => ({
                          ...currentNotes,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Example: black color, 3 skull, belt length 1 piece, quantity 2. Add anything important here..."
                    />
                  </div>
                ))}
              </div>

              {hasSheinItems && (
                <div className="sheinPanierTracker">
                  <div className="cardTitleRow">
                    <div>
                      <h3>Shein group panier</h3>
                      <p className="mutedText">
                        Shein products stay pending until the shared panier reaches 129 USD.
                      </p>
                    </div>
                    <span className="platformBadge">{supportedItems.filter((item) => item.platform === "Shein").length} Shein item(s)</span>
                  </div>

                  <div className="panierProgressHeader">
                    <strong>{basketAmount || 0}$ collected</strong>
                    <span>{Math.round(sheinProgress)}% complete</span>
                    <span>{sheinRemaining > 0 ? `${sheinRemaining.toFixed(2)}$ remaining` : "Ready to launch"}</span>
                  </div>

                  <div className="panierProgressTrack">
                    <div className="panierProgressFill" style={{ width: `${sheinProgress}%` }} />
                  </div>

                  <div className="sheinPendingList">
                    {supportedItems
                      .filter((item) => item.platform === "Shein")
                      .map((item, index) => (
                        <div className="sheinPendingItem" key={item.id}>
                          <span>{index + 1}</span>
                          <div>
                            <strong>{item.product.name}</strong>
                            <small>Added to the shared Shein panier</small>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {hasSheinItems && (
                <div className={sheinProgress >= 100 ? "noticeBox success" : "noticeBox warning"}>
                  {sheinProgress >= 100
                    ? "Shein panier is ready, and we still accept more orders."
                    : "This order will be added to the shared Shein panier while we collect toward 129 USD."}
                </div>
              )}

              <label>Notes optional</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add any detail we should verify before confirming your price..."
              />
            </div>

            <div className="card">
              <div className="cardTitleRow">
                <div>
                  <h3>Contact and delivery</h3>
                  <p className="mutedText">Optional, but useful so we can reply faster on WhatsApp.</p>
                </div>
                <span className="platformBadge">Step 2</span>
              </div>

              <label>Full name *</label>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
              />

              <label>Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email"
              />

              <label>Phone number *</label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+216 XX XXX XXX"
              />

              <label>City *</label>
              <select value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="">Select city</option>
                {tunisianGovernorates.map((governorate) => (
                  <option key={governorate}>{governorate}</option>
                ))}
              </select>

              <label>Postal code</label>
              <input
                value={postalCode}
                onChange={(event) => setPostalCode(event.target.value)}
                inputMode="numeric"
                placeholder="Example: 1000"
              />

              <div className="priceBox">
                <h4>What happens next?</h4>
                <p>
                  We verify every item, confirm the selected options, calculate the final
                  price, then contact you on WhatsApp.
                </p>
              </div>
            </div>
          </div>
          ) : null}

          {submitError && <div className="noticeBox warning">{submitError}</div>}
          {submitMessage && <div className="noticeBox success">{submitMessage}</div>}

          <button className="wideBtn" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting
              ? "Saving request..."
              : "Send request on WhatsApp"}
          </button>
        </form>

        <p className="secureText">
          Your request is free. You only pay after we confirm the final price.
        </p>
      </main>
    </div>
  );
}

export default ProductRequest;

