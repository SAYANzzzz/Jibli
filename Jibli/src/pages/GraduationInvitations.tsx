import { useCommerceCopy } from "../i18n/commerceCopy";
import { usePersistentState } from "../usePersistentState";
import AnimatedInvitation from "../components/AnimatedInvitation";
import PaymentButton from "../components/PaymentButton";

import { ArrowRight, Check, ChevronLeft, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";

const DESIGNS = [
  { id: "midnight-silver", title: "Midnight silver", style: "Navy / Elegant", description: "Deep navy textures and a silver graduation cap.", needsPhoto: false },
  { id: "red-tassel", title: "Red tassel", style: "Bold / Modern", description: "A red graduation cap, black tassel and crisp typography.", needsPhoto: false },
  { id: "velvet-bow", title: "Velvet bow", style: "Burgundy / Refined", description: "A velvet cap and bow on textured ivory paper.", needsPhoto: false },
  { id: "blue-florals", title: "Blue florals", style: "Floral / Delicate", description: "Soft blue flowers frame an elegant graduation invitation.", needsPhoto: false },
  { id: "disco-graduate", title: "Disco graduate", style: "Photo / Playful", description: "A personal photo collage with disco balls and pink stars.", needsPhoto: true },
  { id: "classic-mortarboard", title: "Classic mortarboard", style: "Classic / Watercolour", description: "A painted cap, gold tassel and a timeless cream frame.", needsPhoto: false },
];

export default function GraduationInvitations() {
  const copy = useCommerceCopy();
  const [selectedId, setSelectedId] = usePersistentState<string | null>("jibli-design-graduations", null);
  const [details, setDetails] = usePersistentState("jibli-details-graduations", { mood: "", name: "", school: "", date: "", time: "", venue: "", language: "French / Arabic", contact: "", note: "" });
  const selected = DESIGNS.find((design) => design.id === selectedId);
  const update = (field: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [field]: value }));
  const whatsappUrl = selected ? `https://wa.me/21692001397?text=${encodeURIComponent([
    "Hi Jibli! I want a personalised graduation invitation.",
    `Design: ${selected.title} (${selected.style})`, "Price: 10 TND",
    `Graduate name: ${details.name || "Not decided"}`,
    `School / degree: ${details.school || "Not decided"}`,
    `Date: ${details.date || "Not decided"}`,
    `Time: ${details.time || "Not decided"}`,
    `Address: ${details.venue || "Not decided"}`,
    `Language: ${details.language}`,
    `RSVP / contact: ${details.contact || "Not decided"}`,
    selected.needsPhoto ? "Photo: I will send the graduate photo in this chat." : "",
    details.note ? `Extra request: ${details.note}` : "",
  ].filter(Boolean).join("\n"))}` : "";

  return <div>
    <Navbar><Link to="/request" className="outlineBtn">{copy("Order from AliExpress")} </Link><ProfileNavLink /></Navbar>
    <main className="weddingStudioPage graduationStudioPage">
      {!selected ? <>
        <section className="weddingStudioHero graduationStudioHero">
          <div>
            <span className="weddingStudioEyebrow"><GraduationCap size={15} />{copy("Jibli graduations")} </span>
            <h1>{copy("Your next chapter.")} <br /><em>{copy("Worth celebrating.")} </em></h1>
            <p>{copy("Choose a graduation style, add your celebration details, and we will personalise your invitation ready to share.")} </p>
            <a href="#graduation-designs" className="weddingHeroButton">{copy("Choose your design")} <ArrowRight size={17} /></a>
          </div>
          <aside className="weddingHeroPromise">
            <span>01</span><strong>{copy("Choose a style")} </strong><p>{copy("Six designs to celebrate your graduation.")} </p>
            <span>02</span><strong>{copy("Make it yours")} </strong><p>{copy("Add your name, school and celebration details.")} </p>
            <span>03</span><strong>{copy("Invite your guests")} </strong><p>{copy("Approve your final invitation, then share it on WhatsApp.")} </p>
          </aside>
        </section>
        <section className="weddingDesignSection" id="graduation-designs">
          <div className="weddingSectionHeading">
            <div><span className="eyebrow">{copy("Graduation collection")} </span><h2>{copy("Choose your graduation style")} </h2><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link></div>
            <p>{copy("These are design examples. Your final invitation will use your own name and celebration details.")} </p>
          </div>
          <div className="weddingDesignGrid">
            {DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
              <img src={`/invitations/graduations/${design.id}.jfif`} alt={`${design.title} graduation invitation example`} loading="lazy" decoding="async" />
              <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p><span className="invitationCardPrice">{copy("10 TND")} </span><b>{copy("Choose design")} <ArrowRight size={15} /></b></div>
            </button>)}
          </div>
        </section>
      </> : <section className="weddingOrderPage">
        <div className="weddingOrderBackLinks"><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} />{copy("All graduation designs")} </button></div>
        <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>{copy("Personalise")} {selected.title}</h1><strong className="invitationPrice">{copy("10 TND")} </strong><p>{copy("Tell us about your graduation celebration. We will confirm the final design and delivery time before starting.")} </p></div>
        <div className="weddingOrderGrid">
          <div className="weddingSelectedDesign"><AnimatedInvitation key={selected.id} image={`/invitations/graduations/${selected.id}.jfif`} title={selected.title} details={details} onMoodChange={(mood) => setDetails((current) => ({ ...current, mood }))} /><div><strong>{selected.title}</strong><span>{selected.description}</span>{selected.needsPhoto ? <p>{copy("Send the graduate photo in the WhatsApp chat after submitting.")} </p> : null}</div></div>
          <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
            <div className="invitationFormRow">
              <label>{copy("Graduate name")} <input required maxLength={160} value={details.name} onChange={(event) => update("name", event.target.value)} placeholder={copy("Graduate name")} /></label>
              <label>{copy("School / degree")} <input value={details.school} onChange={(event) => update("school", event.target.value)} placeholder={copy("School, university or degree")} /></label>
            </div>
            <div className="invitationFormRow">
              <label>{copy("Celebration date")} <input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label>
              <label>{copy("Celebration time")} <input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label>
            </div>
            <label>{copy("Address and city")} <input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder={copy("Street address, city")} /></label>
            <div className="invitationFormRow">
              <label>{copy("Invitation language")} <select value={details.language} onChange={(event) => update("language", event.target.value)}><option value="French / Arabic">{copy("French / Arabic")}</option><option value="Arabic">{copy("Arabic")}</option><option value="French">{copy("French")}</option><option value="English">{copy("English")}</option></select></label>
              <label>{copy("RSVP / contact")} <input value={details.contact} onChange={(event) => update("contact", event.target.value)} placeholder={copy("Phone, website or social handle")} /></label>
            </div>
            <label>{copy("Special wording or changes")} <textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder={copy("Graduation year, colours, special wording, event programme...")} /></label>
            <PaymentButton productKey={`invitation:graduations:${selected.id}`} requestUrl={whatsappUrl} invitation={{ image: `/invitations/graduations/${selected.id}.jfif`, title: selected.title, mood: details.mood, details, certificate: selected.id.includes("certificate") || selected.id.includes("weekly-star") }} />
            <p><Check size={15} />{copy("You approve the final proof before it is delivered.")} </p>
          </form>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
