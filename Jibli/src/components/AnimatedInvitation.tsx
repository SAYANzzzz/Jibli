import { useCommerceCopy } from "../i18n/commerceCopy";
import { useTranslation } from "../i18n/useTranslation";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getInvitationDesign } from "../invitationDesigns";
import CharacterInvitation from "./CharacterInvitation";
import LivingArtwork from "./LivingArtwork";
import InvitationArtworkText from "./InvitationArtworkText";
import SchoolRegistrationMotion from "./SchoolRegistrationMotion";
import { RotateCcw, MapPin, ArrowDown, CalendarDays, Sparkles, Clock3, Navigation, Maximize2, X } from "lucide-react";

type Props = { image: string; title: string; details: Record<string, string>; onMoodChange?: (mood: string) => void; guest?: boolean; certificate?: boolean };

export default function AnimatedInvitation({ image, title, details: savedDetails, guest = false, certificate: suppliedCertificate = false }: Props) {
  const { language } = useTranslation();
  const design = getInvitationDesign(image);
  const kindergartenWelcome = design.key === "eid-school-welcome";
  const registration = design.key === "kindergarten-welcome" || design.key === "school-registration";
  const certificate = suppliedCertificate || design.layout === "certificate";
  const [expanded, setExpanded] = useState(false);
  const [failedImage, setFailedImage] = useState("");
  const showPersonalisedCover = !image || failedImage === image;
  const sampleDate = new Date();
  sampleDate.setMonth(sampleDate.getMonth() + 3);
  const sampleDateString = `${sampleDate.getFullYear()}-${String(sampleDate.getMonth() + 1).padStart(2, "0")}-${String(sampleDate.getDate()).padStart(2, "0")}`;
  const isSample = !guest && !certificate && (!(savedDetails.couple || savedDetails.name) || !savedDetails.date || !savedDetails.time || !savedDetails.venue);
  const details = guest || certificate ? savedDetails : {
    ...savedDetails,
    date: savedDetails.date || sampleDateString,
    time: savedDetails.time || "19:00",
    venue: savedDetails.venue || "Tunis, Tunisia",
  };
  const guestLanguage = details.language?.startsWith("Arabic") ? "ar" : details.language?.startsWith("French") ? "fr" : "en";
  const copy = useCommerceCopy(guest ? guestLanguage : undefined);
  const locale = guest ? guestLanguage : language;
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const story = useRef<HTMLDivElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  useEffect(() => {
    if (!opening) return;
    // Pausing or disabling CSS animations must not leave the revealed card inert.
    const timer = window.setTimeout(() => setOpening(false), 2000);
    return () => window.clearTimeout(timer);
  }, [opening]);
  const collection = image.split("/")[2];
  const mood = image ? "original" : savedDetails.mood || "champagne";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!opened || !details.date) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [opened, details.date]);
  useEffect(() => {
    const root = story.current;
    if (!opened || !root || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-entered", "true");
          observer.unobserve(entry.target);
        }
      });
    }, { root, threshold: .4 });
    root.querySelectorAll(".inviteStoryPanel").forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, [opened]);
  useEffect(() => {
    if (opened && !opening) story.current?.focus({ preventScroll: true });
  }, [opened, opening]);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = story.current?.closest<HTMLElement>(".animatedInvite") || document.querySelector<HTMLElement>(".inviteExpanded");
    const trigger = root?.querySelector<HTMLButtonElement>(".inviteExpandButton");
    const priorFocus = document.activeElement;
    trigger?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key !== "Tab" || !root) return;
      const focusable = [...root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"], iframe')].filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
      if (priorFocus instanceof HTMLElement && priorFocus.isConnected) priorFocus.focus({ preventScroll: true });
    };
  }, [expanded]);
  useEffect(() => {
    const root = story.current;
    if (!opened || !root) return;
    const picture = root.querySelector<HTMLImageElement>(".inviteMainPicture img");
    const svg = root.querySelector<SVGSVGElement>(".inviteMainPicture svg");
    const measure = () => {
      root.style.setProperty("--chapter-height", `${Math.max(200, root.clientHeight)}px`);
      const ratio = picture?.naturalWidth && picture.naturalHeight
        ? picture.naturalWidth / picture.naturalHeight
        : svg?.viewBox.baseVal.height ? svg.viewBox.baseVal.width / svg.viewBox.baseVal.height : .7;
      root.style.setProperty("--artwork-ratio", String(ratio));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    picture?.addEventListener("load", measure);
    return () => { observer.disconnect(); picture?.removeEventListener("load", measure); };
  }, [opened, image]);
  const name = details.couple || details.name || (guest ? copy("Your name here") : certificate ? "Nour" : collection === "weddings" || collection === "engagements" ? "Amira & Youssef" : collection === "birthdays" || collection === "graduations" ? "Nour" : collection === "family" ? copy("Together again") : collection === "openings" ? copy("A new beginning") : copy("Welcome, little dreamers"));
  const initials = !(savedDetails.couple || savedDetails.name) && guest ? "J" : name.split(/\s+|&/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  const eventTime = details.date ? new Date(`${details.date}T${details.time || "00:00"}:00+01:00`).getTime() : NaN;
  const remaining = Math.max(0, Math.floor((eventTime - now) / 1000));
  const units = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  const validDate = Number.isFinite(eventTime);
  const calendarText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const calendarDate = validDate ? details.date.replaceAll("-", "") : "";
  const calendarTitle = `${copy(collection === "weddings" ? "Wedding" : collection === "engagements" ? "Engagement" : collection === "birthdays" ? "Birthday" : "Invitation")} - ${name}`;
  const calendarTimestamp = (stamp: number) => new Date(stamp).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const nextCalendarDay = validDate ? new Date(Date.UTC(...(() => {
    const [y, m, d] = details.date.split("-").map(Number);
    return [y, m - 1, d + 1] as const;
  })())).toISOString().slice(0, 10).replaceAll("-", "") : "";
  const calendarDates = validDate && details.time ? `${calendarTimestamp(eventTime)}/${calendarTimestamp(eventTime)}` : `${calendarDate}/${nextCalendarDay}`;
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: calendarTitle, dates: calendarDates, ctz: "Africa/Tunis", location: details.venue || "", details: details.note || title })}`;
  const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Jibli//Invitation//EN", "BEGIN:VEVENT", `UID:${calendarDate}-${encodeURIComponent(name)}@jibli`, `DTSTAMP:${new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, validDate && details.time ? `DTSTART:${new Date(eventTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}` : `DTSTART;VALUE=DATE:${calendarDate}`, `SUMMARY:${calendarText(calendarTitle)}`, `LOCATION:${calendarText(details.venue || "")}`, `DESCRIPTION:${calendarText(details.note || title)}`, ...(!details.time && validDate ? [`DTEND;VALUE=DATE:${nextCalendarDay}`] : []), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const eventDate = validDate ? new Date(eventTime) : null;
  const formattedTime = eventDate && details.time ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" }).format(eventDate) : "";

  const calendarMonth = eventDate ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "Africa/Tunis" }).format(eventDate) : "";
  const [year, month, day] = (details.date || "").split("-").map(Number);
  const firstWeekday = validDate ? (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7 : 0;
  const daysInMonth = validDate ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;

  const artwork = showPersonalisedCover ? <div className="invitePersonalisedCover"><Sparkles size={24} aria-hidden="true" /><p>{title}</p><h2 dir="auto">{name}</h2><span>{certificate ? details.school : copy("You are warmly invited")}</span></div> : image === "/invitations/others/kindergarten-welcome.jfif" ? <CharacterInvitation title={title} paused={motionPaused} /> : image === "/invitations/others/school-registration.jfif" ? <SchoolRegistrationMotion title={title} paused={motionPaused} /> : <LivingArtwork image={image} title={guest ? title : `${title} design reference`} paused={motionPaused} onError={() => setFailedImage(image)} />;

  const floral = ["arabesque-burgundy", "arabic-satin", "blush-embossed", "garden-couple", "classic-ivory", "photo-frame", "blue-florals", "nouveau-florals", "green-tradition", "family-roots"].includes(design.key);
  const driftingLeaves = floral ? <div className="inviteFloralMotion" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} className={`inviteDriftingLeaf inviteDriftingLeaf-${index}`} />)}</div> : null;
  return <section style={{ ...(image ? design.colours : {}), "--story-artwork": `url("${image}")` } as CSSProperties} role={expanded ? "dialog" : undefined} aria-modal={expanded || undefined} data-layout={certificate ? "certificate" : design.layout} data-design={design.key} data-collection={collection} className={`animatedInvite inviteStory inviteMood-${mood} ${opened ? "isOpen" : ""} ${expanded ? "inviteExpanded" : ""}`} data-motion-paused={motionPaused} dir={locale === "ar" ? "rtl" : "ltr"} aria-label="Interactive invitation preview">
    <div className="inviteUtilityBar"><button type="button" className="inviteExpandButton" aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? <X size={14} /> : <Maximize2 size={14} />}{copy(expanded ? "Close preview" : "Full screen")}</button><button type="button" className="inviteMotionToggle" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{copy(motionPaused ? "Resume animation" : "Pause animation")}</button></div>
    <div className="animatedInviteToolbar"><span><Sparkles size={13} />{copy("Invitation preview")} </span>{opened && <button type="button" onClick={() => { setOpening(false); setOpened(false); }}><RotateCcw size={14} />{copy("Replay")} </button>}</div>

    {isSample && <p className="inviteSampleNotice">{copy("Sample event details - fill in the form to personalise your preview.")}</p>}
    <div className="inviteStage">
    {(!opened || opening) && <button type="button" className={`inviteEnvelope ${opening ? "isOpening" : ""}`} disabled={opening} onAnimationEnd={(event) => { if (event.target === event.currentTarget) setOpening(false); }} onClick={() => { setNow(Date.now()); setOpening(!motionPaused); setOpened(true); }} aria-label={`Open invitation: ${title}`}>
      <span className="inviteEnvelopePaper" aria-hidden="true"><span>{initials}</span></span><span className="inviteEnvelopeFold" /><span className="inviteEnvelopePocket" /><span className="inviteEnvelopeFlap" /><span className="inviteEnvelopeBorder" />
      <span className="inviteWaxSeal"><img className="inviteSealLogo" src="/jibli-seal-logo.png" alt="Jibli" /></span>
      <span className="inviteEnvelopeGreeting">{copy("A little invitation for you by")} </span>
      <strong dir="auto">{details.hosts?.trim() || name}</strong><span className="inviteOpenHint">{copy("Open invitation")} <ArrowDown size={14} /></span>
    </button>}
    {opened && <>
    <div ref={story} inert={opening} className="inviteReveal" tabIndex={0} aria-label="Scroll through your invitation">
      <section className="inviteOriginalArtwork inviteMainPicture"><div className="inviteOriginalArtworkFrame">{artwork}{!showPersonalisedCover && <InvitationArtworkText image={image} details={savedDetails} locale={guestLanguage} />}</div>{!showPersonalisedCover && <InvitationArtworkText image={image} details={savedDetails} locale={guestLanguage} caption />}</section>
      <div className="inviteEventDetails">
        {!certificate && validDate && <section className="inviteStoryPanel inviteStorySchedule">{driftingLeaves}
        {!certificate && details.hosts?.trim() && <p className="inviteHostCredit">{copy("Invitation by")} <strong dir="auto">{details.hosts.trim()}</strong></p>}
        {details.school?.trim() && <p className="inviteHostCredit" dir="auto">{details.school.trim()}</p>}

          <span className="inviteSectionNumber">01 / {copy(kindergartenWelcome ? "Back to kindergarten" : registration ? "Registration" : "The celebration")}</span>
          <h3>{copy(kindergartenWelcome ? "Welcome back, little learners" : registration ? "Registration opens" : "A date to remember")}</h3>
          <div className="inviteDateDisplay"><span>{new Intl.DateTimeFormat(locale, {weekday:"long",timeZone:"Africa/Tunis"}).format(new Date(eventTime))}</span><strong>{day}</strong><span>{calendarMonth}</span></div>
          {formattedTime && <div className="inviteTimeDisplay"><Clock3 size={20} /><strong>{formattedTime}</strong><span>{copy("Tunisia time")}</span></div>}
          <div className="inviteEventRibbon"><span aria-hidden="true">✦</span>{copy(kindergartenWelcome ? "We can?t wait to see you" : registration ? "Welcome, little learners" : "You are warmly invited")}<span aria-hidden="true">✦</span></div>
        </section>}
        {!certificate && validDate && <section className="inviteStoryPanel inviteStoryCalendar">{driftingLeaves}
          <span className="inviteSectionNumber">02 / {copy("Save the date")}</span>
          <h3>{calendarMonth}</h3>
          <div className="inviteMonthGrid" role="table" aria-label={calendarMonth}>
            <div className="inviteMonthRow" role="row">{Array.from({ length: 7 }, (_, index) => <span role="columnheader" key={index}>{new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5 + index)))}</span>)}</div>
            {Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) }, (_, week) => <div className="inviteMonthRow" role="row" key={week}>{Array.from({ length: 7 }, (_, column) => {
              const date = week * 7 + column - firstWeekday + 1;
              return <span role="cell" key={column} className={date === day ? "isEventDay" : undefined} aria-label={date === day ? new Intl.DateTimeFormat(locale, {dateStyle: "full", timeZone: "Africa/Tunis"}).format(new Date(eventTime)) : undefined}>{date > 0 && date <= daysInMonth ? date : ""}</span>;
            })}</div>)}
          </div>
          <a className="inviteLocation inviteCalendar" href={googleCalendarUrl} target="_blank" rel="noopener noreferrer"><CalendarDays size={15} />{copy("Save the date")}</a>
          <a className="inviteCalendarDownload" download="jibli-invitation.ics" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`}>{copy("Apple / Outlook calendar (.ics)")}</a>
        </section>}
        {!certificate && Number.isFinite(eventTime) && eventTime > now && <section className="inviteStoryPanel inviteStoryCountdown">{driftingLeaves}<span className="inviteSectionNumber">03 / {copy(kindergartenWelcome ? "See you soon" : registration ? "Registration countdown" : "Every second brings us closer")}</span><p>{copy(kindergartenWelcome ? "Counting down to our return to kindergarten" : registration ? "Counting down to registration opening" : "Counting down to our special day")} </p><div className="inviteCountdown" aria-label="Event countdown">{units.map((value, index) => <div key={index}><strong>{String(value).padStart(2, "0")}</strong><span>{copy(["Days", "Hours", "Minutes", "Seconds"][index])}</span></div>)}</div></section>}
        {!certificate && details.venue && <section className="inviteStoryPanel inviteStoryVenue">{driftingLeaves}<span className="inviteSectionNumber">04 / {copy(kindergartenWelcome || registration ? "Our kindergarten" : "The place")}</span><div className="inviteVenueIllustration" aria-hidden="true"><MapPin size={38} /></div><h3>{copy(kindergartenWelcome || registration ? "Visit our kindergarten" : "Meet us here")} </h3><p dir="auto">{details.venue}</p><a className="inviteLocation" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.venue)}`} target="_blank" rel="noreferrer"><Navigation size={15} />{copy("Get directions")} </a>
          <iframe className="inviteVenueMap" title={`${copy(kindergartenWelcome || registration ? "Visit our kindergarten" : "Meet us here")}: ${details.venue}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(details.venue)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </section>}
        {details.note && <section className="inviteStoryPanel"><p className="invitePersonalNote" dir="auto">{details.note}</p></section>}
        {!certificate && (details.rsvp || details.contact) && <section className="inviteStoryPanel"><h3>{copy(kindergartenWelcome ? "Contact our kindergarten" : registration ? "Registration enquiries" : "RSVP / contact")} </h3><p dir="auto">{details.rsvp || details.contact}</p></section>}
      </div>
    </div></>}
    </div>
    {!guest && <p className="invitePreviewNote">{copy("Preview your opening animation and event details. The artwork shown is a design example; Jibli personalises the final invitation.")} </p>}
  </section>;
}
