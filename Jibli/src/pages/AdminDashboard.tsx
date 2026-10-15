import PaymentOrders from "../components/PaymentOrders";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, CheckCircle2, Clock3, ExternalLink, Inbox, PackageCheck, RefreshCw, Search, Trash2 } from "lucide-react";
import { deleteAdminOrder, getAdminOrders, updateAdminOrderItem, updateAdminOrderStatus } from "../api";
import type { CartItem, Order } from "../api";
import { PROCESS_STAGES, STATUS_LABELS } from "../orderStatus";
import Navbar from "../components/Navbar";
import "./AdminDashboard.css";

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
    timeZone: "Africa/Tunis",
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

function formatItemOptions(item: CartItem) {
  const options = item.selected_options ?? {};
  return Object.entries(options)
    .filter(([, value]) => value && String(value).trim())
    .map(([label, value]) => `${label}: ${value}`)
    .join(", ");
}

// Photo first, then that item's info, then the next item's photo, then its
// info, and so on - deliberately not the original product link, since a
// photo of the actual item is clearer for the customer to confirm than a
// link back to the store. WhatsApp auto-previews a bare image URL pasted
// as text, so this is the closest a wa.me text-only link can get to
// actually sending a photo.
function buildPaymentRequestMessage(order: Order, amount: number) {
  const itemBlocks = order.items.map((item, index) => {
    const options = formatItemOptions(item);
    const lines = [
      item.image_url || "",
      `${index + 1}. ${item.product_name || `${item.shop} product`}`,
      `Quantity: ${item.quantity}`,
      options ? options : "",
    ].filter(Boolean);

    return lines.join("\n");
  });

  return [
    `Hi ${order.profiles?.full_name || "there"}, this is Jibli.`,
    `Your order #${order.id.slice(0, 8).toUpperCase()}:`,
    "",
    itemBlocks.join("\n\n"),
    "",
    `Total: ${amount} TND`,
    `Pay with D17 to 92001397. Open your order on the website, submit the exact num?ro d?autorisation from your receipt, then send it to us on WhatsApp.`,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleLimit, setVisibleLimit] = useState(10);

  const acceptOrders = useCallback((response: { orders: Order[] }) => {
    setOrders(response.orders); setErrorMessage(""); setIsLoading(false);
    setOrderDrafts((current) => {
      const next = { ...current };
      for (const order of response.orders) if (!next[order.id]) next[order.id] = { status: order.status, final_price: order.final_price?.toString() ?? "", deposit_amount: order.deposit_amount?.toString() ?? "", tracking_number: order.tracking_number ?? "", note: "" };
      return next;
    });
  }, []);
  const loadOrders = useCallback(async () => {
    try { acceptOrders(await getAdminOrders()); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : "Could not load orders."); setIsLoading(false); }
  }, [acceptOrders]);
  useEffect(() => {
    let active = true;
    getAdminOrders().then((response) => { if (active) acceptOrders(response); })
      .catch((error) => { if (active) { setErrorMessage(error instanceof Error ? error.message : "Could not load orders."); setIsLoading(false); } });
    return () => { active = false; };
  }, [acceptOrders]);

  const newRequests = useMemo(
    () => orders.filter((order) => order.status === "new_request"),
    [orders],
  );

  const waitingPaymentOrders = useMemo(
    () => orders.filter((order) => order.status === "waiting_confirmation"),
    [orders],
  );

  const confirmedOrders = useMemo(
    () => orders.filter((order) => order.status !== "new_request" && order.status !== "waiting_confirmation"),
    [orders],
  );

  const matchesSearch = (order: Order) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      order.id,
      order.profiles?.full_name,
      order.profiles?.email,
      order.profiles?.phone,
      ...order.items.flatMap((item) => [item.product_name, item.product_link]),
    ].some((value) => value?.toLowerCase().includes(query));
  };

  const visibleNewRequests = newRequests.filter(matchesSearch);
  const visibleWaitingPaymentOrders = waitingPaymentOrders.filter(matchesSearch);
  const visibleConfirmedOrders = confirmedOrders.filter(matchesSearch)
    .filter((order) => !statusFilter || order.status === statusFilter)
    .sort((a, b) => sortOrder === "oldest"
      ? Date.parse(a.created_at) - Date.parse(b.created_at)
      : Date.parse(b.created_at) - Date.parse(a.created_at));

  const refreshDashboard = async () => {
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
    try { await loadOrders(); } finally { setRefreshing(false); }
  };

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

  const handleRequestPayment = async (order: Order) => {
    const amountText = orderDrafts[order.id]?.final_price ?? "";
    const amount = amountText ? Number(amountText) : NaN;

    if (!amount || amount <= 0) {
      setErrorMessage("Enter the amount to charge before requesting payment.");
      return;
    }

    setUpdatingOrderId(order.id);
    setErrorMessage("");

    try {
      const note = orderNotes[order.id]?.trim() || `Payment requested: ${amount} TND.`;
      await updateAdminOrderStatus(order.id, {
        status: "waiting_confirmation",
        final_price: amount,
        note,
      });
      setOrderNotes((currentNotes) => ({ ...currentNotes, [order.id]: "" }));
      notifyCustomer(order, buildPaymentRequestMessage(order, amount));
      await loadOrders();
    } catch (error) {
      console.error("Could not request payment", error);
      setErrorMessage(error instanceof Error ? error.message : "Could not request payment.");
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
      <Navbar hidePrimaryNav>
        <button className="outlineBtn" type="button" onClick={refreshDashboard} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? "adminRefreshing" : undefined} />
          {refreshing ? "Refreshing…" : "Refresh dashboard"}
        </button>
        <Link to="/" className="primaryBtn">Website</Link>
      </Navbar>

      <main className="simpleAdminMain">
        <section className="simpleAdminHeader">
          <div><span className="eyebrow">Jibli workspace · Admin only</span>
          <h1>Your business, at a glance.</h1>
          <p>Review payments, prepare invitations, and keep every order moving.</p></div>
          <a className="adminReviewShortcut" href="#d17-review">Review D17 payments <ArrowDown size={16} /></a>
        </section>

        <section className="simpleAdminStats" aria-label="Product order overview" aria-busy={isLoading}>
          <a href="#admin-new"><Inbox size={20} /><span>New requests</span><strong>{isLoading ? "—" : newRequests.length}</strong><small>Review & quote</small></a>
          <a href="#admin-waiting"><Clock3 size={20} /><span>Waiting payment</span><strong>{isLoading ? "—" : waitingPaymentOrders.length}</strong><small>Follow up with customers</small></a>
          <a href="#admin-managed"><PackageCheck size={20} /><span>In progress</span><strong>{isLoading ? "—" : confirmedOrders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length}</strong><small>Prepare & track</small></a>
          <a href="#admin-managed" onClick={() => { setStatusFilter("delivered"); setVisibleLimit(10); }}><CheckCircle2 size={20} /><span>Delivered</span><strong>{isLoading ? "—" : orders.filter((order) => order.status === "delivered").length}</strong><small>Completed product orders</small></a>
        </section>

        <nav className="adminQueueNav" aria-label="Dashboard sections"><a href="#d17-review">Payments & digital delivery</a><a href="#admin-new">New requests</a><a href="#admin-waiting">Waiting payment</a><a href="#admin-managed">Manage orders</a></nav>
        <PaymentOrders admin refreshKey={refreshKey} />

        <div className="adminProductHeading"><div><span className="eyebrow">Product orders</span><h2>Requests & fulfilment</h2></div><span>{orders.length} total orders</span></div>
        <label className="adminOrderSearch">
          <span><Search size={16} /> Find a product order</span>
          <input type="search" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setVisibleLimit(10); }} placeholder="Customer, phone, order ID, product or link" />
        </label>

        {errorMessage && <div role="alert" className="noticeBox warning adminNotice">{errorMessage}</div>}
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

        <section className="simpleAdminPanel" id="admin-new">
          <div className="tableTop">
            <div>
              <h2>New WhatsApp requests</h2>
              <p className="mutedText">Only orders with status New request are shown here.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="emptyOrdersState">Loading orders...</div>
          ) : visibleNewRequests.length === 0 ? (
            <div className="emptyOrdersState">
              <CheckCircle2 size={42} />
              <h2>{searchQuery ? "No matching requests" : "No new requests"}</h2>
              <p>{searchQuery ? "Try a different customer, product, phone number, or order ID." : "When a user sends a request through WhatsApp, it will appear here."}</p>
            </div>
          ) : (
            <div className="simpleOrderList">
              {visibleNewRequests.map((order) => (
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
                    <label htmlFor={`price-${order.id}`}>Amount to charge (TND)</label>
                    <input
                      id={`price-${order.id}`}
                      type="number"
                      min="0"
                      step="0.001"
                      value={orderDrafts[order.id]?.final_price ?? ""}
                      onChange={(event) => updateOrderDraft(order.id, "final_price", event.target.value)}
                      placeholder="Example: 85"
                    />
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
                      onClick={() => handleRequestPayment(order)}
                    >
                      <CheckCircle2 size={18} />
                      {updatingOrderId === order.id ? "Sending..." : "Request payment"}
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

        <section className="simpleAdminPanel" id="admin-waiting">
          <div className="tableTop">
            <div>
              <h2>Waiting for payment</h2>
              <p className="mutedText">Payment was requested — confirm once the customer has paid.</p>
            </div>
          </div>

          {visibleWaitingPaymentOrders.length === 0 ? (
            <div className="compactEmpty">No orders waiting for payment.</div>
          ) : (
            <div className="simpleOrderList">
              {visibleWaitingPaymentOrders.map((order) => (
                <article className="simpleOrderCard" key={order.id}>
                  <div className="simpleOrderTop">
                    <div>
                      <span className="badge">Waiting payment</span>
                      <h3>{getCustomerName(order)}</h3>
                      <p>{getCustomerDetails(order) || "No contact details"} - {formatDate(order.created_at)}</p>
                    </div>
                    <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                  </div>

                  <div className="simpleItems">
                    <div className="simpleItemRow">
                      <div>
                        <strong>Amount requested</strong>
                        <small>{order.final_price ?? "—"} TND</small>
                      </div>
                    </div>
                  </div>

                  <div className="adminNotesBox">
                    <label htmlFor={`waiting-note-${order.id}`}>Admin note</label>
                    <textarea
                      id={`waiting-note-${order.id}`}
                      value={orderNotes[order.id] ?? ""}
                      onChange={(event) =>
                        setOrderNotes((currentNotes) => ({
                          ...currentNotes,
                          [order.id]: event.target.value,
                        }))
                      }
                      placeholder="Example: paid via D17, confirmed by customer..."
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
                    <a className="outlineBtn" href="#d17-review">Review D17 payment above</a>
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

        <section className="simpleAdminPanel" id="admin-managed">
          <div className="tableTop">
            <div>
              <h2>Manage orders</h2>
              <p className="mutedText">Update fulfilment, item photos, and customer tracking.</p>
            </div>
          </div>

          <div className="adminManagedFilters">
            <label>Order status<select aria-label="Order status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setVisibleLimit(10); }}><option value="">All managed statuses</option>{PROCESS_STAGES.filter((stage) => stage.value !== "waiting_confirmation").map((stage) => <option value={stage.value} key={stage.value}>{stage.label}</option>)}</select></label>
            <label>Sort by<select aria-label="Sort by" value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setVisibleLimit(10); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
            <span role="status">{visibleConfirmedOrders.length} matching orders</span>
          </div>
          {visibleConfirmedOrders.length === 0 ? (
            <div className="compactEmpty">{searchQuery || statusFilter ? "No orders match your filters. Try another search or status." : "No confirmed orders yet."}</div>
          ) : (
            <div className="adminCompactList">
              {visibleConfirmedOrders.slice(0, visibleLimit).map((order) => (
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
                              aria-label={`Item ${index + 1} name for order ${order.id.slice(0, 8)}`}
                              value={itemNameDrafts[item.id] ?? item.product_name ?? ""}
                              onChange={(event) =>
                                setItemNameDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                              }
                              placeholder="Item name shown to the customer"
                            />
                            <input
                              aria-label={`Item ${index + 1} photo for order ${order.id.slice(0, 8)}`}
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
          {visibleConfirmedOrders.length > visibleLimit && <div className="adminLoadMore"><span>Showing {visibleLimit} of {visibleConfirmedOrders.length} orders</span><button type="button" className="outlineBtn" onClick={() => setVisibleLimit((limit) => limit + 10)}>Show more orders</button></div>}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
