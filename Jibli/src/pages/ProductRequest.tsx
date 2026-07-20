import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { saveCartItems, submitOrder } from "../api";
import type { Shop } from "../api";
import { OrderItemCard } from "../components/OrderItemCard";
import { SHOP_LABELS, createId } from "../orderItem";
import type { ItemSnapshot } from "../orderItem";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

function ProductRequest() {
  const [searchParams] = useSearchParams();
  const initialLink = searchParams.get("link") ?? "";

  const [itemRefs, setItemRefs] = useState<{ id: string; initialLink: string }[]>(() => [
    { id: createId("item"), initialLink },
  ]);
  const [snapshots, setSnapshots] = useState<Record<string, ItemSnapshot>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState<{ autoOpened: boolean } | null>(null);

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
    setSuccessModal(null);
    setSubmitError("");
    setIsSubmitting(true);

    // Open the tab synchronously, while the click is still "trusted", so browsers
    // don't silently block it once we redirect it after the awaited save below.
    const whatsappWindow = window.open("", "_blank");

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

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
        setSuccessModal({ autoOpened: true });
      } else {
        setSuccessModal({ autoOpened: false });
      }
    } catch (error) {
      whatsappWindow?.close();
      console.error("Could not save request before WhatsApp handoff", error);
      setSubmitError("Could not save your request yet. Please try again before sending it on WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar>
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

      {successModal && (
        <div className="modalOverlay" role="dialog" aria-modal="true" onClick={() => setSuccessModal(null)}>
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <h2>{successModal.autoOpened ? "Request sent — WhatsApp opened!" : "Request saved!"}</h2>
            <p>
              {successModal.autoOpened
                ? "Your request was saved. WhatsApp opened in a new tab with your order details ready — switch to that tab and hit Send to reach us."
                : "Your request was saved, but your browser blocked the WhatsApp popup. Tap the button below to open it yourself."}
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="modalWhatsappBtn"
              onClick={() => setSuccessModal(null)}
            >
              Open WhatsApp
            </a>
            <button type="button" className="modalCloseBtn" onClick={() => setSuccessModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductRequest;
