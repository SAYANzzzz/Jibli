import type { InvitationData } from "./invitationData";

export function invitationShareMessage(invitation: InvitationData, url: string, client = false) {
  const { details } = invitation;
  const language = details.language?.toLowerCase() || "";
  const locale = language.startsWith("arabic") || language === "ar" ? "ar" : language.startsWith("french") || language === "fr" ? "fr" : "en";
  const name = details.couple?.trim() || details.name?.trim();
  const wording = {
    en: { ready: "Your personalised invitation is ready!", forward: "Open the link below to preview your invitation, then share it with your guests. No account is needed.", welcome: "You are warmly invited!", open: "Open your invitation for all the details:", sign: "With care, Jibli", date: "Date", time: "Time (Tunisia)", venue: "Venue" },
    fr: { ready: "Votre invitation personnalisée est prête !", forward: "Ouvrez le lien ci-dessous pour découvrir votre invitation, puis partagez-le avec vos invités. Aucun compte n’est nécessaire.", welcome: "Vous êtes chaleureusement invités !", open: "Découvrez votre invitation et tous les détails :", sign: "Avec soin, Jibli", date: "Date", time: "Heure (Tunisie)", venue: "Lieu" },
    ar: { ready: "دعوتكم الشخصية جاهزة!", forward: "افتحوا الرابط أدناه لمعاينة دعوتكم ثم شاركوه مع ضيوفكم. لا حاجة إلى حساب.", welcome: "يسعدنا دعوتكم!", open: "افتحوا دعوتكم للاطلاع على جميع التفاصيل:", sign: "مع أطيب التمنيات، جيبلي", date: "التاريخ", time: "التوقيت (تونس)", venue: "المكان" },
  }[locale];
  let date = details.date || "";
  if (date) {
    const parsed = new Date(`${date}T12:00:00+01:00`);
    if (Number.isFinite(parsed.getTime())) date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Africa/Tunis" }).format(parsed);
  }
  const eventDetails = [
    date ? `${wording.date}: ${date}` : "",
    details.time ? `${wording.time}: ${details.time}` : "",
    details.venue?.trim() ? `${wording.venue}: ${details.venue.trim()}` : ""].filter(Boolean).join("\n");
  return [client ? wording.ready : wording.welcome, name || invitation.title, eventDetails,
    `${client ? wording.forward : wording.open}\n${url}`, client ? wording.sign : ""].filter(Boolean).join("\n\n");
}

export function invitationClientPhone(phone: string) {
  let digits = phone.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length === 8) digits = `216${digits}`;
  return /^\d{9,15}$/.test(digits) ? digits : "";
}
