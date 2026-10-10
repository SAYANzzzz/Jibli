import { useCommerceCopy } from "../i18n/commerceCopy";
import { usePersistentState } from "../usePersistentState";
import AnimatedInvitation from "../components/AnimatedInvitation";
import PaymentButton from "../components/PaymentButton";
import { useMemo } from "react";
import { ArrowRight, Check, ChevronLeft, ImagePlus, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

type EngagementDesign = { id: string; title: string; style: string; image: string; description: string; needsPhotos?: boolean };

const ENGAGEMENT_DESIGNS: EngagementDesign[] = [
  { id: "garden-hands", title: "Garden hands", style: "Classic · Romantic", image: "/invitations/engagements/garden-hands.jfif", description: "Delicate hands, subtle florals and a clean editorial layout." },
  { id: "ring-promise", title: "Ring promise", style: "Monochrome · Timeless", image: "/invitations/engagements/ring-promise.jfif", description: "A striking black-and-white ring moment for a refined announcement." },
  { id: "intimate-vows", title: "Intimate vows", style: "Photo · Elegant", image: "/invitations/engagements/intimate-vows.jfif", description: "A warm close-up photo invitation with modern white typography.", needsPhotos: true },
  { id: "childhood-love", title: "Childhood love", style: "Photo · Playful", image: "/invitations/engagements/childhood-love.jfif", description: "A sentimental design that turns childhood photos into a love story.", needsPhotos: true },
];

function whatsappUrl(design: EngagementDesign, details: Record<string, string>) {
  const lines = ["Hi Jibli! I want a personalised engagement invitation.", "", `Design: ${design.title} (${design.style})`, "Price: 10 TND", `Couple: ${details.couple || "Not decided"}`, `Date: ${details.date || "Not decided"}`, `Time: ${details.time || "Not decided"}`, `Venue: ${details.venue || "Not decided"}`, `Language: ${details.language}`, `RSVP / contact: ${details.rsvp || "Not decided"}`, design.needsPhotos ? "Photos: I will send the couple's photos on WhatsApp." : "", details.note ? `Extra request: ${details.note}` : ""].filter(Boolean);
  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function EngagementInvitations() {
  const copy = useCommerceCopy();
  const [selectedId, setSelectedId] = usePersistentState<string | null>("jibli-design-engagements", null);
  const [details, setDetails] = usePersistentState("jibli-details-engagements", { mood: "", couple: "", date: "", time: "", venue: "", language: "Arabic / French", rsvp: "", note: "" });
  const selected = useMemo(() => ENGAGEMENT_DESIGNS.find((design) => design.id === selectedId) ?? null, [selectedId]);
  const update = (field: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [field]: value }));

  return <div>
    <Navbar><Link to="/request" className="outlineBtn">{copy("Order from AliExpress")} </Link><ProfileNavLink /></Navbar>
    <main className="weddingStudioPage engagementStudioPage">
      {!selected ? <>
        <section className="weddingStudioHero engagementStudioHero"><div><span className="weddingStudioEyebrow"><Sparkles size={15} />{copy("Jibli engagement invitations")} </span><h1>{copy("Say")} <em>{copy("yes")} </em>{copy("in your")} <br />{copy("own beautiful way.")} </h1><p>{copy("Pick your style, share your details, and we will prepare an engagement invitation made to send on WhatsApp.")} </p><a href="#engagement-designs" className="weddingHeroButton">{copy("Choose your design")} <ArrowRight size={17} /></a></div><aside className="weddingHeroPromise"><span>01</span><strong>{copy("Choose a style")} </strong><p>{copy("Four engagement designs to make your own.")} </p><span>02</span><strong>{copy("Share the details")} </strong><p>{copy("Names, date, venue and your preferred language.")} </p><span>03</span><strong>{copy("Send the joy")} </strong><p>{copy("Receive a final invitation ready for WhatsApp.")} </p></aside></section>
        <section className="weddingDesignSection" id="engagement-designs"><div className="weddingSectionHeading"><div><span className="eyebrow">{copy("Engagement collection")} </span><h2>{copy("Choose your starting style")} </h2><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link></div><p>{copy("Every design is personalised by Jibli. Select one to begin your request.")} </p></div><div className="weddingDesignGrid engagementDesignGrid">{ENGAGEMENT_DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}><img src={design.image} alt={`${design.title} engagement invitation example`} loading="lazy" decoding="async" /><div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p>{design.needsPhotos && <small><ImagePlus size={14} />{copy("Couple photos needed")} </small>}<span className="invitationCardPrice">{copy("10 TND")} </span><b>{copy("Choose design")} <ArrowRight size={15} /></b></div></button>)}</div></section>
      </> : <section className="weddingOrderPage"><div className="weddingOrderBackLinks"><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} />{copy("All engagement designs")} </button></div><div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>{copy("Personalise")} {selected.title}</h1><strong className="invitationPrice">{copy("10 TND")} </strong><p>{copy("Send us the essentials. We will confirm your final wording and delivery time before we begin.")} </p></div><div className="weddingOrderGrid"><div className="weddingSelectedDesign"><AnimatedInvitation key={selected.id} image={selected.image} title={selected.title} details={details} onMoodChange={(mood) => setDetails((current) => ({ ...current, mood }))} /><div><strong>{selected.title}</strong><span>{selected.description}</span>{selected.needsPhotos && <p><ImagePlus size={15} />{copy("Send your photos in the WhatsApp chat after submitting.")} </p>}</div></div><form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}><label>{copy("Couple's names")} <input required maxLength={160} value={details.couple} onChange={(event) => update("couple", event.target.value)} placeholder={copy("Example: Ahmed & Sara")} /></label><div className="invitationFormRow"><label>{copy("Date")} <input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label><label>{copy("Time")} <input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label></div><label><MapPin size={15} />{copy("Venue and city")} <input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder={copy("Example: Salle des fêtes, Tunis")} /></label><div className="invitationFormRow"><label>{copy("Invitation language")} <select value={details.language} onChange={(event) => update("language", event.target.value)}><option value="Arabic / French">{copy("Arabic / French")}</option><option value="Arabic">{copy("Arabic")}</option><option value="French">{copy("French")}</option><option value="English">{copy("English")}</option><option value="Arabic / English">{copy("Arabic / English")}</option></select></label><label>{copy("RSVP / contact")} <input value={details.rsvp} onChange={(event) => update("rsvp", event.target.value)} placeholder={copy("Phone number or name")} /></label></div><label>{copy("Special wording or changes")} <textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder={copy("Family names, dress code, colour changes...")} /></label><PaymentButton productKey={`invitation:engagements:${selected.id}`} requestUrl={whatsappUrl(selected, details)} invitation={{ image: selected.image, title: selected.title, mood: details.mood, details, certificate: selected.id.includes("certificate") || selected.id.includes("weekly-star") }} /><p><Check size={15} />{copy("You approve the final proof before it is delivered.")} </p></form></div></section>}
    </main><Footer />
  </div>;
}

export default EngagementInvitations;
