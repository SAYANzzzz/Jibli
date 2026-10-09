import { useState } from "react";
import { ArrowRight, Check, ChevronLeft, Send, Store } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", businessType: "", date: "", time: "", venue: "", language: "French / Arabic", contact: "", note: "" });
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
    <Navbar><Link to="/request" className="outlineBtn">Order from AliExpress</Link><ProfileNavLink /></Navbar>
    <main className="weddingStudioPage businessOpeningStudioPage">
      {!selected ? <>
        <section className="weddingStudioHero businessOpeningStudioHero">
          <div>
            <span className="weddingStudioEyebrow"><Store size={15} /> Jibli business openings</span>
            <h1>A new beginning.<br /><em>A grand invitation.</em></h1>
            <p>Choose a design for your café, salon, boutique or popup. We will personalise it with your brand and opening details, ready to share.</p>
            <a href="#opening-designs" className="weddingHeroButton">Choose your design <ArrowRight size={17} /></a>
          </div>
          <aside className="weddingHeroPromise">
            <span>01</span><strong>Choose a style</strong><p>Four designs for your business opening.</p>
            <span>02</span><strong>Make it yours</strong><p>Add your business name, address and opening details.</p>
            <span>03</span><strong>Invite your guests</strong><p>Approve your final invitation, then share it on WhatsApp.</p>
          </aside>
        </section>
        <section className="weddingDesignSection" id="opening-designs">
          <div className="weddingSectionHeading">
            <div><span className="eyebrow">Business opening collection</span><h2>Choose your opening style</h2><Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Choose another occasion</Link></div>
            <p>These are design examples. Your final invitation will use your own business details and branding.</p>
          </div>
          <div className="weddingDesignGrid">
            {DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
              <img src={`/invitations/openings/${design.id}.jfif`} alt={`${design.title} business opening invitation example`} loading="lazy" />
              <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p><b>10 TND · Personalise this design <ArrowRight size={15} /></b></div>
            </button>)}
          </div>
        </section>
      </> : <section className="weddingOrderPage">
        <div className="weddingOrderBackLinks"><Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Choose another occasion</Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} /> All opening designs</button></div>
        <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>Personalise {selected.title}</h1><strong className="invitationPrice">10 TND</strong><p>Tell us about your opening. We will confirm the final design and delivery time before starting.</p></div>
        <div className="weddingOrderGrid">
          <div className="weddingSelectedDesign"><img src={`/invitations/openings/${selected.id}.jfif`} alt={`${selected.title} business opening invitation`} /><div><strong>{selected.title}</strong><span>{selected.description}</span><p>Send your logo or business photos in the WhatsApp chat if you want them included.</p></div></div>
          <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
            <div className="invitationFormRow">
              <label>Business name<input value={details.name} onChange={(event) => update("name", event.target.value)} placeholder="Your business name" /></label>
              <label>Business type<input value={details.businessType} onChange={(event) => update("businessType", event.target.value)} placeholder="Café, salon, boutique..." /></label>
            </div>
            <div className="invitationFormRow">
              <label>Opening date<input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label>
              <label>Opening time<input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label>
            </div>
            <label>Address and city<input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder="Street address, city" /></label>
            <div className="invitationFormRow">
              <label>Invitation language<select value={details.language} onChange={(event) => update("language", event.target.value)}><option>French / Arabic</option><option>Arabic</option><option>French</option><option>English</option></select></label>
              <label>RSVP / contact<input value={details.contact} onChange={(event) => update("contact", event.target.value)} placeholder="Phone, website or social handle" /></label>
            </div>
            <label>Special wording or changes<textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder="Brand colours, opening offers, event programme, closing time..." /></label>
            <a className="primaryBtn invitationWhatsappBtn" href={whatsappUrl} target="_blank" rel="noreferrer"><Send size={17} /> Send opening request on WhatsApp</a>
            <p><Check size={15} /> You approve the final proof before it is delivered.</p>
          </form>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
