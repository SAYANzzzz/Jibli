import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { saveCartItems, submitOrder } from "../api";
import type { Shop } from "../api";
import { OrderItemCard } from "../components/OrderItemCard";
import { SHOP_LABELS, clearItemDrafts, createId, loadDraftItemIds, saveDraftItemIds } from "../orderItem";
import type { ItemSnapshot } from "../orderItem";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

function ProductRequest() {
  const [searchParams] = useSearchParams();
  const initialLink = searchParams.get("link") ?? "";

  const [itemRefs, setItemRefs] = useState<{ id: string; initialLink: string }[]>(() => {
    // If a mobile browser reloaded this page while the customer was away in
    // another app (e.g. the Shein app), restore the same product cards
    // instead of starting over with a single blank one.
    const draftIds = loadDraftItemIds();
    return draftIds.length > 0
      ? draftIds.map((id) => ({ id, initialLink: "" }))
      : [{ id: createId("item"), initialLink }];
  });
  const [snapshots, setSnapshots] = useState<Record<string, ItemSnapshot>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhatsappFallback, setShowWhatsappFallback] = useState(false);

  useEffect(() => {
    saveDraftItemIds(itemRefs.map((item) => item.id));
  }, [itemRefs]);

  const handleItemUpdate = useCallback((id: string, snapshot: ItemSnapshot) => {
    setSnapshots((current) => ({ ...current, [id]: snapshot }));
  }, []);

  const handleAddItem = () => {
    setItemRefs((current) => [...current, { id: createId("item"), initialLink: "" }]);
  };

  const handleRemoveItem = (id: string) => {
    setItemRefs((current) => current.filter((item) => item.id !== id));
    setSnapshots((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const activeItems = itemRefs
    .map(({ id }) => snapshots[id])
    .filter((snapshot): snapshot is ItemSnapshot => Boolean(snapshot && snapshot.link));

  const allReady = activeItems.length > 0 && activeItems.every((item) => item.shop && item.priceResult);
  const grandTotal = activeItems.reduce((sum, item) => sum + (item.priceResult?.total_price_tnd ?? 0), 0);
  const canSubmit = allReady && !isSubmitting;

  const whatsappUrl = useMemo(() => {
    if (!allReady) return "";

    const itemLines = activeItems.map((item, index) => {
      const lines = [
        `${index + 1}. ${item.shop ? SHOP_LABELS[item.shop] : "Product"}`,
        `Link: ${item.link}`,
        item.size.trim() ? `Size: ${item.size.trim()}` : "",
        item.color.trim() ? `Color: ${item.color.trim()}` : "",
        item.model.trim() ? `Model/Variation: ${item.model.trim()}` : "",
        `Quantity: ${item.quantity}`,
        ...item.extraOptions.map((option) => `${option.label}: ${option.value}`),
        item.quantity > 1 && item.priceResult ? `Unit price: ${item.priceResult.unit_price_tnd} TND` : "",
        item.priceResult ? `Item total: ${item.priceResult.total_price_tnd} TND` : "",
      ].filter(Boolean);

      return lines.join("\n");
    });

    const message = [
      "New Jibli order request",
      `${activeItems.length} product(s)`,
      "",
      itemLines.join("\n\n"),
      "",
      `Grand total: ${grandTotal} TND`,
    ].join("\n");

    return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [allReady, activeItems, grandTotal]);

  const handleSubmitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowWhatsappFallback(false);
    setSubmitError("");
    setIsSubmitting(true);

    try {
      await saveCartItems({
        items: activeItems.map((item) => ({
          product_link: item.link,
          shop: (item.shop ?? "aliexpress") as Shop,
          product_name: item.productName || undefined,
          selected_options: {
            size: item.size,
            color: item.color,
            model: item.model,
            ...Object.fromEntries(item.extraOptions.map((option) => [option.label, option.value])),
          },
          quantity: item.quantity,
          estimated_price: item.priceResult?.total_price_tnd ?? undefined,
        })),
      });

      await submitOrder();
      clearItemDrafts(itemRefs.map((item) => item.id));

      // Navigate the current tab directly instead of pre-opening a blank tab
      // and redirecting it later: on mobile (especially iOS Safari) that
      // pattern reliably leaves the new tab stuck on about:blank once real
      // network time has passed between opening it and setting its
      // location. A same-tab redirect is a normal top-level navigation, so
      // it isn't subject to popup-blocking on any platform.
      setShowWhatsappFallback(true);
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Could not save request before WhatsApp handoff", error);
      setSubmitError("Could not save your request yet. Please try again before sending it on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar>
        <Link to="/gaming" className="outlineBtn">Gaming</Link>
        <Link to="/tracking#panier" className="outlineBtn">Panier</Link>
        <ProfileNavLink />
      </Navbar>

      <main className="requestPage quickOrderPage">
        <section className="requestHero">
          <div className="requestHeroText">
            <h1>Request an order</h1>
            <p>
              Paste a product link from AliExpress, Shein, or Temu, pick the exact options you
              want, and we calculate the final price before you confirm on WhatsApp.
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

        <form onSubmit={handleSubmitRequest}>
          {itemRefs.map(({ id, initialLink: linkForItem }, index) => (
            <OrderItemCard
              key={id}
              id={id}
              index={index}
              initialLink={linkForItem}
              onUpdate={handleItemUpdate}
              onRemove={handleRemoveItem}
              canRemove={itemRefs.length > 1}
            />
          ))}

          <button className="addProductLinkBtn qoAddProductBtn" type="button" onClick={handleAddItem}>
            + Add another product
          </button>

          {activeItems.length > 0 && (
            <div className="card qoPriceResult">
              <div className="cardTitleRow">
                <div>
                  <h3>Order summary</h3>
                  <p className="mutedText">
                    {allReady
                      ? "All products are priced. Review, then send your request."
                      : "Finish entering the price for every product to send your request."}
                  </p>
                </div>
                <span className="platformBadge">{activeItems.length} item(s)</span>
              </div>

              <div className="qoSummaryList">
                {activeItems.map((item, index) => (
                  <div className="qoSummaryRow" key={`${item.link}-${index}`}>
                    <span>
                      {index + 1}. {item.productName || (item.shop ? SHOP_LABELS[item.shop] : "Product")}
                    </span>
                    <strong>{item.priceResult ? `${item.priceResult.total_price_tnd} TND` : "Pending price"}</strong>
                  </div>
                ))}
              </div>

              <div className="qoPriceBox">
                <div className="qoPriceRow qoPriceTotal">
                  <span>Grand total</span>
                  <span>{grandTotal} TND</span>
                </div>
              </div>
            </div>
          )}

          {submitError && <div className="noticeBox warning">{submitError}</div>}

          <button className="wideBtn" disabled={!canSubmit} type="submit">
            {isSubmitting ? "Saving request..." : "Send request on WhatsApp"}
          </button>
        </form>

        <p className="secureText">
          Your request is free. You only pay after we confirm the final price.
        </p>
      </main>

      {showWhatsappFallback && (
        <div className="modalOverlay" role="dialog" aria-modal="true" onClick={() => setShowWhatsappFallback(false)}>
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <h2>Request saved!</h2>
            <p>Redirecting you to WhatsApp now — if nothing happens, tap the button below.</p>
            <a
              href={whatsappUrl}
              className="modalWhatsappBtn"
              onClick={() => setShowWhatsappFallback(false)}
            >
              Open WhatsApp
            </a>
            <button type="button" className="modalCloseBtn" onClick={() => setShowWhatsappFallback(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductRequest;
