import { useCommerceCopy } from "../i18n/commerceCopy";
import { useEffect, useState } from "react";
import { RotateCcw, MapPin, ArrowDown, CalendarDays, Sparkles } from "lucide-react";

type Props = { image: string; title: string; details: Record<string, string>; onMoodChange?: (mood: string) => void; guest?: boolean; certificate?: boolean };

export default function AnimatedInvitation({ image, title, details, onMoodChange, guest = false, certificate = false }: Props) {
  const guestLanguage = details.language?.startsWith("Arabic") ? "ar" : details.language?.startsWith("French") ? "fr" : "en";
  const copy = useCommerceCopy(guest ? guestLanguage : undefined);
  const locale = guest ? guestLanguage : document.documentElement.lang || "en";
  const [opened, setOpened] = useState(false);
  const collection = image.split("/")[2];
  const defaultMood = collection === "birthdays" ? "confetti" : collection === "family" ? "garden" : collection === "openings" || collection === "graduations" ? "midnight" : "champagne";
  const mood = details.mood || defaultMood;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!opened || !details.date) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [opened, details.date]);
  const name = details.couple || details.name || copy("Your name here");
  const initials = name === "Your name here" ? "J" : name.split(/\s+|&/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  const eventTime = details.date ? new Date(`${details.date}T${details.time || "00:00"}:00+01:00`).getTime() : NaN;
  const remaining = Math.max(0, Math.floor((eventTime - now) / 1000));
  const units = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  const validDate = Number.isFinite(eventTime);
  const calendarText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const calendarDate = validDate ? details.date.replaceAll("-", "") : "";
  const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Jibli//Invitation//EN", "BEGIN:VEVENT", `UID:${calendarDate}-${encodeURIComponent(name)}@jibli`, `DTSTAMP:${new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, validDate && details.time ? `DTSTART:${new Date(eventTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}` : `DTSTART;VALUE=DATE:${calendarDate}`, `SUMMARY:${calendarText(name)}`, `LOCATION:${calendarText(details.venue || "")}`, `DESCRIPTION:${calendarText(details.note || title)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return <section className={`animatedInvite inviteMood-${mood} ${opened ? "isOpen" : ""}`} dir={locale === "ar" ? "rtl" : "ltr"} aria-label="Interactive invitation preview">
    <div className="animatedInviteToolbar"><span><Sparkles size={13} />{copy("Your invitation experience")} </span>{opened && <button type="button" onClick={() => setOpened(false)}><RotateCcw size={14} />{copy("Replay")} </button>}</div>
    {!guest && <div className="inviteMoodPicker" role="group" aria-label="Invitation colour theme">{([['champagne', 'Champagne'], ['garden', 'Botanical'], ['midnight', 'Midnight'], ['confetti', 'Rose']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={mood === value} aria-label={`${label} theme`} title={label} className={`inviteMoodSwatch swatch-${value}`} onClick={() => onMoodChange?.(value)} />)}<span>{copy("Choose your mood")} </span></div>}
    {!opened ? <button type="button" className="inviteEnvelope" onClick={() => { setNow(Date.now()); setOpened(true); }} aria-label={`Open invitation: ${title}`}>
      {image && <img src={image} alt="" className="inviteEnvelopeTexture" />}
      <span className="inviteEnvelopeFlap" /><span className="inviteEnvelopeFold" /><span className="inviteEnvelopeBorder" />
      <span className="inviteWaxSeal"><span className="inviteMonogram">{initials}</span></span>
      <span className="inviteEnvelopeGreeting">{copy("A little invitation for you")} </span>
      <strong dir="auto">{name}</strong><span className="inviteOpenHint">{copy("Break the seal")} <ArrowDown size={14} /></span>
    </button> : <div className="inviteReveal" tabIndex={0} aria-label="Scroll through your invitation">
      <div className="inviteCurtain inviteCurtainLeft" /><div className="inviteCurtain inviteCurtainRight" />
      <div className="inviteWelcome">
        <div className="inviteStardust" aria-hidden="true">{Array.from({length: 12}, (_, index) => <i key={index} style={{left: `${(index * 29 + 7) % 100}%`, animationDelay: `${index * -.7}s`, animationDuration: `${5 + index % 4}s`}} />)}</div>
        <span className="inviteWelcomeKicker">{copy("A moment to remember")} </span><span className="inviteWelcomeMonogram" aria-hidden="true">{initials}</span><h2 dir="auto">{name}</h2><p>{validDate ? new Intl.DateTimeFormat(locale, {dateStyle: "long", timeZone:"Africa/Tunis"}).format(new Date(eventTime)) : copy("Something beautiful is coming")}</p><span className="inviteScrollHint">{copy("Discover your invitation")} <ArrowDown size={16} /></span>
      </div>
      {image && <img className="inviteArtwork" src={image} alt={guest ? title : `${title} design reference`} />}
      <div className="inviteEventDetails">
        <span className="inviteOrnament" aria-hidden="true">{copy("✦")} </span><p>{copy(certificate ? "Certificate of achievement" : "You are warmly invited")}</p><h2 dir="auto">{name}</h2>
        {(details.hosts || details.school) && <p dir="auto">{details.hosts || details.school}</p>}
        {validDate && <p className="inviteEventDate">{new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Africa/Tunis" }).format(new Date(eventTime))}{details.time && ` · ${details.time}`}</p>}
        {!certificate && Number.isFinite(eventTime) && eventTime > now && <><p>{copy("Counting down to our special day")} </p><div className="inviteCountdown" aria-label="Event countdown">{units.map((value, index) => <div key={index}><strong>{String(value).padStart(2, "0")}</strong><span>{copy(["Days", "Hours", "Minutes", "Seconds"][index])}</span></div>)}</div></>}
        {!certificate && Number.isFinite(eventTime) && eventTime <= now && <p>{copy("The date has arrived")} </p>}
        {!certificate && details.venue && <><h3>{copy("Meet us here")} </h3><p dir="auto">{details.venue}</p><a className="inviteLocation" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.venue)}`} target="_blank" rel="noreferrer"><MapPin size={15} />{copy("View location")} </a></>}
        {!certificate && validDate && <a className="inviteLocation inviteCalendar" download="jibli-invitation.ics" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`}><CalendarDays size={15} />{copy("Save the date")} </a>}
        {details.note && <p className="invitePersonalNote" dir="auto">{details.note}</p>}
        {!certificate && (details.rsvp || details.contact) && <><h3>{copy("RSVP / contact")} </h3><p dir="auto">{details.rsvp || details.contact}</p></>}
        <span className="inviteOrnament" aria-hidden="true">{copy("✦")} </span><p>{copy("Made with love · Jibli")} </p>
      </div>
    </div>}
    {!guest && <p className="invitePreviewNote">{copy("Preview your opening animation and event details. The artwork shown is a design example; Jibli personalises the final invitation.")} </p>}
  </section>;
}
