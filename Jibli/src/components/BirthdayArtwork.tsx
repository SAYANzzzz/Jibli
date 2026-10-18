import { useEffect, useId, useState } from "react";
import { birthdayDesignKey, birthdayLayouts } from "../birthdayPersonalisation";
import { optimizedImage } from "../optimizedImage";

export default function BirthdayArtwork({ image, title, details }: { image:string; title:string; details:Record<string,string> }) {
  const id=useId().replaceAll(":", "");
  const key=birthdayDesignKey(image);
  const layout=birthdayLayouts[key];
  const photo=details.birthdayPhoto;
  const [dimensions,setDimensions]=useState({url:"",ratio:1});
  useEffect(()=>{
    if(!photo)return;
    let cancelled=false;
    const source=new Image();
    source.onload=()=>{if(!cancelled&&source.naturalHeight)setDimensions({url:photo,ratio:source.naturalWidth/source.naturalHeight});};
    source.src=photo;
    return()=>{cancelled=true;source.onload=null;};
  },[photo]);
  if(!layout) return <img src={image} alt={title} />;
  const age=/^\d{1,3}$/.test(details.age || "") ? details.age : "";
  const background=optimizedImage(photo ? `/invitations/birthdays/${key}-photo-template.png` : age && layout.ages.length ? `/invitations/birthdays/${key}-age-template.png` : image);
  const [x,y,w,h]=layout.portrait;
  const zoom=Math.max(1,Math.min(3,Number(details.birthdayPhotoZoom)||1));
  const offsetX=Math.max(0,Math.min(100,Number(details.birthdayPhotoX ?? "50")));
  const offsetY=Math.max(0,Math.min(100,Number(details.birthdayPhotoY ?? "50")));
  const [tx,ty,tw,th]=layout.texture;
  const eraseBoxes=layout.ages.map(({box})=>key==="disco-eighteen"?[60,47,39,27]:box);
  const ratio = key==="pink-night" ? 735/1041 : key==="tiffs-party" ? 735/1105 : key==="cool-kid" ? 736/1030 : key==="silver-fourteen" ? 736/1308 : 675/1200;
  const portraitRatio=w*ratio/h;
  const photoRatio=dimensions.url===photo?dimensions.ratio:portraitRatio;
  const photoWidth=Math.max(100,100*photoRatio/portraitRatio)*zoom;
  const photoHeight=Math.max(100,100*portraitRatio/photoRatio)*zoom;
  return <svg className="birthdayPersonalisedArtwork" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={title} data-birthday-design={key} data-artwork-ratio={ratio}>
    <defs>
      <clipPath id={`${id}-portrait`}><path d={layout.silhouette} /></clipPath>
      <clipPath id={`${id}-foreground`}><path d={layout.foreground || ""} /></clipPath>
      <mask id={`${id}-without-ages`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="white"/>{age&&eraseBoxes.map(([ax,ay,aw,ah],i)=><rect key={i} x={ax} y={ay} width={aw} height={ah} fill="black"/>)}</mask>
      <clipPath id={`${id}-birthday-title`}><rect x="0" y="72" width="76" height="9"/></clipPath>
      <pattern id={`${id}-paper`} width={tw} height={th} patternUnits="userSpaceOnUse" viewBox={`${tx} ${ty} ${tw} ${th}`}><image href={image.replace(/\.[^.]+$/, "-stationery.png")} width="100" height="100" preserveAspectRatio="none" /></pattern>
    </defs>
    <image href={background} width="100" height="100" preserveAspectRatio="none" />
    {/* Erase only printed ages; the portrait and foreground are restored above. */}
    {age && photo && eraseBoxes.map(([ax,ay,aw,ah],i)=><rect key={i} x={ax} y={ay} width={aw} height={ah} fill={`url(#${id}-paper)`} />)}
    <g clipPath={`url(#${id}-portrait)`}>
      {photo ? <>
        <path d={layout.silhouette} fill={layout.paper}/>
        <svg x={x} y={y} width={w} height={h} style={{width:w,height:h}} viewBox="0 0 100 100" preserveAspectRatio="none" overflow="hidden">
          <image href={photo} x={-(photoWidth-100)*offsetX/100} y={-(photoHeight-100)*offsetY/100} width={photoWidth} height={photoHeight} preserveAspectRatio="none" style={{filter:layout.filter}} />
        </svg>
      </> : null}
    </g>
    <image href={background} width="100" height="100" preserveAspectRatio="none" clipPath={`url(#${id}-foreground)`} mask={`url(#${id}-without-ages)`}/>
    {key==="disco-eighteen"&&age&&photo&&<image href={optimizedImage(image)} width="100" height="100" preserveAspectRatio="none" clipPath={`url(#${id}-birthday-title)`}/>}
    {age && layout.ages.map(({box:[ax,ay,aw,ah],rotate=0,style,digit},i)=>{
      const value=digit===undefined?age:age.length===1?(digit===0?age:""):digit===0?age.slice(0,-1):age.slice(-1);
      if(!value)return null;
      return <g key={i} data-birthday-age={value} transform={`rotate(${rotate} ${ax+aw/2} ${ay+ah/2})`}>
        {style==="print" ? <text x={ax+aw/2} y={ay+ah*.82} textAnchor="middle" textLength={value.length>1?aw*.9:undefined} lengthAdjust="spacingAndGlyphs" fontFamily="Georgia,serif" fontWeight="700" fontSize={ah*.95} fill="#71162c">{value}</text> : value.split("").map((character,index)=>{
          const number=Number(character);
          const digitWidth=Math.min(aw/value.length,ah*.9);
          const left=ax+(aw-digitWidth*value.length)/2+index*digitWidth;
          return <svg key={index} x={left} y={ay} width={digitWidth} height={ah} style={{width:digitWidth,height:ah}} viewBox={`${number%5*20} ${Math.floor(number/5)*50} 20 50`} preserveAspectRatio="none" overflow="hidden"><image href={optimizedImage(`/invitations/birthdays/balloon-digits-${style}.png`)} width="100" height="100" preserveAspectRatio="none"/></svg>;
        })}
      </g>;
    })}
    {age && key==="disco-eighteen" && <><rect x="67" y="29.2" width="30" height="3.4" fill={`url(#${id}-paper)`}/><text x="82" y="30.5" textAnchor="middle" fontSize="1.65" fill="#71162c" fontFamily="Georgia,serif" fontWeight="700">It’s my birthday!</text><text x="82" y="32" textAnchor="middle" fontSize="1.65" fill="#71162c" fontFamily="Georgia,serif" fontWeight="700">{age}</text></>}
  </svg>;
}
