import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, MessageCircle, Package, PlusCircle } from "lucide-react";
import { getOrders } from "../api";
import type { Order } from "../api";
import { STATUS_LABELS } from "../orderStatus";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";

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

function getOrderTitle(order: Order) {
  const firstItem = order.items[0];

  if (!firstItem) {
    return "Confirmed order";
  }

  if (order.items.length === 1) {
    return firstItem.product_name || `${firstItem.shop} order`;
  }

  return `${firstItem.product_name || `${firstItem.shop} order`} + ${order.items.length - 1} more`;
}

function getOrderPhoto(order: Order) {
  return order.items.find((item) => item.image_url)?.image_url ?? null;
}

function OrderTracking() {
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
        <Link to="/gaming" className="outlineBtn"><Gamepad2 size={16} /> Gaming</Link>
        <Link to="/request" className="outlineBtn"><PlusCircle size={16} /> Request order</Link>
        <ProfileNavLink />
      </Navbar>

      <main className="page">
        <section className="tableCard panierTrackingSection" id="panier">
          <div className="tableTop">
            <div>
              <h2>My panier</h2>
              <p className="mutedText">
                Confirmed items appear here after you send the WhatsApp request and the admin approves it.
              </p>
            </div>
            <Link to="/request" className="primaryBtn">Add links</Link>
          </div>
        </section>

        <div className="center trackingIntro">
          <h1>Track your orders</h1>
          <p>Confirmed orders and their latest status will appear here.</p>
        </div>

        {isLoading ? (
          <div className="emptyOrdersState">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="emptyOrdersState">
            <Package size={46} />
            <h2>There are no orders for you yet</h2>
            <p>When an admin confirms your WhatsApp request, your order will appear here.</p>
            <Link to="/request" className="primaryBtn">Request an order</Link>
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
                    <strong>{getOrderTitle(order)}</strong>
                    <small>{order.items.length} item(s) • {formatDate(order.created_at)}</small>
                  </div>
                  <span className="badge">{STATUS_LABELS[order.status] ?? order.status}</span>
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
                      <h2>{getOrderTitle(selectedOrder)}</h2>
                      <span className="badge green">
                        {STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}
                      </span>
                    </div>

                    <div className="orderInfo">
                      <div>
                        <small>Items</small>
                        <strong>{selectedOrder.items.length}</strong>
                      </div>

                      <div>
                        <small>Final price</small>
                        <strong>
                          {selectedOrder.final_price ? `${selectedOrder.final_price} TND` : "Pending"}
                        </strong>
                      </div>

                      <div>
                        <small>Order date</small>
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
                          {item.product_name || `${item.shop} item`}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="otlCard">
                  <div className="otlHeader">
                    <div>
                      <span className="mutedText">Tracking number</span>
                      <strong>{selectedOrder.tracking_number || "Not assigned yet"}</strong>
                    </div>
                    {selectedOrder.tracking_number && (
                      <button
                        type="button"
                        className="otlCopyBtn"
                        onClick={() => handleCopyTracking(selectedOrder.id, selectedOrder.tracking_number!)}
                      >
                        {copiedTrackingId === selectedOrder.id ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>

                  {timelineEvents.length === 0 ? (
                    <p className="mutedText otlEmpty">No status updates yet.</p>
                  ) : (
                    <div className="otlList">
                      {timelineEvents.map((event, index) => (
                        <div className={index === 0 ? "otlRow current" : "otlRow"} key={event.id}>
                          <div className="otlDotCol">
                            <span className="otlDot" />
                          </div>
                          <div className="otlBody">
                            <strong>{STATUS_LABELS[event.status] ?? event.status}</strong>
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
          <span>Need help with an order?</span>
          <a href="https://wa.me/21692001397" target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            Contact WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}

export default OrderTracking;
