import { useState } from "react";
import { ArrowRight, Check, ChevronLeft, Send, GraduationCap } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", school: "", date: "", time: "", venue: "", language: "French / Arabic", contact: "", note: "" });
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
    <Navbar><Link to="/request" className="outlineBtn">Order from AliExpress</Link><ProfileNavLink /></Navbar>
    <main className="weddingStudioPage graduationStudioPage">
      {!selected ? <>
        <section className="weddingStudioHero graduationStudioHero">
          <div>
            <span className="weddingStudioEyebrow"><GraduationCap size={15} /> Jibli graduations</span>
            <h1>Your next chapter.<br /><em>Worth celebrating.</em></h1>
            <p>Choose a graduation style, add your celebration details, and we will personalise your invitation ready to share.</p>
            <a href="#graduation-designs" className="weddingHeroButton">Choose your design <ArrowRight size={17} /></a>
          </div>
          <aside className="weddingHeroPromise">
            <span>01</span><strong>Choose a style</strong><p>Six designs to celebrate your graduation.</p>
            <span>02</span><strong>Make it yours</strong><p>Add your name, school and celebration details.</p>
            <span>03</span><strong>Invite your guests</strong><p>Approve your final invitation, then share it on WhatsApp.</p>
          </aside>
        </section>
        <section className="weddingDesignSection" id="graduation-designs">
          <div className="weddingSectionHeading">
            <div><span className="eyebrow">Graduation collection</span><h2>Choose your graduation style</h2><Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Choose another occasion</Link></div>
            <p>These are design examples. Your final invitation will use your own name and celebration details.</p>
          </div>
          <div className="weddingDesignGrid">
            {DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
              <img src={`/invitations/graduations/${design.id}.jfif`} alt={`${design.title} graduation invitation example`} loading="lazy" />
              <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p><b>10 TND · Personalise this design <ArrowRight size={15} /></b></div>
            </button>)}
          </div>
        </section>
      </> : <section className="weddingOrderPage">
        <div className="weddingOrderBackLinks"><Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Choose another occasion</Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} /> All graduation designs</button></div>
        <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>Personalise {selected.title}</h1><strong className="invitationPrice">10 TND</strong><p>Tell us about your graduation celebration. We will confirm the final design and delivery time before starting.</p></div>
        <div className="weddingOrderGrid">
          <div className="weddingSelectedDesign"><img src={`/invitations/graduations/${selected.id}.jfif`} alt={`${selected.title} graduation invitation`} /><div><strong>{selected.title}</strong><span>{selected.description}</span>{selected.needsPhoto ? <p>Send the graduate photo in the WhatsApp chat after submitting.</p> : null}</div></div>
          <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
            <div className="invitationFormRow">
              <label>Graduate name<input value={details.name} onChange={(event) => update("name", event.target.value)} placeholder="Graduate name" /></label>
              <label>School / degree<input value={details.school} onChange={(event) => update("school", event.target.value)} placeholder="School, university or degree" /></label>
            </div>
            <div className="invitationFormRow">
              <label>Celebration date<input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label>
              <label>Celebration time<input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label>
            </div>
            <label>Address and city<input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder="Street address, city" /></label>
            <div className="invitationFormRow">
              <label>Invitation language<select value={details.language} onChange={(event) => update("language", event.target.value)}><option>French / Arabic</option><option>Arabic</option><option>French</option><option>English</option></select></label>
              <label>RSVP / contact<input value={details.contact} onChange={(event) => update("contact", event.target.value)} placeholder="Phone, website or social handle" /></label>
            </div>
            <label>Special wording or changes<textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder="Graduation year, colours, special wording, event programme..." /></label>
            <a className="primaryBtn invitationWhatsappBtn" href={whatsappUrl} target="_blank" rel="noreferrer"><Send size={17} /> Send graduation request on WhatsApp</a>
            <p><Check size={15} /> You approve the final proof before it is delivered.</p>
          </form>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
