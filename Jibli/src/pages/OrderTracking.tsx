import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, MessageCircle, Package, PlusCircle } from "lucide-react";
import { getOrders } from "../api";
import type { Order } from "../api";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import { useTranslation } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatTrackingDate(value: string) {
  const date = new Date(value);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${weekday} | ${month}. ${date.getDate()} ${time}`;
}

function getOrderTitle(order: Order, t: ReturnType<typeof useTranslation>["t"]) {
  const firstItem = order.items[0];

  if (!firstItem) {
    return t("tracking.confirmedOrder");
  }

  const itemLabel = firstItem.product_name || t("tracking.shopOrder", { shop: firstItem.shop });

  if (order.items.length === 1) {
    return itemLabel;
  }

  return `${itemLabel} ${t("tracking.moreCount", { n: order.items.length - 1 })}`;
}

function statusLabel(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  return t(`orderStatus.${status}` as TranslationKey);
}

function getOrderPhoto(order: Order) {
  return order.items.find((item) => item.image_url)?.image_url ?? null;
}

function OrderTracking() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedTrackingId, setCopiedTrackingId] = useState("");

  useEffect(() => {
    getOrders()
      .then(({ orders: nextOrders }) => {
        const confirmedOrders = nextOrders.filter((order) => order.status !== "new_request");
        setOrders(confirmedOrders);
        setSelectedOrderId(confirmedOrders[0]?.id ?? "");
      })
      .catch((error) => {
        console.error("Could not load orders", error);
        setOrders([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0],
    [orders, selectedOrderId],
  );

  const timelineEvents = useMemo(
    () => (selectedOrder?.events ? [...selectedOrder.events].reverse() : []),
    [selectedOrder],
  );

  const handleCopyTracking = async (orderId: string, trackingNumber: string) => {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopiedTrackingId(orderId);
      setTimeout(() => setCopiedTrackingId(""), 2000);
    } catch (error) {
      console.error("Could not copy tracking number", error);
    }
  };

  return (
    <div>
      <Navbar>
        <Link to="/gaming" className="outlineBtn"><Gamepad2 size={16} /> {t("nav.gaming")}</Link>
        <Link to="/request" className="outlineBtn"><PlusCircle size={16} /> {t("nav.requestOrder")}</Link>
        <ProfileNavLink />
      </Navbar>

      <main className="page">
        <section className="tableCard panierTrackingSection" id="panier">
          <div className="tableTop">
            <div>
              <h2>{t("tracking.myPanier")}</h2>
              <p className="mutedText">{t("tracking.panierText")}</p>
            </div>
            <Link to="/request" className="primaryBtn">{t("tracking.addLinks")}</Link>
          </div>
        </section>

        <div className="center trackingIntro">
          <h1>{t("tracking.title")}</h1>
          <p>{t("tracking.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="emptyOrdersState">{t("tracking.loading")}</div>
        ) : orders.length === 0 ? (
          <div className="emptyOrdersState">
            <Package size={46} />
            <h2>{t("tracking.noOrdersTitle")}</h2>
            <p>{t("tracking.noOrdersText")}</p>
            <Link to="/request" className="primaryBtn">{t("tracking.requestAnOrder")}</Link>
          </div>
        ) : (
          <>
            <div className="ordersList">
              {orders.map((order) => (
                <button
                  className={selectedOrder?.id === order.id ? "orderSummaryCard active" : "orderSummaryCard"}
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <span className="productImage small">
                    {getOrderPhoto(order) ? (
                      <img src={getOrderPhoto(order)!} alt="" />
                    ) : (
                      <Package size={28} />
                    )}
                  </span>
                  <div>
                    <strong>{getOrderTitle(order, t)}</strong>
                    <small>{order.items.length} {t("tracking.items")} • {formatDate(order.created_at)}</small>
                  </div>
                  <span className="badge">{statusLabel(order.status, t)}</span>
                </button>
              ))}
            </div>

            {selectedOrder && (
              <>
                <div className="trackingCard">
                  <div className="productImage">
                    {getOrderPhoto(selectedOrder) ? (
                      <img src={getOrderPhoto(selectedOrder)!} alt="" />
                    ) : (
                      <Package size={58} />
                    )}
                  </div>

                  <div className="trackingContent">
                    <div className="trackingHeader">
                      <h2>{getOrderTitle(selectedOrder, t)}</h2>
                      <span className="badge green">{statusLabel(selectedOrder.status, t)}</span>
                    </div>

                    <div className="orderInfo">
                      <div>
                        <small>{t("tracking.itemsLabel")}</small>
                        <strong>{selectedOrder.items.length}</strong>
                      </div>

                      <div>
                        <small>{t("tracking.finalPrice")}</small>
                        <strong>
                          {selectedOrder.final_price ? `${selectedOrder.final_price} TND` : t("tracking.pending")}
                        </strong>
                      </div>

                      <div>
                        <small>{t("tracking.orderDate")}</small>
                        <strong>{formatDate(selectedOrder.created_at)}</strong>
                      </div>
                    </div>

                    <div className="trackedItemsList">
                      {selectedOrder.items.map((item) => (
                        <a
                          href={item.product_link}
                          target="_blank"
                          rel="noreferrer"
                          key={item.id}
                          className={item.image_url ? "trackedItemLink withPhoto" : "trackedItemLink"}
                        >
                          {item.image_url && <img src={item.image_url} alt="" />}
                          {item.product_name || t("tracking.shopOrder", { shop: item.shop })}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="otlCard">
                  <div className="otlHeader">
                    <div>
                      <span className="mutedText">{t("tracking.trackingNumber")}</span>
                      <strong>{selectedOrder.tracking_number || t("tracking.notAssigned")}</strong>
                    </div>
                    {selectedOrder.tracking_number && (
                      <button
                        type="button"
                        className="otlCopyBtn"
                        onClick={() => handleCopyTracking(selectedOrder.id, selectedOrder.tracking_number!)}
                      >
                        {copiedTrackingId === selectedOrder.id ? t("tracking.copied") : t("tracking.copy")}
                      </button>
                    )}
                  </div>

                  {timelineEvents.length === 0 ? (
                    <p className="mutedText otlEmpty">{t("tracking.noUpdates")}</p>
                  ) : (
                    <div className="otlList">
                      {timelineEvents.map((event, index) => (
                        <div className={index === 0 ? "otlRow current" : "otlRow"} key={event.id}>
                          <div className="otlDotCol">
                            <span className="otlDot" />
                          </div>
                          <div className="otlBody">
                            <strong>{statusLabel(event.status, t)}</strong>
                            {event.note && <p>{event.note}</p>}
                            <span className="otlDate">{formatTrackingDate(event.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        <div className="whatsappBox">
          <span>{t("tracking.needHelp")}</span>
          <a href="https://wa.me/21692001397" target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            {t("tracking.contactWhatsapp")}
          </a>
        </div>
      </main>
    </div>
  );
}

export default OrderTracking;
