import { isGoogleMapsLink, invitationMapQuery, invitationDirectionsUrl } from "../invitationMaps";
import InvitationEnvelopeArtwork from "./InvitationEnvelopeArtwork";
import BirthdayArtwork from "./BirthdayArtwork";
import CoupleArtwork from "./CoupleArtwork";
import { hasCouplePhotos, couplePhotoFields } from "../couplePersonalisation";
import { birthdayDesignKey, birthdayHasAge, birthdayLayouts } from "../birthdayPersonalisation";
import { venuePhotoKeys } from "../invitationPhotos";
import { useCommerceCopy } from "../i18n/commerceCopy";
import { useTranslation } from "../i18n/useTranslation";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getInvitationDesign } from "../invitationDesigns";
import { resolveInvitationImage, invitationIsCertificate } from "../invitationTemplates";
import { optimizedImage } from "../optimizedImage";
import CharacterInvitation from "./CharacterInvitation";
import LivingArtwork from "./LivingArtwork";
import InvitationArtworkText from "./InvitationArtworkText";
import SchoolRegistrationMotion from "./SchoolRegistrationMotion";
import { MapPin, ArrowDown, CalendarDays, Sparkles, Clock3, Navigation } from "lucide-react";

type Props = { image: string; title: string; details: Record<string, string>; onMoodChange?: (mood: string) => void; guest?: boolean; certificate?: boolean };

