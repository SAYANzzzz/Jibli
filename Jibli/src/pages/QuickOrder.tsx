import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OrderItemCard } from "../components/OrderItemCard";
import { SHOP_LABELS, createId } from "../orderItem";
import type { ItemSnapshot } from "../orderItem";
import Navbar from "../components/Navbar";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

function QuickOrder() {
  const [searchParams] = useSearchParams();

  const [itemRefs, setItemRefs] = useState<{ id: string; initialLink: string }[]>(() => [
    { id: createId("item"), initialLink: searchParams.get("link") ?? "" },
  ]);
  const [snapshots, setSnapshots] = useState<Record<string, ItemSnapshot>>({});

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

  return (
    <div>
      <Navbar>
        <Link to="/login" className="outlineBtn">Login</Link>
        <Link to="/register" className="primaryBtn">Register</Link>
      </Navbar>

      <main className="requestPage quickOrderPage">
        <section className="requestHero">
          <div className="requestHeroText">
            <h1>Order any product</h1>
            <p>
              Paste product links from AliExpress, Shein, or Temu, pick the exact options you
              want for each one, and get your final price in dinars before you contact us.
            </p>
          </div>
        </section>

        {itemRefs.map(({ id, initialLink }, index) => (
          <OrderItemCard
            key={id}
            id={id}
            index={index}
            initialLink={initialLink}
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
                    ? "All products are priced. Review, then send it to us on WhatsApp."
                    : "Finish entering the price for every product to unlock WhatsApp."}
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

            {allReady ? (
              <a className="qoWhatsappBtn" href={whatsappUrl} target="_blank" rel="noreferrer">
                Contact Us on WhatsApp
              </a>
            ) : (
              <button className="qoWhatsappBtn disabled" type="button" disabled>
                Contact Us on WhatsApp
              </button>
            )}
          </div>
        )}

        <p className="secureText">
          Your request is free. You only pay after we confirm the final price on WhatsApp.
        </p>
      </main>
    </div>
  );
}

export default QuickOrder;
