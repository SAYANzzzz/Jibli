import { useMemo, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ImagePlus, MapPin, Send, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

type WeddingDesign = {
  id: string;
  title: string;
  style: string;
  image: string;
  description: string;
  needsPhotos?: boolean;
};

const WEDDING_DESIGNS: WeddingDesign[] = [
  { id: "arabesque-burgundy", title: "Arabesque burgundy", style: "Arabic · Luxury floral", image: "/invitations/weddings/arabesque-burgundy.jfif", description: "Grand arches, burgundy blooms and warm gold details." },
  { id: "arabic-satin", title: "Satin ribbons", style: "Arabic · Modern", image: "/invitations/weddings/arabic-satin.jfif", description: "Soft fabric-like florals and elegant Arabic calligraphy." },
  { id: "blush-embossed", title: "Blush embossed", style: "Arabic · Floral", image: "/invitations/weddings/blush-embossed.jfif", description: "Embossed ivory texture with gentle blush florals." },
  { id: "garden-couple", title: "Garden couple", style: "Arabic · Illustrated", image: "/invitations/weddings/garden-couple.jfif", description: "Rose garden framing with a bride-and-groom illustration." },
  { id: "classic-ivory", title: "Classic ivory", style: "English / French · Timeless", image: "/invitations/weddings/classic-ivory.jfif", description: "A refined cream card with delicate botanical borders." },
  { id: "photo-frame", title: "Childhood story", style: "Photo · Playful", image: "/invitations/weddings/photo-frame.jfif", description: "A charming save-the-date that uses childhood photos.", needsPhotos: true },
  { id: "illustrated-photo", title: "Illustrated love", style: "Photo · Playful", image: "/invitations/weddings/illustrated-photo.jfif", description: "Your photos in a sweet, illustrated wedding scene.", needsPhotos: true },
  { id: "teal-love", title: "Teal celebration", style: "English · Hand-drawn", image: "/invitations/weddings/teal-love.jfif", description: "Hand-drawn champagne, rings and a joyful teal script." },
];

function weddingWhatsappUrl(design: WeddingDesign, details: Record<string, string>) {
  const lines = [
    "Hi Jibli! I want a personalised wedding invitation.",
    "",
    `Design: ${design.title} (${design.style})`,
    `Couple: ${details.couple || "Not decided"}`,
    `Date: ${details.date || "Not decided"}`,
    `Time: ${details.time || "Not decided"}`,
    `Venue: ${details.venue || "Not decided"}`,
    `Language: ${details.language}`,
    `RSVP / contact: ${details.rsvp || "Not decided"}`,
    design.needsPhotos ? "Photos: I will send the couple's photos on WhatsApp." : "",
    details.note ? `Extra request: ${details.note}` : "",
  ].filter(Boolean);

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function WeddingInvitations() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState({ couple: "", date: "", time: "", venue: "", language: "Arabic / French", rsvp: "", note: "" });
  const selected = useMemo(() => WEDDING_DESIGNS.find((design) => design.id === selectedId) ?? null, [selectedId]);
  const updateDetail = (field: keyof typeof details, value: string) => setDetails((current) => ({ ...current, [field]: value }));

  return (
    <div>
      <Navbar>
        <Link to="/request" className="outlineBtn">Order from AliExpress</Link>
        <ProfileNavLink />
      </Navbar>
      <main className="weddingStudioPage">
        {!selected ? (
          <>
            <section className="weddingStudioHero">
              <div>
                <span className="weddingStudioEyebrow"><Sparkles size={15} /> Jibli wedding invitations</span>
                <h1>Your love story,<br /><em>beautifully announced.</em></h1>
                <p>Choose the card that feels like you. We personalise the names, date, venue and wording, then deliver it ready to share.</p>
                <a href="#wedding-designs" className="weddingHeroButton">Choose your design <ArrowRight size={17} /></a>
              </div>
              <aside className="weddingHeroPromise">
                <span>01</span><strong>Pick a design</strong><p>Eight curated directions to start from.</p>
                <span>02</span><strong>Tell us the details</strong><p>Arabic, French, English—or a mix of all three.</p>
                <span>03</span><strong>Share the moment</strong><p>Your final invitation arrives on WhatsApp.</p>
              </aside>
            </section>
            <section className="weddingDesignSection" id="wedding-designs">
              <div className="weddingSectionHeading"><div><span className="eyebrow">Wedding collection</span><h2>Choose your starting style</h2><Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Change occasion: wedding, birthday, party...</Link></div><p>Every design is personalised by Jibli. Select one to begin your request.</p></div>
              <div className="weddingDesignGrid">
                {WEDDING_DESIGNS.map((design) => (
                  <button type="button" className="weddingDesignCard" key={design.id} onClick={() => setSelectedId(design.id)}>
                    <img src={design.image} alt={`${design.title} wedding invitation example`} />
                    <div className="weddingDesignOverlay"><span>{design.style}</span><strong>{design.title}</strong><p>{design.description}</p>{design.needsPhotos && <small><ImagePlus size={14} /> Couple photos needed</small>}<b>Personalise this design <ArrowRight size={15} /></b></div>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="weddingOrderPage">
            <div className="weddingOrderBackLinks">
              <Link to="/invitations#occasion-types" className="weddingAllTypesLink"><ChevronLeft size={16} /> Change occasion: wedding, birthday, party...</Link>
              <button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} /> All wedding designs</button>
            </div>
            <div className="weddingOrderHeading"><span className="eyebrow">{selected.style}</span><h1>Personalise {selected.title}</h1><p>Your selected design is below. Send the essentials and we will confirm the final wording, price and delivery time before we start.</p></div>
            <div className="weddingOrderGrid">
              <div className="weddingSelectedDesign"><img src={selected.image} alt={`${selected.title} wedding invitation`} /><div><strong>{selected.title}</strong><span>{selected.description}</span>{selected.needsPhotos && <p><ImagePlus size={15} /> Send your photos in the WhatsApp chat after submitting.</p>}</div></div>
              <form className="invitationForm weddingOrderForm" onSubmit={(event) => event.preventDefault()}>
                <label>Couple's names<input value={details.couple} onChange={(event) => updateDetail("couple", event.target.value)} placeholder="Example: Ahmed & Sara" /></label>
                <div className="invitationFormRow"><label>Date<input type="date" value={details.date} onChange={(event) => updateDetail("date", event.target.value)} /></label><label>Time<input type="time" value={details.time} onChange={(event) => updateDetail("time", event.target.value)} /></label></div>
                <label><MapPin size={15} /> Venue and city<input value={details.venue} onChange={(event) => updateDetail("venue", event.target.value)} placeholder="Example: Salle des fêtes, Tunis" /></label>
                <div className="invitationFormRow"><label>Invitation language<select value={details.language} onChange={(event) => updateDetail("language", event.target.value)}><option>Arabic / French</option><option>Arabic</option><option>French</option><option>English</option><option>Arabic / English</option></select></label><label>RSVP / contact<input value={details.rsvp} onChange={(event) => updateDetail("rsvp", event.target.value)} placeholder="Phone number or name" /></label></div>
                <label>Special wording or changes<textarea value={details.note} onChange={(event) => updateDetail("note", event.target.value)} placeholder="Quran verse, family names, dress code, colour changes..." /></label>
                <a className="primaryBtn invitationWhatsappBtn" href={weddingWhatsappUrl(selected, details)} target="_blank" rel="noreferrer"><Send size={17} /> Send wedding request on WhatsApp</a>
                <p><Check size={15} /> You approve the final proof before it is delivered.</p>
              </form>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default WeddingInvitations;
