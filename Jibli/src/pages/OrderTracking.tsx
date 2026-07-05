import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Package } from "lucide-react";
import { getOrders } from "../api";
import type { Order } from "../api";
import ProfileNavLink from "../components/ProfileNavLink";
import logo from "../assets/Fast-Logo.gif";

const steps = [
  { label: "Price confirmed", status: "price_confirmed" },
  { label: "Deposit paid", status: "deposit_paid" },
  { label: "Ordered", status: "ordered" },
  { label: "Shipped", status: "shipped" },
  { label: "Arrived in Tunisia", status: "arrived_tunisia" },
  { label: "Out for delivery", status: "out_for_delivery" },
  { label: "Delivered", status: "delivered" },
];

const statusLabels: Record<string, string> = {
  price_confirmed: "Price confirmed",
  waiting_confirmation: "Waiting confirmation",
  deposit_paid: "Deposit paid",
  ordered: "Ordered",
  shipped: "Shipped",
  arrived_tunisia: "Arrived in Tunisia",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
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

function getActiveStepIndex(status: string) {
  const index = steps.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
}

function OrderTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
  const activeStepIndex = selectedOrder ? getActiveStepIndex(selectedOrder.status) : 0;

  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="brand">
          <img src={logo} alt="Jibli logo" className="logoImg" />
          <span>Jibli</span>
        </Link>

        <div className="navLinks">
          <Link to="/request">Request order</Link>
          <ProfileNavLink />
        </div>
      </nav>

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
                    <Package size={28} />
                  </span>
                  <div>
                    <strong>{getOrderTitle(order)}</strong>
                    <small>{order.items.length} item(s) • {formatDate(order.created_at)}</small>
                  </div>
                  <span className="badge">{statusLabels[order.status] ?? order.status}</span>
                </button>
              ))}
            </div>

            {selectedOrder && (
              <>
                <div className="trackingCard">
                  <div className="productImage">
                    <Package size={58} />
                  </div>

                  <div className="trackingContent">
                    <div className="trackingHeader">
                      <h2>{getOrderTitle(selectedOrder)}</h2>
                      <span className="badge green">
                        {statusLabels[selectedOrder.status] ?? selectedOrder.status}
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

                      <div>
                        <small>Tracking number</small>
                        <strong>{selectedOrder.tracking_number || "Pending"}</strong>
                      </div>
                    </div>

                    <div className="trackedItemsList">
                      {selectedOrder.items.map((item) => (
                        <a href={item.product_link} target="_blank" rel="noreferrer" key={item.id}>
                          {item.product_name || `${item.shop} item`}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="timeline">
                  {steps.map((step, index) => (
                    <div
                      className={index <= activeStepIndex ? "timelineItem active" : "timelineItem"}
                      key={step.status}
                    >
                      <div className="circle">{index <= activeStepIndex ? "✓" : ""}</div>
                      <span>{step.label}</span>
                    </div>
                  ))}
                </div>

                {selectedOrder.events && selectedOrder.events.length > 0 && (
                  <div className="customerOrderHistory">
                    <h3>Order updates</h3>
                    {selectedOrder.events.map((event) => (
                      <div className="customerHistoryItem" key={event.id}>
                        <strong>{statusLabels[event.status] ?? event.status}</strong>
                        <span>{formatDate(event.created_at)}</span>
                        {event.note && <p>{event.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
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
