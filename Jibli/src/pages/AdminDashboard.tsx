import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { deleteAdminOrder, getAdminOrders, updateAdminOrderStatus } from "../api";
import type { Order } from "../api";
import logo from "../assets/Fast-Logo.gif";

const processStatuses = [
  { value: "price_confirmed", label: "Price confirmed" },
  { value: "waiting_confirmation", label: "Waiting confirmation" },
  { value: "deposit_paid", label: "Deposit paid" },
  { value: "ordered", label: "Ordered" },
  { value: "shipped", label: "Shipped" },
  { value: "arrived_tunisia", label: "Arrived in Tunisia" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

type OrderDraft = {
  status: string;
  final_price: string;
  deposit_amount: string;
  tracking_number: string;
  note: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCustomerName(order: Order) {
  return order.profiles?.full_name || order.profiles?.email || "Unknown customer";
}

function getCustomerDetails(order: Order) {
  return [order.profiles?.phone, order.profiles?.city].filter(Boolean).join(" - ");
}

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [removingOrderId, setRemovingOrderId] = useState("");
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [orderDrafts, setOrderDrafts] = useState<Record<string, OrderDraft>>({});

  const loadOrders = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getAdminOrders();
      setOrders(response.orders);
      setOrderDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };

        response.orders.forEach((order) => {
          if (!nextDrafts[order.id]) {
            nextDrafts[order.id] = {
              status: order.status,
              final_price: order.final_price?.toString() ?? "",
              deposit_amount: order.deposit_amount?.toString() ?? "",
              tracking_number: order.tracking_number ?? "",
              note: "",
            };
          }
        });

        return nextDrafts;
      });
    } catch (error) {
      console.error("Could not load admin orders", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not load orders.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const newRequests = useMemo(
    () => orders.filter((order) => order.status === "new_request"),
    [orders],
  );

  const confirmedOrders = useMemo(
    () => orders.filter((order) => order.status !== "new_request"),
    [orders],
  );

  const handleConfirm = async (order: Order) => {
    setUpdatingOrderId(order.id);
    setErrorMessage("");

    try {
      await updateAdminOrderStatus(order.id, {
        status: "price_confirmed",
        note: orderNotes[order.id]?.trim() || "Order confirmed by admin.",
      });
      setOrderNotes((currentNotes) => ({ ...currentNotes, [order.id]: "" }));
      await loadOrders();
    } catch (error) {
      console.error("Could not confirm order", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not confirm order.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  const handleRemove = async (order: Order) => {
    const shouldRemove = window.confirm("Remove this order request? This cannot be undone.");

    if (!shouldRemove) {
      return;
    }

    setRemovingOrderId(order.id);
    setErrorMessage("");

    try {
      await deleteAdminOrder(order.id);
      await loadOrders();
    } catch (error) {
      console.error("Could not remove order", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not remove order.");
    } finally {
      setRemovingOrderId("");
    }
  };

  const updateOrderDraft = (orderId: string, field: keyof OrderDraft, value: string) => {
    const emptyDraft: OrderDraft = {
      status: "",
      final_price: "",
      deposit_amount: "",
      tracking_number: "",
      note: "",
    };

    setOrderDrafts((currentDrafts) => ({
      ...currentDrafts,
      [orderId]: {
        ...emptyDraft,
        ...currentDrafts[orderId],
        [field]: value,
      },
    }));
  };

  const handleProcessUpdate = async (order: Order) => {
    const draft = orderDrafts[order.id];

    if (!draft) {
      return;
    }

    setUpdatingOrderId(order.id);
    setErrorMessage("");

    try {
      await updateAdminOrderStatus(order.id, {
        status: draft.status,
        final_price: draft.final_price ? Number(draft.final_price) : undefined,
        deposit_amount: draft.deposit_amount ? Number(draft.deposit_amount) : undefined,
        tracking_number: draft.tracking_number.trim() || undefined,
        note: draft.note.trim() || `Order updated to ${draft.status}.`,
      });
      setOrderDrafts((currentDrafts) => ({
        ...currentDrafts,
        [order.id]: {
          ...draft,
          note: "",
        },
      }));
      await loadOrders();
    } catch (error) {
      console.error("Could not update order process", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not update order.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  return (
    <div className="simpleAdminPage">
      <nav className="navbar">
        <Link to="/" className="brand">
          <img src={logo} alt="Jibli logo" className="logoImg" />
          <span>Jibli</span>
        </Link>

        <div className="navLinks">
          <button className="outlineBtn" type="button" onClick={loadOrders}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link to="/" className="primaryBtn">Website</Link>
        </div>
      </nav>

      <main className="simpleAdminMain">
        <section className="simpleAdminHeader">
          <span className="eyebrow">Admin only</span>
          <h1>Order requests</h1>
          <p>Every request saved before WhatsApp opens appears here. Confirm it when you are ready.</p>
        </section>

        <section className="simpleAdminStats">
          <div>
            <span>Waiting</span>
            <strong>{newRequests.length}</strong>
          </div>
          <div>
            <span>Confirmed</span>
            <strong>{confirmedOrders.length}</strong>
          </div>
        </section>

        {errorMessage && <div className="noticeBox warning adminNotice">{errorMessage}</div>}

        <section className="simpleAdminPanel">
          <div className="tableTop">
            <div>
              <h2>New WhatsApp requests</h2>
              <p className="mutedText">Only orders with status New request are shown here.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="emptyOrdersState">Loading orders...</div>
          ) : newRequests.length === 0 ? (
            <div className="emptyOrdersState">
              <CheckCircle2 size={42} />
              <h2>No new requests</h2>
              <p>When a user sends a request through WhatsApp, it will appear here.</p>
            </div>
          ) : (
            <div className="simpleOrderList">
              {newRequests.map((order) => (
                <article className="simpleOrderCard" key={order.id}>
                  <div className="simpleOrderTop">
                    <div>
                      <span className="badge">New request</span>
                      <h3>{getCustomerName(order)}</h3>
                      <p>{getCustomerDetails(order) || "No contact details"} - {formatDate(order.created_at)}</p>
                    </div>
                    <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                  </div>

                  <div className="simpleItems">
                    {order.items.length === 0 ? (
                      <span>No links found for this request.</span>
                    ) : (
                      order.items.map((item, index) => (
                        <div className="simpleItemRow" key={item.id}>
                          <div>
                            <strong>{item.product_name || `${item.shop} product`}</strong>
                            <small>
                              {item.shop}
                              {item.selected_options?.description
                                ? ` - ${item.selected_options.description}`
                                : ""}
                            </small>
                          </div>
                          <a href={item.product_link} target="_blank" rel="noreferrer">
                            Link {index + 1}
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="adminNotesBox">
                    <label htmlFor={`note-${order.id}`}>Admin note</label>
                    <textarea
                      id={`note-${order.id}`}
                      value={orderNotes[order.id] ?? ""}
                      onChange={(event) =>
                        setOrderNotes((currentNotes) => ({
                          ...currentNotes,
                          [order.id]: event.target.value,
                        }))
                      }
                      placeholder="Example: price confirmed, missing size, customer wants black..."
                    />
                  </div>

                  {order.events && order.events.length > 0 && (
                    <div className="orderNotesHistory">
                      <strong>Notes history</strong>
                      {order.events.map((event) => (
                        <p key={event.id}>
                          <span>{event.status}</span>
                          {event.note || "No note"}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="adminOrderActions">
                    <button
                      className="confirmOrderBtn"
                      type="button"
                      disabled={updatingOrderId === order.id || removingOrderId === order.id}
                      onClick={() => handleConfirm(order)}
                    >
                      <CheckCircle2 size={18} />
                      {updatingOrderId === order.id ? "Confirming..." : "Confirm order"}
                    </button>
                    <button
                      className="removeOrderBtn"
                      type="button"
                      disabled={updatingOrderId === order.id || removingOrderId === order.id}
                      onClick={() => handleRemove(order)}
                    >
                      <Trash2 size={18} />
                      {removingOrderId === order.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="simpleAdminPanel">
          <div className="tableTop">
            <div>
              <h2>Already confirmed</h2>
              <p className="mutedText">These orders are now visible to users in tracking.</p>
            </div>
          </div>

          {confirmedOrders.length === 0 ? (
            <div className="compactEmpty">No confirmed orders yet.</div>
          ) : (
            <div className="adminCompactList">
              {confirmedOrders.slice(0, 10).map((order) => (
                <div className="adminCompactRow managedOrderRow" key={order.id}>
                  <div className="managedOrderInfo">
                    <div>
                      <strong>{getCustomerName(order)}</strong>
                      <small>{formatDate(order.created_at)} - {order.items.length} item(s)</small>
                      {order.events?.some((event) => event.note) && (
                        <small>
                          Note: {order.events.filter((event) => event.note).at(-1)?.note}
                        </small>
                      )}
                    </div>
                    <div className="managedOrderLinks">
                      {order.items.map((item, index) => (
                        <a href={item.product_link} target="_blank" rel="noreferrer" key={item.id}>
                          Link {index + 1}
                          <ExternalLink size={13} />
                        </a>
                      ))}
                    </div>
                    <div className="orderProcessForm">
                      <label>
                        Status
                        <select
                          value={orderDrafts[order.id]?.status ?? order.status}
                          onChange={(event) => updateOrderDraft(order.id, "status", event.target.value)}
                        >
                          {processStatuses.map((status) => (
                            <option value={status.value} key={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Final price TND
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={orderDrafts[order.id]?.final_price ?? ""}
                          onChange={(event) => updateOrderDraft(order.id, "final_price", event.target.value)}
                        />
                      </label>
                      <label>
                        Deposit TND
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={orderDrafts[order.id]?.deposit_amount ?? ""}
                          onChange={(event) => updateOrderDraft(order.id, "deposit_amount", event.target.value)}
                        />
                      </label>
                      <label>
                        Tracking number
                        <input
                          value={orderDrafts[order.id]?.tracking_number ?? ""}
                          onChange={(event) => updateOrderDraft(order.id, "tracking_number", event.target.value)}
                        />
                      </label>
                      <label className="processNoteField">
                        Note
                        <textarea
                          value={orderDrafts[order.id]?.note ?? ""}
                          onChange={(event) => updateOrderDraft(order.id, "note", event.target.value)}
                          placeholder="What changed? This note appears in the order history."
                        />
                      </label>
                    </div>
                  </div>
                  <div className="confirmedOrderActions">
                    <span className="badge green">{order.status}</span>
                    <button
                      className="primaryMiniBtn"
                      type="button"
                      disabled={updatingOrderId === order.id || removingOrderId === order.id}
                      onClick={() => handleProcessUpdate(order)}
                    >
                      {updatingOrderId === order.id ? "Saving..." : "Save update"}
                    </button>
                    <button
                      className="removeOrderBtn small"
                      type="button"
                      disabled={removingOrderId === order.id}
                      onClick={() => handleRemove(order)}
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
