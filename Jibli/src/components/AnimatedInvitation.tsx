import { useCommerceCopy } from "../i18n/commerceCopy";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import InvitationMotion from "./InvitationMotion";
import CharacterInvitation from "./CharacterInvitation";
import LivingArtwork from "./LivingArtwork";
import SchoolRegistrationMotion from "./SchoolRegistrationMotion";
import { RotateCcw, MapPin, ArrowDown, CalendarDays, Sparkles } from "lucide-react";

type Props = { image: string; title: string; details: Record<string, string>; onMoodChange?: (mood: string) => void; guest?: boolean; certificate?: boolean };

export default function AnimatedInvitation({ image, title, details, onMoodChange, guest = false, certificate = false }: Props) {
  const guestLanguage = details.language?.startsWith("Arabic") ? "ar" : details.language?.startsWith("French") ? "fr" : "en";
  const copy = useCommerceCopy(guest ? guestLanguage : undefined);
  const locale = guest ? guestLanguage : document.documentElement.lang || "en";
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const story = useRef<HTMLDivElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const collection = image.split("/")[2];
  const defaultMood = collection === "birthdays" ? "confetti" : collection === "family" ? "garden" : collection === "openings" || collection === "graduations" ? "midnight" : "champagne";
  const mood = details.mood || defaultMood;
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
    }, { root, threshold: .12 });
    root.querySelectorAll(".inviteStoryPanel").forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, [opened]);
  useEffect(() => {
    if (opened && !opening) story.current?.focus({ preventScroll: true });
  }, [opened, opening]);
  const name = details.couple || details.name || copy("Your name here");
  const initials = name === "Your name here" ? "J" : name.split(/\s+|&/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  const eventTime = details.date ? new Date(`${details.date}T${details.time || "00:00"}:00+01:00`).getTime() : NaN;
  const remaining = Math.max(0, Math.floor((eventTime - now) / 1000));
  const units = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  const validDate = Number.isFinite(eventTime);
  const calendarText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const calendarDate = validDate ? details.date.replaceAll("-", "") : "";
  const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Jibli//Invitation//EN", "BEGIN:VEVENT", `UID:${calendarDate}-${encodeURIComponent(name)}@jibli`, `DTSTAMP:${new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, validDate && details.time ? `DTSTART:${new Date(eventTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}` : `DTSTART;VALUE=DATE:${calendarDate}`, `SUMMARY:${calendarText(name)}`, `LOCATION:${calendarText(details.venue || "")}`, `DESCRIPTION:${calendarText(details.note || title)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const eventDate = validDate ? new Date(eventTime) : null;
  const calendarMonth = eventDate ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "Africa/Tunis" }).format(eventDate) : "";
  const [year, month, day] = (details.date || "").split("-").map(Number);
  const firstWeekday = validDate ? (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7 : 0;
  const daysInMonth = validDate ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;
  const artwork = image === "/invitations/others/kindergarten-welcome.jfif" ? <CharacterInvitation title={title} paused={motionPaused} /> : image === "/invitations/others/school-registration.jfif" ? <SchoolRegistrationMotion title={title} paused={motionPaused} /> : <LivingArtwork image={image} title={guest ? title : `${title} design reference`} paused={motionPaused} />;
  return <section style={{ "--story-artwork": `url("${image}")` } as CSSProperties} className={`animatedInvite inviteStory inviteMood-${mood} ${opened ? "isOpen" : ""}`} data-motion-paused={motionPaused} dir={locale === "ar" ? "rtl" : "ltr"} aria-label="Interactive invitation preview">
    <button type="button" className="inviteMotionToggle" aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{copy(motionPaused ? "Resume animation" : "Pause animation")}</button>
    <div className="animatedInviteToolbar"><span><Sparkles size={13} />{copy("Your invitation experience")} </span>{opened && <button type="button" onClick={() => { setOpening(false); setOpened(false); }}><RotateCcw size={14} />{copy("Replay")} </button>}</div>
    {!guest && <div className="inviteMoodPicker" role="group" aria-label="Invitation colour theme">{([['champagne', 'Champagne'], ['garden', 'Botanical'], ['midnight', 'Midnight'], ['confetti', 'Rose']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mood === value} aria-label={`${label} theme`} title={label} className={`inviteMoodSwatch swatch-${value}`} onClick={() => onMoodChange?.(value)} />)}<span>{copy("Choose your mood")} </span></div>}
    <div className="inviteStage">
    {(!opened || opening) && <button type="button" className={`inviteEnvelope ${opening ? "isOpening" : ""}`} disabled={opening} onAnimationEnd={(event) => { if (event.target === event.currentTarget) setOpening(false); }} onClick={() => { setNow(Date.now()); setOpening(true); setOpened(true); }} aria-label={`Open invitation: ${title}`}>
      {image && <img src={image} alt="" className="inviteEnvelopeTexture" />}
      <span className="inviteEnvelopeFlap" /><span className="inviteEnvelopeFold" /><span className="inviteEnvelopeBorder" />
      <span className="inviteWaxSeal"><span className="inviteMonogram">{initials}</span></span>
      <span className="inviteEnvelopeGreeting">{copy("A little invitation for you")} </span>
      <strong dir="auto">{name}</strong><span className="inviteOpenHint">{copy("Break the seal")} <ArrowDown size={14} /></span>
    </button>}
    {opened && <div ref={story} className="inviteReveal" tabIndex={0} aria-label="Scroll through your invitation">
      <div className="inviteWelcome">
        {image && <div className="inviteArtworkScene inviteStoryArtwork">{artwork}</div>}
        <div className="inviteStoryTitle">
        <InvitationMotion mood={mood} />
        <div className="inviteStardust" aria-hidden="true">{Array.from({length: 12}, (_, index) => <i key={index} style={{left: `${(index * 29 + 7) % 100}%`, animationDelay: `${index * -.7}s`, animationDuration: `${5 + index % 4}s`}} />)}</div>
        <span className="inviteWelcomeKicker">{copy("A moment to remember")} </span><span className="inviteWelcomeMonogram" aria-hidden="true">{initials}</span><h2 dir="auto">{name}</h2><p>{validDate ? new Intl.DateTimeFormat(locale, {dateStyle: "long", timeZone:"Africa/Tunis"}).format(new Date(eventTime)) : copy("Something beautiful is coming")}</p><span className="inviteScrollHint">{copy("Discover your invitation")} <ArrowDown size={16} /></span>
      </div>
      </div>
      <div className="inviteEventDetails">
        <section className="inviteStoryPanel inviteStoryIntro">
        <span className="inviteOrnament" aria-hidden="true">{copy("✦")} </span><p>{copy(certificate ? "Certificate of achievement" : "You are warmly invited")}</p><h2 dir="auto">{name}</h2>
        {(details.hosts || details.school) && <p dir="auto">{details.hosts || details.school}</p>}
        {validDate && <p className="inviteEventDate">{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Africa/Tunis" }).format(new Date(eventTime))}{details.time && ` · ${details.time}`}</p>}
        </section>
        {!certificate && validDate && <section className="inviteStoryPanel inviteStoryCalendar">
          <span className="inviteWelcomeKicker">{copy("Save the date")}</span>
          <h3>{calendarMonth}</h3>
          <div className="inviteMonthGrid" role="table" aria-label={calendarMonth}>
            <div className="inviteMonthRow" role="row">{Array.from({ length: 7 }, (_, index) => <span role="columnheader" key={index}>{new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5 + index)))}</span>)}</div>
            {Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) }, (_, week) => <div className="inviteMonthRow" role="row" key={week}>{Array.from({ length: 7 }, (_, column) => {
              const date = week * 7 + column - firstWeekday + 1;
              return <span role="cell" key={column} className={date === day ? "isEventDay" : undefined} aria-label={date === day ? new Intl.DateTimeFormat(locale, {dateStyle: "full", timeZone: "Africa/Tunis"}).format(new Date(eventTime)) : undefined}>{date > 0 && date <= daysInMonth ? date : ""}</span>;
            })}</div>)}
          </div>
          <a className="inviteLocation inviteCalendar" download="jibli-invitation.ics" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`}><CalendarDays size={15} />{copy("Save the date")}</a>
        </section>}
        {!certificate && Number.isFinite(eventTime) && eventTime > now && <section className="inviteStoryPanel"><p>{copy("Counting down to our special day")} </p><div className="inviteCountdown" aria-label="Event countdown">{units.map((value, index) => <div key={index}><strong>{String(value).padStart(2, "0")}</strong><span>{copy(["Days", "Hours", "Minutes", "Seconds"][index])}</span></div>)}</div></section>}
        {!certificate && Number.isFinite(eventTime) && eventTime <= now && <p>{copy("The date has arrived")} </p>}
        {!certificate && details.venue && <section className="inviteStoryPanel inviteStoryVenue"><div className="inviteVenueIllustration" aria-hidden="true"><MapPin size={38} /></div><h3>{copy("Meet us here")} </h3><p dir="auto">{details.venue}</p><a className="inviteLocation" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.venue)}`} target="_blank" rel="noreferrer"><MapPin size={15} />{copy("View location")} </a>
          <iframe className="inviteVenueMap" title={`${copy("Meet us here")}: ${details.venue}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(details.venue)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </section>}
        {details.note && <section className="inviteStoryPanel"><p className="invitePersonalNote" dir="auto">{details.note}</p></section>}
        {!certificate && (details.rsvp || details.contact) && <section className="inviteStoryPanel"><h3>{copy("RSVP / contact")} </h3><p dir="auto">{details.rsvp || details.contact}</p></section>}
        <span className="inviteOrnament" aria-hidden="true">{copy("✦")} </span><p>{copy("Made with love · Jibli")} </p>
      </div>
    </div>}
    </div>
    {!guest && <p className="invitePreviewNote">{copy("Preview your opening animation and event details. The artwork shown is a design example; Jibli personalises the final invitation.")} </p>}
  </section>;
}
