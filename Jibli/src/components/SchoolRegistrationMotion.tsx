import { useEffect, useId, useRef } from "react";

const SOURCE = "/invitations/others/school-registration.jfif";
const PARTS = [
  // Original children, including the toys they are holding.
  ["flying-boy", "M361 611L382 592L415 602L453 570L454 534L441 510L426 472L400 421L405 390L375 355L371 332L390 329L381 313L387 299L402 311L405 293L415 293L429 318L437 284L475 272L516 268L544 273L577 286L596 311L604 339L601 368L595 392L596 415L616 415L628 407L649 420L666 418L686 437L697 458L706 477L699 495L682 502L645 517L635 547L637 588L627 611L628 650L648 666L657 694L642 711L616 716L591 703L580 678L577 641L564 615L551 624L536 621L525 606L502 608L488 594L456 613L425 633L400 651L381 658L368 637Z"],
  ["flying-girl", "M0 734L18 743L48 738L67 730L98 735L116 700L112 682L117 653L125 633L121 613L118 590L127 574L149 567L174 567L198 576L211 605L237 619L257 641L270 664L273 690L265 713L274 719L293 686L305 679L313 689L322 681L330 690L324 707L335 710L335 727L318 740L288 759L249 778L218 810L201 846L174 863L162 902L148 940L117 964L89 975L79 994L61 1008L48 1000L44 976L42 948L25 974L21 1000L9 1027L0 1029Z"],
  ["kneeling-boy", "M74 1190L82 1167L89 1133L102 1097L128 1067L155 1050L158 1030L142 1016L144 1002L166 986L185 975L197 958L221 953L251 956L272 969L284 991L287 1017L279 1035L269 1060L248 1084L240 1113L241 1141L258 1176L277 1195L277 1209L263 1217L245 1212L223 1202L201 1212L171 1206L148 1209L126 1217L109 1224L89 1222L75 1210Z"],
  ["seated-girl-and-teddy", "M280 1186L292 1157L313 1125L301 1123L294 1112L298 1095L317 1079L328 1058L330 1046L322 1027L329 1000L348 976L370 963L400 961L422 972L435 990L442 1010L436 1036L437 1050L450 1048L461 1060L455 1079L444 1090L453 1114L460 1137L456 1159L464 1177L462 1192L445 1210L416 1224L379 1237L363 1230L352 1211L318 1214L291 1203Z"],
  ["standing-boy-and-boat", "M469 886L479 865L501 852L515 834L537 827L557 830L573 825L585 832L589 848L597 867L600 890L597 914L586 932L610 936L628 951L643 980L650 1012L657 1049L662 1083L661 1121L660 1148L660 1181L670 1198L662 1209L637 1214L618 1206L612 1188L611 1150L588 1148L581 1183L564 1194L547 1185L543 1163L542 1122L542 1095L547 1074L528 1067L506 1063L486 1062L476 1052L480 1042L496 1035L491 1018L489 1001L496 992L510 995L528 1003L535 984L526 962L506 955L487 939L479 919L474 904Z"],
  ["toy-box-and-plane", "M444 1204L447 1177L463 1164L461 1124L475 1120L468 1104L477 1095L487 1102L495 1081L508 1074L519 1094L523 1103L542 1091L558 1095L562 1111L575 1080L590 1082L600 1092L599 1116L607 1124L599 1157L600 1180L619 1185L628 1196L627 1214L599 1220L576 1227L546 1231L515 1224L483 1225L466 1230L445 1224Z"],
  ["toy-car", "M137 1209L146 1194L159 1183L192 1182L206 1191L230 1196L241 1204L243 1216L231 1224L209 1226L190 1228L174 1223L160 1229L143 1225L135 1217Z"],
  ["building-blocks", "M237 1131L241 1108L247 1108L246 1086L269 1084L274 1105L290 1104L291 1094L308 1094L313 1109L309 1128L313 1152L290 1155L288 1137L239 1148Z"],
] as const;

// The flying boy's smiling eyes are closed; only visible open eyes track the pointer.
const EYES = [
  ["flying-girl-left",179,699,10,14,15], ["flying-girl-right",231,712,10,14,15],
  ["kneeling-boy-left",221,1021,9,8,25], ["kneeling-boy-right",253,1040,8,8,25],
  ["seated-girl-left",386,1019,11,12,-10], ["seated-girl-right",419,1012,9,11,-10],
  ["standing-boy",517,921,8,6,40],
] as const;

export default function SchoolRegistrationMotion({ title, paused = false }: { title: string; paused?: boolean }) {
  const id = useId().replaceAll(":", "");
  const scene = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = scene.current;
    if (!element || paused) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const eyes = [...element.querySelectorAll<SVGGElement>(".schoolEye")];
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      eyes.forEach((eye) => eye.querySelector(".schoolPupil")?.setAttribute("transform", "translate(0 0)"));
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType === "touch") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        eyes.forEach((eye) => {
          const matrix = eye.getScreenCTM();
          if (!matrix) return;
          const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
          const dx = point.x - Number(eye.dataset.x);
          const dy = point.y - Number(eye.dataset.y);
          const distance = Math.max(80, Math.hypot(dx, dy));
          eye.querySelector(".schoolPupil")?.setAttribute("transform", `translate(${dx / distance * 3} ${dy / distance * 2.5})`);
        });
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", reset);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", reset);
    };
  }, [paused]);
  return <svg ref={scene} className="schoolRegistrationMotion" viewBox="0 0 736 1309" role="img" aria-label={`${title}: floating children whose eyes follow your cursor`}>
    <defs>
      {PARTS.map(([name, path]) => <clipPath key={name} id={`${id}-${name}`}><path d={path} /></clipPath>)}
      {EYES.map(([name,x,y,rx,ry,angle]) => <clipPath key={name} id={`${id}-eye-${name}`}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${angle} ${x} ${y})`} />
      </clipPath>)}
      <mask id={`${id}-still`} maskUnits="userSpaceOnUse" x="0" y="0" width="736" height="1309">
        <rect width="736" height="1309" fill="white" />
        {PARTS.map(([name,path]) => <path key={name} d={path} fill="black" stroke="black" strokeWidth="12" strokeLinejoin="round" />)}
      </mask>
    </defs>
    <image href="/invitations/others/school-registration-motion-background.png" width="736" height="1309" preserveAspectRatio="none" />
    <image href={SOURCE} width="736" height="1309" mask={`url(#${id}-still)`} />
    <g className="schoolFloatingPart" style={{ animationPlayState: paused ? "paused" : undefined }}>
      {PARTS.map(([name]) => <g key={name} data-part={name}>
        <image href={SOURCE} width="736" height="1309" clipPath={`url(#${id}-${name})`} />
      </g>)}
      {EYES.map(([name,x,y,rx,ry,angle]) => <g key={name} className="schoolEye" data-eye={name} data-x={x} data-y={y} clipPath={`url(#${id}-eye-${name})`}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fffaf2" transform={`rotate(${angle} ${x} ${y})`} />
        <g className="schoolPupil">
          <ellipse cx={x} cy={y} rx={rx * .73} ry={ry * .8} fill="#332b2c" transform={`rotate(${angle} ${x} ${y})`} />
          <circle cx={x-2} cy={y-3} r={Math.min(rx,ry)*.25} fill="white" />
        </g>
      </g>)}
    </g>
  </svg>;
}
