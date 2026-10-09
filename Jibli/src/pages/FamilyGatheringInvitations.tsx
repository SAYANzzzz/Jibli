import { useState } from "react";
import { ArrowRight, Check, ChevronLeft, Send, Users } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", hosts: "", date: "", time: "", venue: "", language: "French / Arabic", contact: "", note: "" });
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
    <Navbar><Link to="/request" className="outlineBtn">Order from AliExpress</Link><ProfileNavLink /></Navbar>
    <main className="weddingStudioPage familyStudioPage">
      {!selected ? <>
        <section className="weddingStudioHero familyStudioHero">
          <div>
            <span className="weddingStudioEyebrow"><Users size={15} /> Jibli family gatherings</span>
            <h1>Bring everyone together.<br /><em>Make it memorable.</em></h1>
            <p>Choose a family gathering style, add your celebration details, and we will personalise your invitation ready to share.</p>
            <a href="#family-designs" className="weddingHeroButton">Choose your design <ArrowRight size={17} /></a>
          </div>
          <aside className="weddingHeroPromise">
            <span>01</span><strong>Choose a style</strong><p>Four designs for reunions, gatherings and family meals.</p>
            <span>02</span><strong>Make it yours</strong><p>Add your family name, hosts and gathering details.</p>
            <span>03</span><strong>Invite your guests</strong><p>Approve your final invitation, then share it on WhatsApp.</p>
          </aside>
        </section>
        <section className="weddingDesignSection" id="family-designs">
          <div className="weddingSectionHeading">
            <div><span className="eyebrow">Family gathering collection</span><h2>Choose your family gathering style</h2><Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Choose another occasion</Link></div>
            <p>These are design examples. Your final invitation will use your own name and celebration details.</p>
          </div>
          <div className="weddingDesignGrid">
            {DESIGNS.map((design) => <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
              <img src={`/invitations/family/${design.id}.jfif`} alt={`${design.title} family gathering invitation example`} loading="lazy" />
              <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p><b>10 TND · Personalise this design <ArrowRight size={15} /></b></div>
            </button>)}
          </div>
        </section>
      </> : <section className="weddingOrderPage">
        <div className="weddingOrderBackLinks"><Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Choose another occasion</Link><button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} /> All family designs</button></div>
        <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>Personalise {selected.title}</h1><strong className="invitationPrice">10 TND</strong><p>Tell us about your family gathering. We will confirm the final design and delivery time before starting.</p></div>
        <div className="weddingOrderGrid">
          <div className="weddingSelectedDesign"><img src={`/invitations/family/${selected.id}.jfif`} alt={`${selected.title} family gathering invitation`} /><div><strong>{selected.title}</strong><span>{selected.description}</span></div></div>
          <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
            <div className="invitationFormRow">
              <label>Family name / gathering title<input value={details.name} onChange={(event) => update("name", event.target.value)} placeholder="Family name / gathering title" /></label>
              <label>Hosts<input value={details.hosts} onChange={(event) => update("hosts", event.target.value)} placeholder="Names of the hosts" /></label>
            </div>
            <div className="invitationFormRow">
              <label>Gathering date<input type="date" value={details.date} onChange={(event) => update("date", event.target.value)} /></label>
              <label>Gathering time<input type="time" value={details.time} onChange={(event) => update("time", event.target.value)} /></label>
            </div>
            <label>Address and city<input value={details.venue} onChange={(event) => update("venue", event.target.value)} placeholder="Street address, city" /></label>
            <div className="invitationFormRow">
              <label>Invitation language<select value={details.language} onChange={(event) => update("language", event.target.value)}><option>French / Arabic</option><option>Arabic</option><option>French</option><option>English</option></select></label>
              <label>RSVP / contact<input value={details.contact} onChange={(event) => update("contact", event.target.value)} placeholder="Phone, website or social handle" /></label>
            </div>
            <label>Special wording or changes<textarea value={details.note} onChange={(event) => update("note", event.target.value)} placeholder="Colours, special wording, meal plans, dress code..." /></label>
            <a className="primaryBtn invitationWhatsappBtn" href={whatsappUrl} target="_blank" rel="noreferrer"><Send size={17} /> Send family gathering request on WhatsApp</a>
            <p><Check size={15} /> You approve the final proof before it is delivered.</p>
          </form>
        </div>
      </section>}
    </main>
    <Footer />
  </div>;
}
