import { useEffect, useId, useRef } from "react";

const SOURCE = "/invitations/others/kindergarten-welcome.png";

/** The original illustration is clipped into separate character layers. */
export default function CharacterInvitation({ title, paused }: { title: string; paused: boolean }) {
  const id = useId().replaceAll(":", "");
  const scene = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = scene.current;
    if (!element) return;
    const eyes = [...element.querySelectorAll<SVGGElement>(".characterGaze")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const reset = () => eyes.forEach((eye) => eye.setAttribute("transform", "translate(0 0)"));
    if (paused) { reset(); return; }
    const move = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType === "touch") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = element.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / (box.width / 2)));
        const y = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height * .6) / (box.height / 2)));
        eyes.forEach((eye) => eye.setAttribute("transform", `translate(${x * 3} ${y * 2.5})`));
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", reset);
    };
  }, [paused]);
  return <svg ref={scene} className="characterInvitation" viewBox="0 0 736 920" role="img" aria-label={`${title}: animated children illustration`}>
    <defs>
      <clipPath id={`${id}-text`}><rect width="736" height="440" /></clipPath>
      <clipPath id={`${id}-background`}><rect width="736" height="700" /></clipPath>
      <clipPath id={`${id}-book`}><path d="M0 767L46 761L100 775L159 795L205 823L230 801L305 759L383 730L453 710L478 705L527 714L604 745L669 777L727 809L736 920L0 920Z" /></clipPath>
      <clipPath id={`${id}-boy`}><path d="M18 699L26 690L48 685L148 675L170 663L167 650L150 626L131 600L126 570L130 540L144 519L174 503L204 496L240 493L270 503L283 500L296 492L303 505L289 515L304 540L307 562L306 577L314 592L305 616L288 636L302 630L329 628L359 638L372 651L368 666L386 675L389 686L376 687L385 706L391 730L356 744L321 759L285 774L242 791L218 825L194 815L186 795L193 774L201 753L195 718L164 716L161 710L116 710L72 712L45 707L37 700Z" /></clipPath>
      <clipPath id={`${id}-girl`}><path d="M422 716L432 678L438 641L425 621L415 609L410 589L414 569L417 552L411 531L412 505L420 482L436 465L459 458L469 446L492 442L518 445L549 460L574 480L587 499L594 494L600 509L617 524L634 548L642 574L636 591L620 605L611 613L637 627L651 646L662 663L670 690L669 714L658 740L640 751L612 757L586 746L563 739L539 733L513 726L485 718L460 714Z" /></clipPath>
    </defs>
    <rect width="736" height="920" fill="#fff0ea" />
    <rect y="900" width="736" height="20" fill="#8b80a5" />
    <image href="/invitations/others/kindergarten-motion-background.png" width="736" height="920" preserveAspectRatio="none" clipPath={`url(#${id}-background)`} />
    <image href={SOURCE} width="736" height="920" clipPath={`url(#${id}-text)`} />
    <g className="characterBookGroup">
    <g className="characterBoy">
      <image href={SOURCE} width="736" height="920" clipPath={`url(#${id}-boy)`} />
      <g className="characterEyes">
        <ellipse cx="185" cy="605" rx="10" ry="12" fill="#fff9f1" transform="rotate(-27 185 605)" />
        <ellipse cx="230" cy="590" rx="12" ry="14" fill="#fff9f1" transform="rotate(-12 230 590)" />
        <g className="characterGaze"><ellipse cx="185" cy="607" rx="7" ry="9" fill="#292333" /><ellipse cx="230" cy="592" rx="8" ry="10" fill="#292333" /><circle cx="182" cy="603" r="2.3" fill="white" /><circle cx="227" cy="587" r="2.7" fill="white" /></g>
      </g>
    </g>
    <g className="characterGirl">
      <image href={SOURCE} width="736" height="920" clipPath={`url(#${id}-girl)`} />
      <g className="characterEyes">
        <ellipse cx="454" cy="552" rx="11" ry="13" fill="#fff9f1" transform="rotate(16 454 552)" />
        <ellipse cx="497" cy="541" rx="11" ry="13" fill="#fff9f1" />
        <g className="characterGaze"><ellipse cx="454" cy="553" rx="7.5" ry="10" fill="#292333" /><ellipse cx="497" cy="542" rx="7.5" ry="10" fill="#292333" /><circle cx="451" cy="548" r="2.6" fill="white" /><circle cx="494" cy="537" r="2.6" fill="white" /></g>
      </g>
    </g>
    <image href={SOURCE} width="736" height="920" clipPath={`url(#${id}-book)`} />
    </g>
  </svg>;
}
