import { useMemo, useState } from "react";
import { Check, ChevronLeft, Heart, MapPin, Palette, PartyPopper, Send, Sparkles, Store, Users, WandSparkles } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProfileNavLink from "../components/ProfileNavLink";

const ADMIN_WHATSAPP_NUMBER = "21692001397";

type InvitationTemplate = {
  id: string;
  title: string;
  event: string;
  description: string;
  accent: string;
  group: "Romance" | "Celebration" | "Business" | "Milestone";
  icon: typeof Heart;
};

const TEMPLATES: InvitationTemplate[] = [
  { id: "wedding-bloom", title: "Blooming vows", event: "Wedding", description: "Soft florals and timeless elegance.", accent: "rose", group: "Romance", icon: Heart },
  { id: "henna-night", title: "Henna night", event: "Engagement & henna", description: "Warm, celebratory and full of colour.", accent: "gold", group: "Romance", icon: Sparkles },
  { id: "birthday-confetti", title: "Confetti", event: "Birthday", description: "A joyful invitation for every age.", accent: "violet", group: "Celebration", icon: PartyPopper },
  { id: "grand-opening", title: "Grand opening", event: "Business opening", description: "Announce your next big beginning.", accent: "ink", group: "Business", icon: Store },
  { id: "after-hours", title: "After hours", event: "Party", description: "A bold invitation for an unforgettable night.", accent: "coral", group: "Celebration", icon: PartyPopper },
  { id: "graduation-day", title: "The next chapter", event: "Graduation", description: "Celebrate a milestone worth sharing.", accent: "navy", group: "Milestone", icon: Sparkles },
  { id: "family-table", title: "Family table", event: "Family gathering", description: "A warm welcome for the people who matter.", accent: "olive", group: "Milestone", icon: Users },
];

const CATEGORIES = ["All", "Romance", "Celebration", "Business", "Milestone"] as const;

