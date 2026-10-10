import { useCommerceCopy } from "../i18n/commerceCopy";
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
  group: "Romance" | "Celebration" | "Business" | "Milestone" | "Others";
  icon: typeof Heart;
};

const TEMPLATES: InvitationTemplate[] = [
  { id: "other-cards", title: "Cards & announcements", event: "Others", description: "School announcements, Eid welcomes and achievement certificates.", accent: "violet", group: "Others", icon: Sparkles },
  { id: "wedding-bloom", title: "Blooming vows", event: "Wedding", description: "Soft florals and timeless elegance.", accent: "rose", group: "Romance", icon: Heart },
  { id: "henna-night", title: "Henna night", event: "Engagement & henna", description: "Warm, celebratory and full of colour.", accent: "gold", group: "Romance", icon: Sparkles },
  { id: "birthday-confetti", title: "Confetti", event: "Birthday", description: "A joyful invitation for every age.", accent: "violet", group: "Celebration", icon: PartyPopper },
  { id: "grand-opening", title: "Grand opening", event: "Business opening", description: "Announce your next big beginning.", accent: "ink", group: "Business", icon: Store },
  { id: "graduation-day", title: "The next chapter", event: "Graduation", description: "Celebrate a milestone worth sharing.", accent: "navy", group: "Milestone", icon: Sparkles },
  { id: "family-table", title: "Family table", event: "Family gathering", description: "A warm welcome for the people who matter.", accent: "olive", group: "Milestone", icon: Users },
];

const CATEGORIES = ["All", "Romance", "Celebration", "Business", "Milestone", "Others"] as const;

