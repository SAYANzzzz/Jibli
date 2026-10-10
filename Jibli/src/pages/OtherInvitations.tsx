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
  {
    "id": "kindergarten-welcome",
    "title": "Kindergarten welcome",
    "style": "School / Registration",
    "description": "Personalise this school and registration design with your own names and wording."
  },
  {
    "id": "school-registration",
    "title": "School registration",
    "style": "School / Illustrated",
    "description": "Personalise this school and illustrated design with your own names and wording."
  },
  {
    "id": "eid-school-welcome",
    "title": "Welcome after Eid",
    "style": "School / Eid",
    "description": "Personalise this school and eid design with your own names and wording."
  },
  {
    "id": "weekly-star-blue",
    "title": "Weekly star blue",
    "style": "Certificate / Achievement",
    "description": "Personalise this certificate and achievement design with your own names and wording."
  },
  {
    "id": "weekly-star-pink",
    "title": "Weekly star pink",
    "style": "Certificate / Achievement",
    "description": "Personalise this certificate and achievement design with your own names and wording."
  },
  {
    "id": "quran-certificate-blue",
    "title": "Quran achievement blue",
    "style": "Certificate / Quran",
    "description": "Personalise this certificate and quran design with your own names and wording."
  },
  {
    "id": "quran-certificate-pink",
    "title": "Quran achievement pink",
    "style": "Certificate / Quran",
    "description": "Personalise this certificate and quran design with your own names and wording."
  }
];

export default function OtherInvitations() {
  const copy = useCommerceCopy();
  const [selectedId, setSelectedId] = usePersistentState<string | null>("jibli-design-others", null);
  const [details, setDetails] = usePersistentState("jibli-details-others", { mood: "", name: "", hosts: "", date: "", time: "", venue: "", language: "French / Arabic", contact: "", note: "" });
  const selected = DESIGNS.find((design) => design.id === selectedId);
  const update = (field: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [field]: value }));
  const whatsappUrl = selected ? `https://wa.me/21692001397?text=${encodeURIComponent([
    "Hi Jibli! I want a personalised card or announcement.",
    `Design: ${selected.title} (${selected.style})`, "Price: 10 TND",
    `Recipient name / card title: ${details.name || "Not decided"}`,
    `School / organisation: ${details.hosts || "Not decided"}`,
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
            <span className="weddingStudioEyebrow"><Users size={15} />{copy("Jibli others collection")} </span>
            <h1>{copy("Celebrate every achievement.")} <br /><em>{copy("Make it personal.")} </em></h1>
            <p>{copy("Choose a school announcement or certificate and personalise it with your own details.")} </p>
            <a href="#other-designs" className="weddingHeroButton">{copy("Choose your design")} <ArrowRight size={17} /></a>
          </div>
          <aside className="weddingHeroPromise">
            <span>01</span><strong>{copy("Choose a style")} </strong><p>{copy("Seven designs for school announcements and achievement certificates.")} </p>
            <span>02</span><strong>{copy("Make it yours")} </strong><p>{copy("Add names, school details and your custom wording.")} </p>
            <span>03</span><strong>{copy("Share your card")} </strong><p>{copy("Approve your final invitation, then share it on WhatsApp.")} </p>
          </aside>
        </section>
        <section className="weddingDesignSection" id="other-designs">
          <div className="weddingSectionHeading">
            <div><span className="eyebrow">{copy("Others collection")} </span><h2>{copy("Choose your card or announcement")} </h2><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link></div>
            <p>{copy("These are design examples. Your final invitation will use your own name and celebration details.")} </p>
          </div>
          <div className="weddingDesignGrid">
            {DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
              <img src={`/invitations/others/${design.id}.jfif`} alt={`${design.title} card or announcement example`} loading="lazy" decoding="async" />
              <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p><span className="invitationCardPrice">{copy("10 TND")} </span><b>{copy("Choose design")} <ArrowRight size={15} /></b></div>
            </button>)}
          </div>
        </section>
      </> : <section className="weddingOrderPage">
        <div className="weddingOrderBackLinks"><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} />{copy("All other designs")} </button></div>
        <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>{copy("Personalise")} {selected.title}</h1><strong className="invitationPrice">{copy("10 TND")} </strong><p>{copy("Tell us about your card or announcement. We will confirm the final design and delivery time before starting.")} </p></div>
        <div className="weddingOrderGrid">
          <div className="weddingSelectedDesign"><AnimatedInvitation key={selected.id} image={`/invitations/others/${selected.id}.jfif`} title={selected.title} details={details} certificate={(selected.id.includes("certificate") || selected.id.includes("weekly-star"))} onMoodChange={(mood) => setDetails((current) => ({ ...current, mood }))} /><div><strong>{selected.title}</strong><span>{selected.description}</span></div></div>
          <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
            <div className="invitationFormRow">
              <label>{copy("Recipient name / card title")} <input required maxLength={160} value={details.name} onChange={(event) => update("name", event.target.value)} placeholder={copy("Recipient name / card title")} /></label>
              <label>{copy("School / organisation")} <input value={details.hosts} onChange={(event) => update("hosts", event.target.value)} placeholder={copy("School or teacher name")} /></label>
            </div>
            <div className="invitationFormRow">
              <label>{copy("Date (optional)")} <input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label>
              {!(selected.id.includes("certificate") || selected.id.includes("weekly-star")) && <label>{copy("Time (optional)")} <input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label>}
            </div>
            {!(selected.id.includes("certificate") || selected.id.includes("weekly-star")) && <label>{copy("Address and city (optional)")} <input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder={copy("Street address, city")} /></label>}
            <div className="invitationFormRow">
              <label>{copy("Invitation language")} <select value={details.language} onChange={(event) => update("language", event.target.value)}><option value="French / Arabic">{copy("French / Arabic")}</option><option value="Arabic">{copy("Arabic")}</option><option value="French">{copy("French")}</option><option value="English">{copy("English")}</option></select></label>
              <label>{copy("RSVP / contact")} <input value={details.contact} onChange={(event) => update("contact", event.target.value)} placeholder={copy("Phone, website or social handle")} /></label>
            </div>
            <label>{copy("Special wording or changes")} <textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder={copy("Certificate wording, achievements, registration details, colours...")} /></label>
            <PaymentButton productKey={`invitation:others:${selected.id}`} requestUrl={whatsappUrl} invitation={{ image: `/invitations/others/${selected.id}.jfif`, title: selected.title, mood: details.mood, details, certificate: selected.id.includes("certificate") || selected.id.includes("weekly-star") }} />
            <p><Check size={15} />{copy("You approve the final proof before it is delivered.")} </p>
          </form>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
