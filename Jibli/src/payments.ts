import { parseInvitation } from "./invitationData";
import { apiFetch } from "./api";

export type PaymentDraft = { id: string; product_key: string; details: string; order_id?: string };
export type PaymentOrder = {
  id: string; title: string; kind: string; amount: number; phone: string; details: string;
  authorization: string | null; status: string; delivery: string; review_note: string; created_at: string;
};
export const PAYMENT_LABELS: Record<string, string> = {
  pending_payment: "Awaiting D17 transfer", pending_verification: "Jibli is reviewing your order — we will contact you within 5 to 60 minutes",
  confirmed: "Payment verified — order confirmed", processing: "Preparing your order",
  delivered: "Delivered", rejected: "Payment could not be verified",
};
export function startPayment(product_key: string, details: string, order_id?: string) {
  const id = crypto.randomUUID();
  localStorage.setItem(`jibli-payment-${id}`, JSON.stringify({ id, product_key, details, order_id }));
  window.location.assign(`/payment?draft=${id}`);
}
export function whatsappMessage(payment: PaymentOrder, customer = false) {
  const phone = customer ? `216${payment.phone.replace(/^(?:\+?216)/, "")}` : "21692001397";
  const message = customer ? [
    `Jibli — order #${payment.id.slice(0, 8).toUpperCase()}`,
    payment.title, PAYMENT_LABELS[payment.status],
    payment.status === "confirmed" ? "Thank you! Your payment is verified. We are starting work on your order." : "",
    payment.delivery.startsWith("/invite/") ? new URL(payment.delivery, location.origin).href : payment.delivery, payment.review_note,
  ] : ["Jibli — D17 payment submitted", `Order: ${payment.id}`, payment.title,
    `Amount: ${payment.amount} TND`, "D17 recipient: 92001397", `Numéro d'autorisation: ${payment.authorization}`,
    `Customer WhatsApp: ${payment.phone}`, "Status: Pending manual verification", parseInvitation(payment.details).request];
  return `https://wa.me/${phone}?text=${encodeURIComponent(message.filter(Boolean).join("\n"))}`;
}
export async function loadPayments(admin = false): Promise<PaymentOrder[]> {
  return (await apiFetch(admin ? "/admin/payments" : "/payments")).payments;
}
