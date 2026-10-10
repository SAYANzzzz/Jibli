import { useCommerceCopy } from "../i18n/commerceCopy";
import { usePersistentState } from "../usePersistentState";
import AnimatedInvitation from "../components/AnimatedInvitation";
import PaymentButton from "../components/PaymentButton";

import { ArrowRight, Check, ChevronLeft, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";

const DESIGNS = [
  { id: "nouveau-florals", title: "Nouveau florals", style: "Floral / Vintage", description: "Soft pink paper and delicate botanical borders for a family reunion." },
  { id: "green-tradition", title: "Green tradition", style: "Traditional / Botanical", description: "Green accents, white flowers and a traditional patterned background." },
  { id: "family-roots", title: "Family roots", style: "Watercolour / Warm", description: "A golden family tree celebrates the generations coming together." },
  { id: "gathering-brunch", title: "Gathering brunch", style: "Editorial / Illustrated", description: "Textured paper and a lively table illustration for a shared meal." },
];

export default function FamilyGatheringInvitations() {
  const copy = useCommerceCopy();
  const [selectedId, setSelectedId] = usePersistentState<string | null>("jibli-design-family", null);
  const [details, setDetails] = usePersistentState("jibli-details-family", { mood: "", name: "", hosts: "", date: "", time: "", venue: "", language: "French / Arabic", contact: "", note: "" });
  const selected = DESIGNS.find((design) => design.id === selectedId);
  const update = (field: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [field]: value }));
  const whatsappUrl = selected ? `https://wa.me/21692001397?text=${encodeURIComponent([
    "Hi Jibli! I want a personalised family gathering invitation.",
    `Design: ${selected.title} (${selected.style})`, "Price: 10 TND",
    `Family name / gathering title: ${details.name || "Not decided"}`,
    `Hosts: ${details.hosts || "Not decided"}`,
    `Date: ${details.date || "Not decided"}`,
    `Time: ${details.time || "Not decided"}`,
    `Address: ${details.venue || "Not decided"}`,
    `Language: ${details.language}`,
    `RSVP / contact: ${details.contact || "Not decided"}`,
    details.note ? `Extra request: ${details.note}` : "",
  ].filter(Boolean).join("\n"))}` : "";

  return <div>
    <Navbar><Link to="/request" className="outlineBtn">{copy("Order from AliExpress")} </Link><ProfileNavLink /></Navbar>
    <main className="weddingStudioPage familyStudioPage">
      {!selected ? <>
        <section className="weddingStudioHero familyStudioHero">
          <div>
            <span className="weddingStudioEyebrow"><Users size={15} />{copy("Jibli family gatherings")} </span>
            <h1>{copy("Bring everyone together.")} <br /><em>{copy("Make it memorable.")} </em></h1>
            <p>{copy("Choose a family gathering style, add your celebration details, and we will personalise your invitation ready to share.")} </p>
            <a href="#family-designs" className="weddingHeroButton">{copy("Choose your design")} <ArrowRight size={17} /></a>
          </div>
          <aside className="weddingHeroPromise">
            <span>01</span><strong>{copy("Choose a style")} </strong><p>{copy("Four designs for reunions, gatherings and family meals.")} </p>
            <span>02</span><strong>{copy("Make it yours")} </strong><p>{copy("Add your family name, hosts and gathering details.")} </p>
            <span>03</span><strong>{copy("Invite your guests")} </strong><p>{copy("Approve your final invitation, then share it on WhatsApp.")} </p>
          </aside>
        </section>
        <section className="weddingDesignSection" id="family-designs">
          <div className="weddingSectionHeading">
            <div><span className="eyebrow">{copy("Family gathering collection")} </span><h2>{copy("Choose your family gathering style")} </h2><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link></div>
            <p>{copy("These are design examples. Your final invitation will use your own name and celebration details.")} </p>
          </div>
          <div className="weddingDesignGrid">
            {DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
              <img src={`/invitations/family/${design.id}.jfif`} alt={`${design.title} family gathering invitation example`} loading="lazy" decoding="async" />
              <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p><span className="invitationCardPrice">{copy("10 TND")} </span><b>{copy("Choose design")} <ArrowRight size={15} /></b></div>
            </button>)}
          </div>
        </section>
      </> : <section className="weddingOrderPage">
        <div className="weddingOrderBackLinks"><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} />{copy("All family designs")} </button></div>
        <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>{copy("Personalise")} {selected.title}</h1><strong className="invitationPrice">{copy("10 TND")} </strong><p>{copy("Tell us about your family gathering. We will confirm the final design and delivery time before starting.")} </p></div>
        <div className="weddingOrderGrid">
          <div className="weddingSelectedDesign"><AnimatedInvitation key={selected.id} image={`/invitations/family/${selected.id}.jfif`} title={selected.title} details={details} onMoodChange={(mood) => setDetails((current) => ({ ...current, mood }))} /><div><strong>{selected.title}</strong><span>{selected.description}</span></div></div>
          <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
            <div className="invitationFormRow">
              <label>{copy("Family name / gathering title")} <input required maxLength={160} value={details.name} onChange={(event) => update("name", event.target.value)} placeholder={copy("Family name / gathering title")} /></label>
              <label>{copy("Hosts")} <input value={details.hosts} onChange={(event) => update("hosts", event.target.value)} placeholder={copy("Names of the hosts")} /></label>
            </div>
            <div className="invitationFormRow">
              <label>{copy("Gathering date")} <input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label>
              <label>{copy("Gathering time")} <input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label>
            </div>
            <label>{copy("Address and city")} <input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder={copy("Street address, city")} /></label>
            <div className="invitationFormRow">
              <label>{copy("Invitation language")} <select value={details.language} onChange={(event) => update("language", event.target.value)}><option value="French / Arabic">{copy("French / Arabic")}</option><option value="Arabic">{copy("Arabic")}</option><option value="French">{copy("French")}</option><option value="English">{copy("English")}</option></select></label>
              <label>{copy("RSVP / contact")} <input value={details.contact} onChange={(event) => update("contact", event.target.value)} placeholder={copy("Phone, website or social handle")} /></label>
            </div>
            <label>{copy("Special wording or changes")} <textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder={copy("Colours, special wording, meal plans, dress code...")} /></label>
            <PaymentButton productKey={`invitation:family:${selected.id}`} requestUrl={whatsappUrl} invitation={{ image: `/invitations/family/${selected.id}.jfif`, title: selected.title, mood: details.mood, details, certificate: selected.id.includes("certificate") || selected.id.includes("weekly-star") }} />
            <p><Check size={15} />{copy("You approve the final proof before it is delivered.")} </p>
          </form>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