export default function AnimatedInvitation({ image: suppliedImage, title, details: savedDetails, guest = false, certificate: suppliedCertificate = false }: Props) {
  const { language } = useTranslation();
  const image=resolveInvitationImage({image:suppliedImage,title});
  const design = getInvitationDesign(image);
  const kindergartenWelcome = design.key === "eid-school-welcome";
  const registration = design.key === "kindergarten-welcome" || design.key === "school-registration";
  const certificate = invitationIsCertificate(image, suppliedCertificate || design.layout === "certificate");
  const [failedImage, setFailedImage] = useState("");
  const showPersonalisedCover = !image || failedImage === image;
  const isSample = !guest && !certificate && (!(savedDetails.couple || savedDetails.name) || !savedDetails.date || !savedDetails.time || !savedDetails.venue);
  const details = savedDetails;
  const guestLanguage = /^(arabic|ar)\b/i.test(details.language || "") ? "ar" : /^(french|fr)\b/i.test(details.language || "") ? "fr" : "en";
  const locale = details.language ? guestLanguage : language;
  const copy = useCommerceCopy(locale);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const artworkReady = useRef<Promise<void>>(Promise.resolve());
  const story = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!image) { artworkReady.current = Promise.resolve(); return; }
    const picture = new Image();
    picture.src = optimizedImage(image);
    artworkReady.current = picture.decode().catch(() => { /* The artwork renderer supplies its fallback. */ });
  }, [image]);
  useEffect(() => {
    const root = story.current;
    if (!opened || !root) return;
    let gestureTimer = 0;
    let navigating = false;
    let accumulated = 0;
    let swipe: { x: number; y: number; top: number; panel: HTMLElement | null; panelTop: number } | null = null;
    const touchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const panel = (event.target as Element).closest<HTMLElement>(".inviteStoryPanel");
      swipe = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY, top: root.scrollTop, panel, panelTop: panel?.scrollTop || 0 } : null;
    };
    const touchEnd = (event: TouchEvent) => {
      const start = swipe;
      swipe = null;
      if (!start || event.touches.length || !event.changedTouches[0]) return;
      if (start.panel?.querySelector(".inviteStoryPhotos")) return;
      const touch = event.changedTouches[0];
      const distance = start.y - touch.clientY;
      if (Math.abs(distance) < 40 || Math.abs(distance) < Math.abs(start.x - touch.clientX)) return;
      if (start.panel && start.panel.scrollHeight > start.panel.clientHeight + 16 &&
        (distance > 0 ? start.panelTop + start.panel.clientHeight < start.panel.scrollHeight - 2 : start.panelTop > 2)) return;
      const top = root.getBoundingClientRect().top;
      const positions = [...root.querySelectorAll<HTMLElement>(".inviteMainPicture, .inviteStoryPanel")].map((chapter) => chapter.getBoundingClientRect().top - top + root.scrollTop);
      const current = positions.reduce((best, value, index) => Math.abs(value - start.top) < Math.abs(positions[best] - start.top) ? index : best, 0);
      const next = Math.max(0, Math.min(positions.length - 1, current + Math.sign(distance)));
      root.scrollTo({ top: positions[next], behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    };
    const touchMove = (event: TouchEvent) => {
      if (!swipe || event.touches.length !== 1) { swipe = null; return; }
      if (swipe.panel?.querySelector(".inviteStoryPhotos")) return;
      const distance = swipe.y - event.touches[0].clientY;
      if (Math.abs(distance) < 8 || Math.abs(distance) < Math.abs(swipe.x - event.touches[0].clientX)) return;
      if (swipe.panel && swipe.panel.scrollHeight > swipe.panel.clientHeight + 16 &&
        (distance > 0 ? swipe.panelTop + swipe.panel.clientHeight < swipe.panel.scrollHeight - 2 : swipe.panelTop > 2)) return;
      // Let the chapter transition own this swipe rather than native inertia.
      event.preventDefault();
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if ((event.target as Element).closest(".inviteStoryVenue")?.querySelector(".inviteStoryPhotos")) return;
      if (navigating) {
        event.preventDefault();
        window.clearTimeout(gestureTimer);
        gestureTimer = window.setTimeout(() => { navigating = false; accumulated = 0; }, 350);
        return;
      }
      const panel = (event.target as Element).closest<HTMLElement>(".inviteStoryPanel");
      if (panel && panel.scrollHeight > panel.clientHeight + 16 &&
        (event.deltaY > 0 ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2 : panel.scrollTop > 2)) return;
      event.preventDefault();
      window.clearTimeout(gestureTimer);
      gestureTimer = window.setTimeout(() => { navigating = false; accumulated = 0; }, 350);
      if (navigating) return;
      accumulated += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1);
      if (Math.abs(accumulated) < 18) return;
      const chapters = [...root.querySelectorAll<HTMLElement>(".inviteMainPicture, .inviteStoryPanel")];
      const top = root.getBoundingClientRect().top;
      const positions = chapters.map((chapter) => chapter.getBoundingClientRect().top - top + root.scrollTop);
      const current = positions.reduce((best, value, index) => Math.abs(value - root.scrollTop) < Math.abs(positions[best] - root.scrollTop) ? index : best, 0);
      const next = Math.max(0, Math.min(chapters.length - 1, current + Math.sign(accumulated)));
      navigating = true;
      root.scrollTo({ top: positions[next], behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    };
    root.addEventListener("wheel", wheel, { passive: false });
    root.addEventListener("touchstart", touchStart, { passive: true });
    root.addEventListener("touchmove", touchMove, { passive: false });
    root.addEventListener("touchend", touchEnd, { passive: true });
    return () => {
      root.removeEventListener("wheel", wheel);
      root.removeEventListener("touchstart", touchStart);
      root.removeEventListener("touchmove", touchMove);
      root.removeEventListener("touchend", touchEnd);
      window.clearTimeout(gestureTimer);
    };
  }, [opened]);
  const [motionPaused] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!opening) return;
    // Pausing or disabling CSS animations must not leave the revealed card inert.
    const timer = window.setTimeout(() => setOpening(false), 850);
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
    if (!guest) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [guest]);
  useEffect(() => {
    const root = story.current;
    if (!root) return;
    const picture = root.querySelector<HTMLImageElement>(".inviteMainPicture img");
    const svg = root.querySelector<SVGSVGElement>(".inviteMainPicture svg");
    const measure = () => {
      root.style.setProperty("--chapter-height", `${Math.max(200, root.clientHeight)}px`);
      const ratio = picture?.naturalWidth && picture.naturalHeight
        ? picture.naturalWidth / picture.naturalHeight
        : svg?.dataset.artworkRatio ? Number(svg.dataset.artworkRatio) : svg?.viewBox.baseVal.height ? svg.viewBox.baseVal.width / svg.viewBox.baseVal.height : .7;
      root.style.setProperty("--artwork-ratio", String(ratio));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    picture?.addEventListener("load", measure);
    return () => { observer.disconnect(); picture?.removeEventListener("load", measure); };
  }, [opened, image]);
  const name = details.couple || details.name || copy("Your name here");
  const initials = !(savedDetails.couple || savedDetails.name) && guest ? "J" : name.split(/\s+|&/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase();
  const eventTime = details.date ? new Date(`${details.date}T${details.time || "00:00"}:00+01:00`).getTime() : NaN;
  const remaining = Math.max(0, Math.floor((eventTime - now) / 1000));
  const units = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
  const validDate = Number.isFinite(eventTime);
  const calendarText = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const calendarDate = validDate ? details.date.replaceAll("-", "") : "";
  const calendarTitle = `${copy(collection === "weddings" ? "Wedding" : collection === "engagements" ? "Engagement" : collection === "birthdays" ? "Birthday" : "Invitation")} - ${name}`;
  const nextCalendarDay = validDate ? new Date(Date.UTC(...(() => {
    const [y, m, d] = details.date.split("-").map(Number);
    return [y, m - 1, d + 1] as const;
  })())).toISOString().slice(0, 10).replaceAll("-", "") : "";
  const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Jibli//Invitation//EN", "BEGIN:VEVENT", `UID:${calendarDate}-${encodeURIComponent(name)}@jibli`, `DTSTAMP:${new Date(now).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, validDate && details.time ? `DTSTART:${new Date(eventTime).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}` : `DTSTART;VALUE=DATE:${calendarDate}`, `SUMMARY:${calendarText(calendarTitle)}`, `LOCATION:${calendarText(details.venue || "")}`, `DESCRIPTION:${calendarText(details.note || title)}`, ...(!details.time && validDate ? [`DTEND;VALUE=DATE:${nextCalendarDay}`] : []), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const eventDate = validDate ? new Date(eventTime) : null;
  const formattedTime = eventDate && details.time ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" }).format(eventDate) : "";

  const calendarMonth = eventDate ? new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "Africa/Tunis" }).format(eventDate) : "";
  const [year, month, day] = (details.date || "").split("-").map(Number);
  const firstWeekday = validDate ? (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7 : 0;
  const daysInMonth = validDate ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;

  const artwork = showPersonalisedCover ? <div className="invitePersonalisedCover"><Sparkles size={24} aria-hidden="true" /><p>{title}</p><h2 dir="auto">{name}</h2><span>{certificate ? details.school : copy("You are warmly invited")}</span></div> : image === "/invitations/others/kindergarten-welcome.jfif" ? <CharacterInvitation title={title} paused={!opened || opening || motionPaused} /> : image === "/invitations/others/school-registration.jfif" ? <SchoolRegistrationMotion title={title} paused={!opened || opening || motionPaused} /> : <LivingArtwork animate={opened && !opening} image={image} title={guest ? title : `${title} design reference`} paused={!opened || opening || motionPaused} onError={() => setFailedImage(image)} />;

  const floral = ["arabesque-burgundy", "arabic-satin", "blush-embossed", "garden-couple", "classic-ivory", "photo-frame", "blue-florals", "nouveau-florals", "green-tradition", "family-roots"].includes(design.key);
  const personalisedBirthday = !!birthdayLayouts[birthdayDesignKey(image)] && (!!details.birthdayPhoto || (birthdayHasAge(image) && !!details.age));
  const personalisedCouple = hasCouplePhotos(image) && couplePhotoFields(image).some(field=>!!details[field]);
  const coverArtwork = personalisedBirthday ? <BirthdayArtwork image={image} title={title} details={details}/> : personalisedCouple ? <CoupleArtwork image={image} title={title} details={details}/> : artwork;
  const driftingLeaves = floral ? <div className="inviteFloralMotion" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} className={`inviteDriftingLeaf inviteDriftingLeaf-${index}`} />)}</div> : null;
  const hasVenue = !certificate && !!(details.venue || isGoogleMapsLink(details.mapsUrl || ""));
  const photoCollage = venuePhotoKeys.some((key) => details[key]) ? <div className="inviteStoryPhotos">
    <div className="invitePhotoCollage" data-photo-count={venuePhotoKeys.filter((key) => details[key]).length}>
      {venuePhotoKeys.filter((key) => details[key]).map((key, index) => <figure className="invitePolaroid" key={key}><img src={details[key]} alt={`${copy("Invitation photo")} ${index + 1}`} loading="lazy" /></figure>)}
    </div>
  </div> : null;
  return <section style={{ ...(image ? design.colours : {}), "--story-artwork": `url("${optimizedImage(image)}")` } as CSSProperties} data-layout={certificate ? "certificate" : design.layout} data-design={design.key} data-collection={collection} className={`animatedInvite inviteStory inviteMood-${mood} ${opened ? "isOpen" : ""} ${guest ? "inviteGuestFullscreen" : ""}`} data-motion-paused={!opened || opening || motionPaused} dir={locale === "ar" ? "rtl" : "ltr"} aria-label="Interactive invitation preview">
    {isSample && <p className="inviteSampleNotice">{copy("Sample event details - fill in the form to personalise your preview.")}</p>}
    <div className="inviteStage">
    {(!opened || opening) && <button type="button" className={`inviteEnvelope ${opening ? "isOpening" : ""}`} disabled={opening || preparing} aria-busy={preparing} onAnimationEnd={(event) => { if (event.target === event.currentTarget && event.animationName === "inviteEnvelopeUnseal") setOpening(false); }} onClick={async (event) => {
      const envelope = event.currentTarget;
      setPreparing(true);
      await artworkReady.current;
      const bounds = envelope.getBoundingClientRect();
      envelope.parentElement?.style.setProperty("--opening-height", `${bounds.height}px`);
      envelope.parentElement?.style.setProperty("--opening-width", `${bounds.width}px`);
      setPreparing(false); setNow(Date.now()); setOpening(!motionPaused); setOpened(true);
    }} aria-label={`Open invitation: ${title}`}>
      <InvitationEnvelopeArtwork />
      <span className="inviteEnvelopePaper" aria-hidden="true"><span>{initials}</span></span><span className="inviteEnvelopeFold" /><span className="inviteEnvelopePocket" /><span className="inviteEnvelopeFlap" /><span className="inviteEnvelopeBorder" />
      <span className="inviteWaxSeal"><img className="inviteSealLogo" src="/jibli-seal-logo.png" alt="Jibli" /></span>
      <span className="inviteEnvelopeCaption"><span className="inviteEnvelopeGreeting">{copy("A little invitation for you by")} </span>
      <strong dir="auto">{details.hosts?.trim() || name}</strong><span className="inviteOpenHint">{copy(preparing ? "Opening your invitation…" : "Open invitation")} <ArrowDown size={14} /></span></span>
    </button>}
    <>
    <div ref={story} inert={!opened || opening} aria-hidden={!opened} className="inviteReveal" tabIndex={0} aria-label="Scroll through your invitation">
      <section className="inviteOriginalArtwork inviteMainPicture"><div className="inviteOriginalArtworkFrame">{coverArtwork}{!showPersonalisedCover && <InvitationArtworkText image={image} details={savedDetails} locale={locale} />}</div>{!showPersonalisedCover && <InvitationArtworkText image={image} details={savedDetails} locale={locale} caption />}
        <button type="button" className="inviteSwipeIndicator" onClick={() => {
          const root = story.current;
          const next = root?.querySelector<HTMLElement>(".inviteStoryPanel");
          if (root && next) root.scrollTo({ top: next.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop, behavior: motionPaused ? "instant" : "smooth" });
        }}>
          <span>{locale === "ar" ? "اسحب للأسفل لاكتشاف المزيد" : locale === "fr" ? "Faites défiler pour découvrir" : "Swipe down to discover"}</span>
          <ArrowDown size={18} aria-hidden="true" />
        </button>
      </section>
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
          <a className="inviteLocation inviteCalendar" download="jibli-invitation.ics" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`} aria-describedby="invite-calendar-help"><CalendarDays size={15} />{copy("Save the date")}</a>
          <p id="invite-calendar-help" className="inviteCalendarHelp">{copy("Open the downloaded .ics file with your calendar app to add this event.")}</p>
        </section>}
        {!certificate && Number.isFinite(eventTime) && eventTime > now && <section className="inviteStoryPanel inviteStoryCountdown">{driftingLeaves}<span className="inviteSectionNumber">03 / {copy(kindergartenWelcome ? "See you soon" : registration ? "Registration countdown" : "Every second brings us closer")}</span><p>{copy(kindergartenWelcome ? "Counting down to our return to kindergarten" : registration ? "Counting down to registration opening" : "Counting down to our special day")} </p><div className="inviteCountdown" aria-label="Event countdown">{units.map((value, index) => <div key={index}><strong>{String(value).padStart(2, "0")}</strong><span>{copy(["Days", "Hours", "Minutes", "Seconds"][index])}</span></div>)}</div></section>}
        {!hasVenue && photoCollage && <section className="inviteStoryPanel">{driftingLeaves}{photoCollage}</section>}
        {hasVenue && <section className="inviteStoryPanel inviteStoryVenue">{driftingLeaves}<span className="inviteSectionNumber">04 / {copy(kindergartenWelcome || registration ? "Our kindergarten" : "The place")}</span><div className="inviteVenueIllustration" aria-hidden="true"><MapPin size={38} /></div><h3>{copy(kindergartenWelcome || registration ? "Visit our kindergarten" : "Meet us here")} </h3><p className="inviteVenueName" dir="auto">{details.venue}</p>
          {photoCollage}
          <a className="inviteLocation" href={invitationDirectionsUrl(details.mapsUrl || "", details.venue || "")} target="_blank" rel="noreferrer"><Navigation size={15} />{copy("Get directions")} </a>
          {invitationMapQuery(details.mapsUrl || "", details.venue || "") && <iframe className="inviteVenueMap" title={`${copy(kindergartenWelcome || registration ? "Visit our kindergarten" : "Meet us here")}: ${details.venue}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(invitationMapQuery(details.mapsUrl || "", details.venue || ""))}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
        </section>}
        {details.note && <section className="inviteStoryPanel"><p className="invitePersonalNote" dir="auto">{details.note}</p></section>}
        {!certificate && (details.rsvp || details.contact) && <section className="inviteStoryPanel"><h3>{copy(kindergartenWelcome ? "Contact our kindergarten" : registration ? "Registration enquiries" : "RSVP / contact")} </h3><p dir="auto">{details.rsvp || details.contact}</p></section>}
        <section className="inviteStoryPanel inviteStoryClosing">
          <img className="inviteClosingLogo" src="/Logo.png" alt="Jibli" width="180" height="72" loading="lazy" />
          <h3>{copy("Discover Jibli invitations")}</h3>
          <a className="inviteLocation inviteClosingLink" href="https://www.jiblitunisia.com/invitations" target="_blank" rel="noopener noreferrer">{copy("Explore invitations")} <ArrowDown size={15} aria-hidden="true" /></a>
          <span className="inviteClosingAddress" dir="ltr">www.jiblitunisia.com/invitations</span>
        </section>
      </div>
    </div></>
    </div>
    {!guest && <p className="invitePreviewNote">{copy("Preview your opening animation and event details. The artwork shown is a design example; Jibli personalises the final invitation.")} </p>}
  </section>;
}
