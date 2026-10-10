import { useCommerceCopy } from "../i18n/commerceCopy";
import { useState } from "react";

export default function DeliveryContent({ content }: { content: string }) {
  const copy = useCommerceCopy();
  const [notice, setNotice] = useState("");
  const links = content.match(/https?:\/\/[^\s<>]+|\/invite\/[a-f0-9]{32}/g) || [];
  return <div className="d17Delivery"><h3>{copy("Your delivery")} </h3><p className="d17Details">{content}</p>
    <div className="d17Actions">{[...new Set(links)].map((url) => <a key={url} className="outlineBtn" href={url} target="_blank" rel="noreferrer">{copy("Open delivery")} </a>)}<button type="button" className="outlineBtn" onClick={async () => { try { await navigator.clipboard.writeText(content.startsWith("/invite/") ? new URL(content, location.origin).href : content); setNotice("Copied"); } catch { setNotice("Select the delivery text to copy it."); } }}>{copy("Copy delivery")} </button></div><span role="status">{copy(notice)}</span>
  </div>;
}
