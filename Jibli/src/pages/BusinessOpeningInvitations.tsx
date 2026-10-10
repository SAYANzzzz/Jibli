import { useCommerceCopy } from "../i18n/commerceCopy";
import { usePersistentState } from "../usePersistentState";
import AnimatedInvitation from "../components/AnimatedInvitation";
import PaymentButton from "../components/PaymentButton";

import { ArrowRight, Check, ChevronLeft, Store } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";

const DESIGNS = [
  { id: "bold-coffee", title: "Bold coffee", style: "Bold / Café", description: "Bright red typography and a coffee centrepiece for a memorable launch." },
  { id: "red-ribbon", title: "Ribbon reveal", style: "Elegant / Salon", description: "Red satin ribbons and a storefront reveal for your grand opening." },
  { id: "burgundy-bow", title: "Burgundy bow", style: "Classic / Boutique", description: "Cream paper, flowing lettering and a rich burgundy bow." },
  { id: "popup-party", title: "Popup opening", style: "Editorial / Popup", description: "A storefront photograph and elegant white lettering for an opening celebration." },
];

export default function BusinessOpeningInvitations() {
  const copy = useCommerceCopy();
  const [selectedId, setSelectedId] = usePersistentState<string | null>("jibli-design-openings", null);
  const [details, setDetails] = usePersistentState("jibli-details-openings", { mood: "", name: "", businessType: "", date: "", time: "", venue: "", language: "French / Arabic", contact: "", note: "" });
  const selected = DESIGNS.find((design) => design.id === selectedId);
  const update = (field: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [field]: value }));
  const whatsappUrl = selected ? `https://wa.me/21692001397?text=${encodeURIComponent([
    "Hi Jibli! I want a personalised business opening invitation.",
    `Design: ${selected.title} (${selected.style})`, "Price: 10 TND",
    `Business name: ${details.name || "Not decided"}`,
    `Business type: ${details.businessType || "Not decided"}`,
    `Date: ${details.date || "Not decided"}`,
    `Time: ${details.time || "Not decided"}`,
    `Address: ${details.venue || "Not decided"}`,
    `Language: ${details.language}`,
    `RSVP / contact: ${details.contact || "Not decided"}`,
    "Brand assets: I will send any logo or business photos in this chat.",
    details.note ? `Extra request: ${details.note}` : "",
  ].filter(Boolean).join("\n"))}` : "";

  return <div>
    <Navbar><Link to="/request" className="outlineBtn">{copy("Order from AliExpress")} </Link><ProfileNavLink /></Navbar>
    <main className="weddingStudioPage businessOpeningStudioPage">
      {!selected ? <>
        <section className="weddingStudioHero businessOpeningStudioHero">
          <div>
            <span className="weddingStudioEyebrow"><Store size={15} />{copy("Jibli business openings")} </span>
            <h1>{copy("A new beginning.")} <br /><em>{copy("A grand invitation.")} </em></h1>
            <p>{copy("Choose a design for your café, salon, boutique or popup. We will personalise it with your brand and opening details, ready to share.")} </p>
            <a href="#opening-designs" className="weddingHeroButton">{copy("Choose your design")} <ArrowRight size={17} /></a>
          </div>
          <aside className="weddingHeroPromise">
            <span>01</span><strong>{copy("Choose a style")} </strong><p>{copy("Four designs for your business opening.")} </p>
            <span>02</span><strong>{copy("Make it yours")} </strong><p>{copy("Add your business name, address and opening details.")} </p>
            <span>03</span><strong>{copy("Invite your guests")} </strong><p>{copy("Approve your final invitation, then share it on WhatsApp.")} </p>
          </aside>
        </section>
        <section className="weddingDesignSection" id="opening-designs">
          <div className="weddingSectionHeading">
            <div><span className="eyebrow">{copy("Business opening collection")} </span><h2>{copy("Choose your opening style")} </h2><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link></div>
            <p>{copy("These are design examples. Your final invitation will use your own business details and branding.")} </p>
          </div>
          <div className="weddingDesignGrid">
            {DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
              <img src={`/invitations/openings/${design.id}.jfif`} alt={`${design.title} business opening invitation example`} loading="lazy" decoding="async" />
              <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p><span className="invitationCardPrice">{copy("10 TND")} </span><b>{copy("Choose design")} <ArrowRight size={15} /></b></div>
            </button>)}
          </div>
        </section>
      </> : <section className="weddingOrderPage">
        <div className="weddingOrderBackLinks"><Link to="/invitations#templates" className="weddingAllTypesLink"><ChevronLeft size={16} />{copy("Choose another occasion")} </Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} />{copy("All opening designs")} </button></div>
        <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>{copy("Personalise")} {selected.title}</h1><strong className="invitationPrice">{copy("10 TND")} </strong><p>{copy("Tell us about your opening. We will confirm the final design and delivery time before starting.")} </p></div>
        <div className="weddingOrderGrid">
          <div className="weddingSelectedDesign"><AnimatedInvitation key={selected.id} image={`/invitations/openings/${selected.id}.jfif`} title={selected.title} details={details} onMoodChange={(mood) => setDetails((current) => ({ ...current, mood }))} /><div><strong>{selected.title}</strong><span>{selected.description}</span><p>{copy("Send your logo or business photos in the WhatsApp chat if you want them included.")} </p></div></div>
          <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
            <div className="invitationFormRow">
              <label>{copy("Business name")} <input required maxLength={160} value={details.name} onChange={(event) => update("name", event.target.value)} placeholder={copy("Your business name")} /></label>
              <label>{copy("Business type")} <input value={details.businessType} onChange={(event) => update("businessType", event.target.value)} placeholder={copy("Café, salon, boutique...")} /></label>
            </div>
            <div className="invitationFormRow">
              <label>{copy("Opening date")} <input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label>
              <label>{copy("Opening time")} <input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label>
            </div>
            <label>{copy("Address and city")} <input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder={copy("Street address, city")} /></label>
            <div className="invitationFormRow">
              <label>{copy("Invitation language")} <select value={details.language} onChange={(event) => update("language", event.target.value)}><option value="French / Arabic">{copy("French / Arabic")}</option><option value="Arabic">{copy("Arabic")}</option><option value="French">{copy("French")}</option><option value="English">{copy("English")}</option></select></label>
              <label>{copy("RSVP / contact")} <input value={details.contact} onChange={(event) => update("contact", event.target.value)} placeholder={copy("Phone, website or social handle")} /></label>
            </div>
            <label>{copy("Special wording or changes")} <textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder={copy("Brand colours, opening offers, event programme, closing time...")} /></label>
            <PaymentButton productKey={`invitation:openings:${selected.id}`} requestUrl={whatsappUrl} invitation={{ image: `/invitations/openings/${selected.id}.jfif`, title: selected.title, mood: details.mood, details, certificate: selected.id.includes("certificate") || selected.id.includes("weekly-star") }} />
            <p><Check size={15} />{copy("You approve the final proof before it is delivered.")} </p>
          </form>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
