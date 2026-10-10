import { useCommerceCopy } from "../i18n/commerceCopy";
import DeliveryContent from "../components/DeliveryContent";
import { parseInvitation } from "../invitationData";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProfileNavLink from "../components/ProfileNavLink";
import { apiFetch } from "../api";
import { loadPayments, PAYMENT_LABELS, whatsappMessage } from "../payments";
import type { PaymentDraft, PaymentOrder } from "../payments";

export default function Payment() {
  const copy = useCommerceCopy();
  const [params] = useSearchParams();
  const [draft] = useState<PaymentDraft | null>(() => {
    try { return JSON.parse(localStorage.getItem(`jibli-payment-${params.get("draft")}`) ?? sessionStorage.getItem(`jibli-payment-${params.get("draft")}`) ?? "null"); } catch { return null; }
  });
  const [payment, setPayment] = useState<PaymentOrder | null>(null);
  const [phone, setPhone] = useState("");
  const [authorization, setAuthorization] = useState("");
  const [repeatAuthorization, setRepeatAuthorization] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!draft && !params.get("id") && !params.get("draft")) return;
    loadPayments().then((rows) => setPayment(rows.find((row) => row.id === (params.get("id") || params.get("draft") || draft?.id)) ?? null))
      .catch((e) => setError(e.message));
  }, [draft, params]);
  async function prepare(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const saved = (await apiFetch("/payments/checkout", { method: "POST", body: JSON.stringify({ ...draft, phone }) })).payment; setPayment(saved); if (draft) localStorage.removeItem(`jibli-payment-${draft.id}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not prepare payment."); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!payment) return;
    if (authorization.trim() !== repeatAuthorization.trim()) { setError("The authorization numbers do not match. Check your D17 receipt."); return; }
    setBusy(true); setError("");
    try { setPayment((await apiFetch(`/payments/${payment.id}/reference`, { method: "POST", body: JSON.stringify({ authorization: authorization.trim() }) })).payment); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not submit payment."); }
    finally { setBusy(false); }
  }
  return <div><Navbar><ProfileNavLink /></Navbar><main className="d17Page">
    <img className="d17Logo" src="/payments/d17.png" alt="D17 — DigipostBank" width="188" height="148" />
    <span className="eyebrow">{copy("D17 payment")} </span><h1>{copy("Pay, then send your reference.")} </h1>
    {!payment && draft && <form className="invitationForm d17Panel" onSubmit={prepare}>
      <p>{copy("Confirm your WhatsApp number to receive your order updates. The amount will be confirmed before you pay.")} </p>
      <label>{copy("Your WhatsApp number")} <input type="tel" required pattern="(\+?216)?[2459][0-9]{7}" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={copy("Your 8-digit Tunisian number")} /></label>
      <button className="primaryBtn" disabled={busy}>{busy ? copy("Loading…") : copy("Show payment details")}</button>
    </form>}
    {!payment && !draft && <p>{copy("Choose an order from")} <Link to="/tracking">{copy("your orders")} </Link>{copy(", or select an invitation or digital offer first.")} </p>}
    {payment && <section className="d17Panel">
      <h2>{payment.title}</h2><details><summary>{copy("Order summary")} </summary><p className="d17Details">{parseInvitation(payment.details).request}</p></details><p className="d17Amount">{payment.amount} <span>{copy("TND")} </span></p>
      <p className="badge">{copy(PAYMENT_LABELS[payment.status])}</p>
      {payment.review_note && <p role="status">{payment.review_note}</p>}
      {["pending_payment", "rejected"].includes(payment.status) && <>
        <ol className="d17Steps"><li>{copy("Open D17 and transfer")} <strong>{payment.amount}{copy("TND")} </strong>{copy("to")} <strong>92001397</strong>.</li><li>{copy("On your successful transfer receipt, find")} <strong>{copy("Numéro autorisation")} </strong>.</li><li>{copy("Copy that number exactly below, keeping any leading zeros.")} </li></ol>
        <p>{copy("Only pay once. If your reference was rejected, check the receipt or contact Jibli before making another transfer.")} </p>
        <form className="invitationForm" onSubmit={submit}>
          <label>{copy("Numéro d’autorisation")} <input required inputMode="numeric" pattern="[0-9]{1,30}" maxLength={30} autoComplete="off" value={authorization} onChange={(e) => setAuthorization(e.target.value)} placeholder={copy("Number from your D17 receipt")} /></label>
          <label>{copy("Confirm the authorization number")} <input required inputMode="numeric" pattern="[0-9]{1,30}" maxLength={30} autoComplete="off" value={repeatAuthorization} onChange={(e) => setRepeatAuthorization(e.target.value)} placeholder={copy("Enter the same number again")} /></label>
          <p>{copy("Enter the authorization number, not your phone number or D17 PIN. Jibli will verify the transfer manually.")} </p>
          <button className="primaryBtn" disabled={busy}>{busy ? copy("Saving…") : copy("Submit for verification")}</button>
        </form>
      </>}
      {payment.status === "pending_verification" && <>
        <div className="d17Delivery" role="status"><h3>{copy("Jibli is reviewing your order")} </h3><p>{copy("We have received your payment reference. Our team will check your payment and contact you on WhatsApp within")} <strong>{copy("5 to 60 minutes")} </strong>.</p></div>
        <p>{copy("Your reference")} <strong>{payment.authorization}</strong>{copy("is saved. Tap below to send your payment details to Jibli on WhatsApp.")} </p>
        <a className="primaryBtn" href={whatsappMessage(payment)} target="_blank" rel="noreferrer">{copy("Send on WhatsApp")} </a>
      </>}
      {payment.delivery && <DeliveryContent content={payment.delivery} />}
      <p><Link to="/tracking">{copy("View your orders and payment updates")} </Link></p>
    </section>}
    {error && <p role="alert" className="d17Error">{error}</p>}
  </main></div>;
}