function invitationWhatsappUrl(template: InvitationTemplate, details: Record<string, string>) {
  const lines = [
    "Hi Jibli! I'd like a digital invitation.",
    "",
    `Template: ${template.title} (${template.event})`,
    `Hosts / name: ${details.hosts || "Not decided"}`,
    `Date: ${details.date || "Not decided"}`,
    `Time: ${details.time || "Not decided"}`,
    `Location: ${details.location || "Not decided"}`,
    `Language: ${details.language}`,
    details.note ? `Extra note: ${details.note}` : "",
  ].filter(Boolean);

  return `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function Invitations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const requestedCategory = searchParams.get("category");
  const initialCategory = CATEGORIES.includes(requestedCategory as (typeof CATEGORIES)[number]) ? requestedCategory as (typeof CATEGORIES)[number] : "All";
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>(initialCategory);
  const [details, setDetails] = useState({
    hosts: "",
    date: "",
    time: "",
    location: "",
    language: "French / Arabic",
    note: "",
  });
  const selected = useMemo(() => TEMPLATES.find((template) => template.id === selectedId) ?? null, [selectedId]);
  const visibleTemplates = useMemo(
    () => activeCategory === "All" ? TEMPLATES : TEMPLATES.filter((template) => template.group === activeCategory),
    [activeCategory],
  );

  const changeDetail = (field: keyof typeof details, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  return (
    <div>
      <Navbar>
        <Link to="/request" className="outlineBtn">Order from AliExpress</Link>
        <ProfileNavLink />
      </Navbar>

      <main className="invitationsPage">
        {!selected ? (
          <>
            <section className="invitationHero invitationHeroEditorial">
              <div className="invitationHeroContent">
                <span className="invitationEyebrow"><Sparkles size={15} /> Jibli celebrations</span>
                <h1>Online invitations<br />and cards for all<br /><em>moments that matter.</em></h1>
                <p>Personalised invitations, made to be shared beautifully on WhatsApp.</p>
                <div className="invitationHeroActions">
                  <a className="invitationBrowseBtn" href="#templates"><Palette size={17} /> Browse invitations</a>
                  <span><WandSparkles size={15} /> Made around your story</span>
                </div>
              </div>
            </section>

            <section className="invitationSteps" aria-label="How it works">
              <article className="invitationStep stepChoose"><span>01</span><div><strong>Choose a style</strong><p>Pick a template made for your occasion.</p></div><small>Start here <span>→</span></small></article>
              <article className="invitationStep stepDetails"><span>02</span><div><strong>Add the details</strong><p>Names, date, place and your special message.</p></div><small>Make it yours <span>→</span></small></article>
              <article className="invitationStep stepShare"><span>03</span><div><strong>Share the joy</strong><p>Receive a polished invitation ready for WhatsApp.</p></div><small>Send the love <span>→</span></small></article>
            </section>

            <section className="occasionChooser" id="occasion-types" aria-label="Choose an occasion">
              <div className="occasionChooserHeading"><span className="eyebrow">Start here</span><h2>What are you celebrating?</h2><p>Choose an occasion to see the right invitation styles.</p></div>
              <div className="occasionChooserGrid">
                <Link to="/invitations/weddings" className="occasionChoice wedding"><Heart size={22} /><strong>Wedding</strong><span>View wedding designs</span></Link>
                <Link to="/invitations/engagements" className="occasionChoice engagement"><Heart size={22} /><strong>Engagement</strong><span>Choose an engagement style</span></Link>
                <Link to="/invitations/birthdays" className="occasionChoice birthday"><PartyPopper size={22} /><strong>Birthday</strong><span>Choose a birthday style</span></Link>
                <Link to="/invitations?category=Celebration#templates" className="occasionChoice party"><Sparkles size={22} /><strong>Party</strong><span>Make it unforgettable</span></Link>
                <Link to="/invitations/openings" className="occasionChoice opening"><Store size={22} /><strong>Business opening</strong><span>Announce your launch</span></Link>
              </div>
            </section>

            <section className="invitationCatalog" id="templates">
              <div className="invitationSectionHeading">
                <div><span className="eyebrow">Start with a style</span><h2>Designed for your moment</h2></div>
                <p>Choose a starting point. We will personalise every detail for you.</p>
              </div>
              <div className="invitationCategoryBar" role="tablist" aria-label="Invitation categories">
                {CATEGORIES.map((category) => (
                  <button key={category} type="button" role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>
                ))}
              </div>
              <div className="invitationTemplateGrid">
                {visibleTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button key={template.id} type="button" className={`invitationTemplate ${template.accent}`} onClick={() => template.id === "wedding-bloom" ? navigate("/invitations/weddings") : template.id === "henna-night" ? navigate("/invitations/engagements") : template.id === "birthday-confetti" ? navigate("/invitations/birthdays") : template.id === "grand-opening" ? navigate("/invitations/openings") : setSelectedId(template.id)}>
                      <div className="invitationTemplateIcon"><Icon size={25} /></div>
                      <div className="invitationTemplateGlow" />
                      <span>{template.event}</span>
                      <strong>{template.title}</strong>
                      <p>{template.description}</p>
                      <small>Create this invitation <span>→</span></small>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <section className="invitationBuilder">
            <button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} /> All designs</button>
            <div className="invitationBuilderHeading">
              <span className="eyebrow">{selected.event}</span>
              <h1>Make it yours</h1>
              <p>Tell us the essentials. We will turn this into a share-ready invitation.</p>
            </div>
            <div className="invitationBuilderGrid">
              <div className="invitationPreviewWrap">
                <p className="invitationPreviewLabel">Live preview</p>
                <article className={`invitationPreview ${selected.accent}`}>
                  <selected.icon size={28} />
                  <span>{selected.event}</span>
                  <h2>{details.hosts || "Your special event"}</h2>
                  <p>{details.date || "Choose your date"}{details.time ? ` · ${details.time}` : ""}</p>
                  <div />
                  <small>{details.location || "Your location"}</small>
                </article>
                <p className="mutedText">This is a preview concept. Your final invitation is personalised by Jibli.</p>
              </div>
              <form className="invitationForm" onSubmit={(event) => event.preventDefault()}>
                <label>Hosts, celebrant or business name<input value={details.hosts} onChange={(event) => changeDetail("hosts", event.target.value)} placeholder="Example: Amira & Youssef" /></label>
                <div className="invitationFormRow">
                  <label>Date<input type="date" value={details.date} onChange={(event) => changeDetail("date", event.target.value)} /></label>
                  <label>Time<input type="time" value={details.time} onChange={(event) => changeDetail("time", event.target.value)} /></label>
                </div>
                <label><MapPin size={15} /> Location / venue<input value={details.location} onChange={(event) => changeDetail("location", event.target.value)} placeholder="Example: Deguach, Tunisia" /></label>
                <label>Invitation language<select value={details.language} onChange={(event) => changeDetail("language", event.target.value)}><option>French / Arabic</option><option>Arabic</option><option>French</option><option>English</option></select></label>
                <label>Anything else you want us to know?<textarea value={details.note} onChange={(event) => changeDetail("note", event.target.value)} placeholder="Colours, dress code, RSVP details, special wording..." /></label>
                <a className="primaryBtn invitationWhatsappBtn" href={invitationWhatsappUrl(selected, details)} target="_blank" rel="noreferrer"><Send size={17} /> Request on WhatsApp</a>
                <p><Check size={15} /> We will confirm the final design and price with you before starting.</p>
              </form>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Invitations;
