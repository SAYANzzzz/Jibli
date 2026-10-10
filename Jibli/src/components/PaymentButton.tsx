import { startPayment } from "../payments";
import type { InvitationData } from "../invitationData";
import { useTranslation } from "../i18n/useTranslation";

export default function PaymentButton({ productKey, requestUrl, orderId, invitation }: { productKey: string; requestUrl?: string; orderId?: string; invitation?: InvitationData }) {
  const { language } = useTranslation();
  return <button type="button" className="primaryBtn invitationWhatsappBtn" onClick={(event) => {
    if (!event.currentTarget.closest("form")?.reportValidity() && event.currentTarget.closest("form")) return;
    const details = requestUrl ? new URL(requestUrl, window.location.origin).searchParams.get("text") ?? "" : "";
    const collection = invitation?.image.split("/")[2];
    const mood = invitation?.mood || (collection === "birthdays" ? "confetti" : collection === "family" ? "garden" : collection === "openings" || collection === "graduations" ? "midnight" : "champagne");
    startPayment(productKey, invitation ? JSON.stringify({ request: `${details}\nColour mood: ${mood}`, invitation: { ...invitation, mood } }) : details, orderId);
  }}>{language === "fr" ? "Continuer au paiement D17" : language === "ar" ? "متابعة الدفع عبر D17" : "Continue to D17 payment"}</button>;
}
