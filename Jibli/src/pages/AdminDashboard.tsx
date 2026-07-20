import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { deleteAdminOrder, getAdminOrders, updateAdminOrderItem, updateAdminOrderStatus } from "../api";
import type { CartItem, Order } from "../api";
import { PROCESS_STAGES, STATUS_LABELS } from "../orderStatus";
import Navbar from "../components/Navbar";

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

function sanitizePhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/[^0-9]/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("216")) {
    return digits;
  }

  if (digits.length === 8) {
    return `216${digits}`;
  }

  return digits;
}

function buildWhatsAppNotifyUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildStatusNotifyMessage(order: Order, params: { status: string; trackingNumber?: string }) {
  const statusLabel = STATUS_LABELS[params.status] ?? params.status;
  const lines = [
    `Hi ${order.profiles?.full_name || "there"}, this is Jibli.`,
    `Update on your order #${order.id.slice(0, 8).toUpperCase()}:`,
    `Status: ${statusLabel}`,
    params.trackingNumber?.trim() ? `Tracking number: ${params.trackingNumber.trim()}` : "",
    `Order updated to ${statusLabel}.`,
  ].filter(Boolean);

  return lines.join("\n");
}

function buildConfirmNotifyMessage(order: Order) {
  return [
    `Hi ${order.profiles?.full_name || "there"}, this is Jibli.`,
    `Update on your order #${order.id.slice(0, 8).toUpperCase()}:`,
    `Status: Order confirmed by admin`,
  ].join("\n");
}

function buildRemovalNotifyMessage(order: Order) {
  return [
    `Hi ${order.profiles?.full_name || "there"}, this is Jibli.`,
    `Your order #${order.id.slice(0, 8).toUpperCase()} has been removed. Contact us on WhatsApp if you have any questions.`,
  ].join("\n");
}

type PendingNotify = {
  customerName: string;
  url: string;
};

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [removingOrderId, setRemovingOrderId] = useState("");
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [orderDrafts, setOrderDrafts] = useState<Record<string, OrderDraft>>({});
  const [pendingNotify, setPendingNotify] = useState<PendingNotify | null>(null);
  const [notifyWarning, setNotifyWarning] = useState("");
  const [itemNameDrafts, setItemNameDrafts] = useState<Record<string, string>>({});
  const [itemFileDrafts, setItemFileDrafts] = useState<Record<string, File | null>>({});
  const [savingItemId, setSavingItemId] = useState("");

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

  const notifyCustomer = (order: Order, message: string) => {
    const phone = sanitizePhoneForWhatsApp(order.profiles?.phone);

    if (!phone) {
      setNotifyWarning(`Could not prepare a WhatsApp notification for ${getCustomerName(order)} — no phone number on file.`);
      return;
    }

    setNotifyWarning("");
    setPendingNotify({
      customerName: getCustomerName(order),
      url: buildWhatsAppNotifyUrl(phone, message),
    });
  };

  const handleConfirm = async (order: Order) => {
    setUpdatingOrderId(order.id);
    setErrorMessage("");

    try {
      const note = orderNotes[order.id]?.trim() || "Order confirmed by admin.";
      await updateAdminOrderStatus(order.id, {
        status: "price_confirmed",
        note,
      });
      setOrderNotes((currentNotes) => ({ ...currentNotes, [order.id]: "" }));
      notifyCustomer(order, buildConfirmNotifyMessage(order));
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
      notifyCustomer(order, buildRemovalNotifyMessage(order));
      await loadOrders();
    } catch (error) {
      console.error("Could not remove order", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not remove order.");
    } finally {
      setRemovingOrderId("");
    }
  };

  const handleSaveItem = async (item: CartItem) => {
    const name = itemNameDrafts[item.id];
    const file = itemFileDrafts[item.id];

    if (name === undefined && !file) {
      return;
    }

    setSavingItemId(item.id);
    setErrorMessage("");

    try {
      await updateAdminOrderItem(item.id, {
        productName: name,
        imageFile: file ?? undefined,
      });
      setItemFileDrafts((current) => ({ ...current, [item.id]: null }));
      await loadOrders();
    } catch (error) {
      console.error("Could not update item", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not update item.");
    } finally {
      setSavingItemId("");
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
      const note = draft.note.trim() || `Order updated to ${STATUS_LABELS[draft.status] ?? draft.status}.`;
      await updateAdminOrderStatus(order.id, {
        status: draft.status,
        final_price: draft.final_price ? Number(draft.final_price) : undefined,
        deposit_amount: draft.deposit_amount ? Number(draft.deposit_amount) : undefined,
        tracking_number: draft.tracking_number.trim() || undefined,
        note,
      });
      setOrderDrafts((currentDrafts) => ({
        ...currentDrafts,
        [order.id]: {
          ...draft,
          note: "",
        },
      }));
      notifyCustomer(
        order,
        buildStatusNotifyMessage(order, {
          status: draft.status,
          trackingNumber: draft.tracking_number,
        }),
      );
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
      <Navbar>
        <button className="outlineBtn" type="button" onClick={loadOrders}>
          <RefreshCw size={16} />
          Refresh
        </button>
        <Link to="/" className="primaryBtn">Website</Link>
      </Navbar>

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
        {notifyWarning && <div className="noticeBox warning adminNotice">{notifyWarning}</div>}

        {pendingNotify && (
          <div className="noticeBox success adminNotice adminNotifyBanner">
            <span>Ready to notify {pendingNotify.customerName} on WhatsApp.</span>
            <div className="adminNotifyBannerActions">
              <a
                className="primaryMiniBtn"
                href={pendingNotify.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setPendingNotify(null)}
              >
                Notify on WhatsApp
              </a>
              <button type="button" className="dismissNotifyBtn" onClick={() => setPendingNotify(null)}>
                Dismiss
              </button>
            </div>
          </div>
        )}

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
                          <span>{STATUS_LABELS[event.status] ?? event.status}</span>
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
                    <div className="managedOrderItemsEdit">
                      {order.items.map((item, index) => (
                        <div className="managedOrderItemEditRow" key={item.id}>
                          <div className="managedOrderItemPreview">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.product_name || `Item ${index + 1}`} />
                            ) : (
                              <span className="managedOrderItemPreviewEmpty">No photo</span>
                            )}
                          </div>
                          <div className="managedOrderItemFields">
                            <a href={item.product_link} target="_blank" rel="noreferrer" className="managedOrderItemLink">
                              Link {index + 1}
                              <ExternalLink size={13} />
                            </a>
                            <input
                              value={itemNameDrafts[item.id] ?? item.product_name ?? ""}
                              onChange={(event) =>
                                setItemNameDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                              }
                              placeholder="Item name shown to the customer"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                setItemFileDrafts((current) => ({
                                  ...current,
                                  [item.id]: event.target.files?.[0] ?? null,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="primaryMiniBtn"
                              disabled={savingItemId === item.id}
                              onClick={() => handleSaveItem(item)}
                            >
                              {savingItemId === item.id ? "Saving..." : "Save item"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="orderProcessForm">
                      <label>
                        Status
                        <select
                          value={orderDrafts[order.id]?.status ?? order.status}
                          onChange={(event) => updateOrderDraft(order.id, "status", event.target.value)}
                        >
                          {PROCESS_STAGES.map((status) => (
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
                          placeholder="Example: Your package arrived at local airport. Shown under this status on the customer's tracking timeline."
                        />
                      </label>
                    </div>
                  </div>
                  <div className="confirmedOrderActions">
                    <span className="badge green">{STATUS_LABELS[order.status] ?? order.status}</span>
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