function invitationWhatsappUrl(template: InvitationTemplate, details: Record<string, string>) {
  const lines = [
    "Hi Jibli! I'd like a digital invitation.",
    "",
    `Template: ${template.title} (${template.event})`,
    `Price: ${template.event === "Wedding" ? "15 TND" : "10 TND"}`,
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
  const copy = useCommerceCopy();
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
        <Link to="/request" className="outlineBtn">{copy("Order from AliExpress")} </Link>
        <ProfileNavLink />
      </Navbar>

      <main className="invitationsPage">
        {!selected ? (
          <>
            <section className="invitationHero invitationHeroEditorial">
              <div className="invitationHeroContent">
                <span className="invitationEyebrow"><Sparkles size={15} />{copy("Jibli celebrations")} </span>
                <h1>{copy("Online invitations")} <br />{copy("and cards for all")} <br /><em>{copy("moments that matter.")} </em></h1>
                <p>{copy("Personalised invitations, made to be shared beautifully on WhatsApp.")} </p>
                <div className="invitationHeroActions">
                  <a className="invitationBrowseBtn" href="#templates"><Palette size={17} />{copy("Browse invitations")} </a>
                  <span><WandSparkles size={15} />{copy("Made around your story")} </span>
                </div>
              </div>
            </section>

            <section className="invitationSteps" aria-label="How it works">
              <article className="invitationStep stepChoose"><span>01</span><div><strong>{copy("Choose a style")} </strong><p>{copy("Pick a template made for your occasion.")} </p></div><small>{copy("Start here")} <span>{copy("→")} </span></small></article>
              <article className="invitationStep stepDetails"><span>02</span><div><strong>{copy("Add the details")} </strong><p>{copy("Names, date, place and your special message.")} </p></div><small>{copy("Make it yours")} <span>{copy("→")} </span></small></article>
              <article className="invitationStep stepShare"><span>03</span><div><strong>{copy("Share the joy")} </strong><p>{copy("Receive a polished invitation ready for WhatsApp.")} </p></div><small>{copy("Send the love")} <span>{copy("→")} </span></small></article>
            </section>

<section className="invitationCatalog" id="templates">
              <div className="invitationSectionHeading">
                <div><span className="eyebrow">{copy("Start with a style")} </span><h2>{copy("Designed for your moment")} </h2></div>
                <p>{copy("Choose a starting point. We will personalise every detail for you.")} </p>
              </div>
              <div className="invitationCategoryBar" role="tablist" aria-label="Invitation categories">
                {CATEGORIES.map((category) => (
                  <button key={category} type="button" role="tab" aria-selected={activeCategory === category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{copy(category)}</button>
                ))}
              </div>
              <div className="invitationTemplateGrid">
                {visibleTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button key={template.id} type="button" className={`invitationTemplate ${template.accent}`} onClick={() => template.id === "wedding-bloom" ? navigate("/invitations/weddings") : template.id === "henna-night" ? navigate("/invitations/engagements") : template.id === "birthday-confetti" ? navigate("/invitations/birthdays") : template.id === "grand-opening" ? navigate("/invitations/openings") : template.id === "graduation-day" ? navigate("/invitations/graduations") : template.id === "family-table" ? navigate("/invitations/family") : template.id === "other-cards" ? navigate("/invitations/others") : setSelectedId(template.id)}>
                      <div className="invitationTemplateIcon"><Icon size={25} /></div>
                      <div className="invitationTemplateGlow" />
                      <span>{copy(template.event)}</span>
                      <strong>{template.title}</strong>
                      <p>{template.description}</p>
                      <small>{copy("Create this invitation")} <span>{copy("→")} </span></small>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <section className="invitationBuilder">
            <button type="button" className="invitationBack" onClick={() => setSelectedId(null)}><ChevronLeft size={18} />{copy("All designs")} </button>
            <div className="invitationBuilderHeading">
              <span className="eyebrow">{selected.event}</span>
              <h1>{copy("Make it yours")} </h1>
              <p>{copy("Tell us the essentials. We will turn this into a share-ready invitation.")} </p>
            </div>
            <div className="invitationBuilderGrid">
              <div className="invitationPreviewWrap">
                <p className="invitationPreviewLabel">{copy("Live preview")} </p>
                <article className={`invitationPreview ${selected.accent}`}>
                  <selected.icon size={28} />
                  <span>{selected.event}</span>
                  <h2>{details.hosts || "Your special event"}</h2>
                  <p>{details.date || "Choose your date"}{details.time ? ` · ${details.time}` : ""}</p>
                  <div />
                  <small>{details.location || "Your location"}</small>
                </article>
                <p className="mutedText">{copy("This is a preview concept. Your final invitation is personalised by Jibli.")} </p>
              </div>
              <form className="invitationForm" onSubmit={(event) => event.preventDefault()}>
                <label>{copy("Hosts, celebrant or business name")} <input value={details.hosts} onChange={(event) => changeDetail("hosts", event.target.value)} placeholder={copy("Example: Amira & Youssef")} /></label>
                <div className="invitationFormRow">
                  <label>{copy("Date")} <input type="date" value={details.date} onChange={(event) => changeDetail("date", event.target.value)} /></label>
                  <label>{copy("Time")} <input type="time" value={details.time} onChange={(event) => changeDetail("time", event.target.value)} /></label>
                </div>
                <label><MapPin size={15} />{copy("Location / venue")} <input value={details.location} onChange={(event) => changeDetail("location", event.target.value)} placeholder={copy("Example: Deguach, Tunisia")} /></label>
                <label>{copy("Invitation language")} <select value={details.language} onChange={(event) => changeDetail("language", event.target.value)}><option value="French / Arabic">{copy("French / Arabic")}</option><option value="Arabic">{copy("Arabic")}</option><option value="French">{copy("French")}</option><option value="English">{copy("English")}</option></select></label>
                <label>{copy("Anything else you want us to know?")} <textarea value={details.note} onChange={(event) => changeDetail("note", event.target.value)} placeholder={copy("Colours, dress code, RSVP details, special wording...")} /></label>
                <a className="primaryBtn invitationWhatsappBtn" href={invitationWhatsappUrl(selected, details)} target="_blank" rel="noreferrer"><Send size={17} />{copy("Request on WhatsApp")} </a>
                <p><Check size={15} />{copy("Invitations cost 10 TND; weddings cost 15 TND. We will confirm the final design before starting.")} </p>
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
