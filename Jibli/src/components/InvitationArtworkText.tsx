import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { captionNameDesigns, invitationTextLayouts } from "../invitationTextLayouts";
import type { TextSlot } from "../invitationTextLayouts";

type Props = { image: string; details: Record<string, string>; locale: string; caption?: boolean };

function fieldValue(slot: TextSlot, details: Props["details"], locale: string) {
  if (slot.field === "name") {
    const value = (details.couple || details.name || "").trim();
    if (slot.part === undefined) return value;
    return value.split(/\s*&\s*|\s+and\s+|\s+و\s+/i)[slot.part] || "";
  }
  if (slot.field === "contact") return details.rsvp || details.contact || "";
  if (slot.field === "year") return details.date?.slice(0, 4) || "";
  if (slot.field === "date" && details.date) {
    const date = new Date(`${details.date}T12:00:00+01:00`);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(locale, slot.format === "weekday" ? { weekday: "long", timeZone: "Africa/Tunis" } : { day: "numeric", month: slot.format === "short" ? "numeric" : "long", year: slot.format === "short" ? "2-digit" : "numeric", timeZone: "Africa/Tunis" }).format(date) : details.date;
  }
  if (slot.field === "time" && details.time) {
    const time = new Date(`2000-01-01T${details.time}:00+01:00`);
    return Number.isFinite(time.getTime()) ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Tunis" }).format(time) : details.time;
  }
  return details[slot.field] || "";
}

function FittedText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const box = element?.parentElement;
    if (!element || !box) return;
    let active = true;
    const fit = () => {
      if (!active) return;
      element.style.fontSize = "";
      const maximum = Number.parseFloat(getComputedStyle(element).fontSize);
      const style = getComputedStyle(box);
      const width = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const height = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (width <= 0 || height <= 0) return;
      // Measure both dimensions, including wrapped lines, at the actual card size.
      let low = 1;
      let high = maximum;
      for (let step = 0; step < 12; step++) {
        const size = (low + high) / 2;
        element.style.fontSize = `${size}px`;
        if (element.scrollWidth <= width && element.getBoundingClientRect().height <= height) low = size;
        else high = size;
      }
      element.style.fontSize = `${low}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    void document.fonts.ready.then(fit);
    return () => { active = false; observer.disconnect(); };
  }, [text]);
  return <span ref={ref} dir="auto">{text}</span>;
}

/** Live text sits in the original artwork's field positions, above its animation. */
export default function InvitationArtworkText({ image, details, locale, caption = false }: Props) {
  const key = image.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
  const certificate = key.includes("certificate") || key.includes("weekly-star");
  const slots = invitationTextLayouts[key];
  const [paper, setPaper] = useState<{ image: string; colours: string[] } | null>(null);

  useEffect(() => {
    if (!slots || caption) return;
    let cancelled = false;
    const source = new Image();
    source.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = source.naturalWidth; canvas.height = source.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context || cancelled) return;
      context.drawImage(source, 0, 0);
      const colours = slots.map((slot) => {
        if (slot.background) return slot.background;
        const [x, y, w, h] = slot.box;
        const area = context.getImageData(Math.floor(x / 100 * canvas.width), Math.floor(y / 100 * canvas.height), Math.max(1, Math.floor(w / 100 * canvas.width)), Math.max(1, Math.floor(h / 100 * canvas.height)));
        const bins = new Map<number, { count: number; r: number; g: number; b: number }>();
        for (let i = 0; i < area.data.length; i += 16) {
          const r = area.data[i], g = area.data[i + 1], b = area.data[i + 2];
          const bin = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
          const entry = bins.get(bin) || { count: 0, r: 0, g: 0, b: 0 };
          entry.count++; entry.r += r; entry.g += g; entry.b += b; bins.set(bin, entry);
        }
        const dominant = [...bins.values()].sort((a, b) => b.count - a.count)[0];
        return dominant ? `rgb(${Math.round(dominant.r / dominant.count)},${Math.round(dominant.g / dominant.count)},${Math.round(dominant.b / dominant.count)})` : "var(--paper)";
      });
      if (!cancelled) setPaper({ image, colours });
    };
    source.src = image;
    return () => { cancelled = true; source.onload = null; };
  }, [image, slots, caption]);

  const personalisedName = (details.couple || details.name || "").trim();
  // Very long names need a readable line below the artwork rather than tiny type.
  const longName = Array.from(personalisedName).length > 80;
  const captionName = captionNameDesigns.has(key) || longName;
  const captionAge = image.includes("/birthdays/") && Boolean(details.age?.trim());
  if (caption) {
    const name = (details.couple || details.name || "").trim();
    if (!(captionName && name) && !captionAge) return null;
    return <div className="inviteArtworkCaption" dir="auto">
      {captionName && name && <strong style={longName ? { fontSize: "18px" } : undefined}>{name}</strong>}
      {captionAge && <span>{details.age}</span>}
    </div>;
  }

  if (!slots || paper?.image !== image) return null;
  return <div className="inviteArtworkText">
    {slots.map((slot, index) => {
      // Dates and times have dedicated live sections, clear of the printed artwork.
      if (!certificate && slot.field !== "name" && slot.field !== "age") return null;
      if ((slot.field === "name" && captionName && !longName) || (slot.field === "age" && image.includes("/birthdays/"))) return null;
      const text = slot.field === "name" && longName ? "" : fieldValue(slot, details, locale);
      const hasName = Boolean(details.couple?.trim() || details.name?.trim());
      if (!text.trim() && !(slot.field === "name" && (longName || hasName && slot.part !== undefined))) return null;
      const arabic = /[\u0600-\u06ff]/.test(text);
      const font = slot.font === "sans" ? "sans" : arabic ? "arabic" : slot.font === "arabic" ? "serif" : slot.font || "serif";
      const [left, top, width, height] = slot.box;
      const style = { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, "--field-paper": paper.colours[index], "--field-ink": slot.color || "var(--ink)", "--field-size": `${slot.size}cqw`, textAlign: slot.align || "center", textTransform: slot.uppercase ? "uppercase" : undefined } as CSSProperties;
      return <div key={index} className={`inviteArtworkField artworkFont-${font}`} style={style} data-field={slot.field}>
        <FittedText text={text} />
      </div>;
    })}
  </div>;
}
