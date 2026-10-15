import { useCommerceCopy } from "../i18n/commerceCopy";
import DeliveryContent from "./DeliveryContent";
import InvitationEditor from "./InvitationEditor";
import { parseInvitation } from "../invitationData";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { loadPayments, PAYMENT_LABELS, whatsappMessage } from "../payments";
import type { PaymentOrder } from "../payments";

export default function PaymentOrders({ admin = false, refreshKey = 0 }: { admin?: boolean; refreshKey?: number }) {
  const copy = useCommerceCopy();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [kindFilter, setKindFilter] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deliveries, setDeliveries] = useState<Record<string, string>>({});
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { const rows = await loadPayments(admin); setOrders(rows); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load payments."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [admin]);
  useEffect(() => {
    let active = true;
    loadPayments(admin).then((rows) => { if (active) setOrders(rows); })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Could not load payments."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [admin, refreshKey]);
  const filteredOrders = orders.filter((order) => (!statusFilter || order.status === statusFilter)
    && (!kindFilter || order.kind === kindFilter)
    && (!search.trim() || [order.id, order.title, order.phone, order.authorization].join(" ").toLowerCase().includes(search.trim().toLowerCase())));
  async function review(order: PaymentOrder, status: string) {
    setBusy(order.id); setError("");
    try {
      const { payment } = await apiFetch(`/admin/payments/${order.id}`, { method: "PATCH", body: JSON.stringify({ status, note: notes[order.id] ?? "", delivery: deliveries[order.id] ?? order.delivery ?? "" }) });
      setOrders((rows) => rows.map((row) => row.id === payment.id ? payment : row));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update payment."); }
    finally { setBusy(""); }
  }
  return <section className="d17Orders" id={admin ? "d17-review" : "my-payments"}>
    <div className="tableTop"><div>{admin && <span className="eyebrow">Payment desk</span>}<h2>{admin ? "D17 payments & delivery" : "Payments & digital orders"}</h2><p>{admin ? "Check the amount, recipient and authorization in D17 before confirming." : "Payment verification, order confirmation and delivery updates."}</p></div><button className="outlineBtn" type="button" onClick={refresh} disabled={refreshing}>{copy(refreshing ? "Loading…" : "Refresh")} </button></div>
    {admin && !loading && <div className="adminPaymentQueues" aria-label="Payment queues">{[["pending_verification", "To verify"], ["confirmed", "Ready to prepare"], ["processing", "In progress"], ["delivered", "Delivered"]].map(([status, label]) => <button type="button" key={status} aria-pressed={statusFilter === status} onClick={() => setStatusFilter((current) => current === status ? "" : status)}><strong>{orders.filter((order) => order.status === status).length}</strong><span>{label}</span></button>)}</div>}
    {error && <p role="alert" className="d17Error">{error}</p>}
    {loading && <p>{copy("Loading payments…")} </p>}
    {!loading && !error && orders.length === 0 && <p>{copy("No D17 payments yet.")} </p>}
    {admin && <div className="invitationFormRow"><label>{copy("Search orders")} <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={copy("Phone, reference, title or order number")} /></label><label>{copy("Payment status")} <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">{copy("All statuses")} </option>{Object.entries(PAYMENT_LABELS).map(([key, label]) => <option key={key} value={key}>{copy(label)}</option>)}</select></label></div>}
    {admin && <label className="adminPaymentKind">Order type<select aria-label="Order type" value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}><option value="">All types</option>{[...new Set(orders.map((order) => order.kind))].sort().map((kind) => <option key={kind} value={kind}>{kind.replaceAll("_", " ")}</option>)}</select></label>}
    {admin && !loading && !error && orders.length > 0 && <p className="adminResultCount" role="status">{filteredOrders.length} of {orders.length} payments{(search || statusFilter || kindFilter) && <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); setKindFilter(""); }}>Clear filters</button>}</p>}
    {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && <p className="compactEmpty">No payments match your filters.</p>}
    {filteredOrders.map((order) => <article className="d17Panel" key={order.id} data-status={order.status}>
      <span className="eyebrow">#{order.id.slice(0, 8).toUpperCase()}{copy("·")} {new Date(order.created_at).toLocaleDateString()}</span>
      <h3>{order.title}</h3><strong>{order.amount}{copy("TND")} </strong><p>{copy(PAYMENT_LABELS[order.status])}</p>
      {order.authorization && <p>{copy("Numéro d’autorisation:")} <strong>{order.authorization}</strong></p>}
      {order.review_note && <p>{order.review_note}</p>}
      {order.delivery && <DeliveryContent content={order.delivery} invitation={parseInvitation(order.details).invitation} clientPhone={admin ? order.phone : undefined} />}
      {!admin && <Link className="outlineBtn" to={`/payment?id=${order.id}`}>{["pending_payment", "rejected"].includes(order.status) ? "Continue payment" : "View payment"}</Link>}
      {admin && <>
        <p>{copy("Customer WhatsApp:")} {order.phone}</p><details><summary>{copy("Order details")} </summary><p className="d17Details">{parseInvitation(order.details).request}</p></details>
        {order.title && order.kind === "invitation" && ["confirmed", "processing", "delivered"].includes(order.status) && <InvitationEditor order={order} onSave={(saved) => { setOrders((rows) => rows.map((row) => row.id === saved.id ? saved : row)); setDeliveries((current) => ({ ...current, [saved.id]: saved.delivery })); }} />}
        {["pending_verification", "confirmed", "processing"].includes(order.status) && <div className="invitationForm">
          <label>{copy("Message to customer")} <textarea value={notes[order.id] ?? ""} onChange={(e) => setNotes((current) => ({ ...current, [order.id]: e.target.value }))} placeholder={copy("Confirmation, delivery update or reason for rejection")} /></label>
          {order.status === "pending_verification" ? <div className="d17Actions"><button disabled={busy === order.id} className="primaryBtn" type="button" onClick={() => review(order, "confirmed")}>{copy("I checked D17 — confirm payment")} </button><button disabled={busy === order.id} className="outlineBtn" type="button" onClick={() => review(order, "rejected")}>{copy("Reject reference")} </button></div> : <>
            <label>{copy("Gift card code, invitation / subscription link, or AliExpress tracking")} <textarea value={deliveries[order.id] ?? order.delivery ?? ""} onChange={(e) => setDeliveries((current) => ({ ...current, [order.id]: e.target.value }))} placeholder={copy("Delivery content visible only to this customer and admins")} /></label>
            <div className="d17Actions">{order.status === "confirmed" && <button disabled={busy === order.id} type="button" className="outlineBtn" onClick={() => review(order, "processing")}>{copy("Start processing")} </button>}<button disabled={busy === order.id} type="button" className="primaryBtn" onClick={() => review(order, "delivered")}>{copy("Save delivery & complete order")} </button></div>
          </>}
        </div>}
        {["confirmed", "processing", "delivered", "rejected"].includes(order.status) && <a className="outlineBtn" href={whatsappMessage(order, true)} target="_blank" rel="noreferrer">{copy("Send customer update on WhatsApp")} </a>}
      </>}
    </article>)}
  </section>;
}
