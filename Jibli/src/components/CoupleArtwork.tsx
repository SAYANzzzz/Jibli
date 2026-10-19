import { useEffect, useId, useState } from "react";
import { coupleDesignKey, type CouplePhotoField } from "../couplePersonalisation";
import { prepareBirthdayPhoto } from "../birthdayPhotoCutout";
import { optimizedImage } from "../optimizedImage";

type Box = [number,number,number,number];
function Portrait({field,box,details,ratio,framed=false,shared=false}:{field:CouplePhotoField;box:Box;details:Record<string,string>;ratio:number;framed?:boolean;shared?:boolean}) {
  const source=details[field];
  const [ready,setReady]=useState({source:"",url:"",ratio:1});
  const id=useId().replaceAll(":","");
  useEffect(()=>{
    if(!source)return;
    let cancelled=false,objectUrl="";
    const load=async()=>{
      const url=shared?source:URL.createObjectURL(await prepareBirthdayPhoto(source));
      if(!shared)objectUrl=url;
      if(cancelled){if(objectUrl)URL.revokeObjectURL(objectUrl);return;}
      const picture=new Image();picture.src=url;
      await picture.decode();
      if(!cancelled)setReady({source,url,ratio:picture.naturalWidth/picture.naturalHeight});
    };
    void load().catch(()=>{if(!cancelled)setReady({source,url:"",ratio:1});});
    return()=>{cancelled=true;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[source,shared]);
  const [x,y,w,h]=box;
  const photo=ready.source===source?ready.url:"";
  const zoom=Math.max(1,Math.min(3,Number(details[`${field}Zoom`])||1));
  const px=Math.max(0,Math.min(100,Number(details[`${field}X`]??"50")));
  const py=Math.max(0,Math.min(100,Number(details[`${field}Y`]??(framed?"0":"50"))));
  const targetRatio=w*ratio/h;
  const fit=shared||framed?Math.max:Math.min;
  const width=fit(100,100*ready.ratio/targetRatio)*zoom;
  const height=fit(100,100*targetRatio/ready.ratio)*zoom;
  return <svg x={x} y={y} width={w} height={h} style={{width:w,height:h}} viewBox="0 0 100 100" preserveAspectRatio="none" overflow="hidden" data-couple-slot={field} aria-busy={!!source&&!photo}>
    <defs><linearGradient id={`${id}-fade`} x2="0" y2="1"><stop offset="0" stopColor="white"/><stop offset=".94" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient><mask id={`${id}-matte`} maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill={`url(#${id}-fade)`}/></mask></defs>
    {framed&&<rect width="100" height="100" fill="#ece5d5"/>}
    {photo&&<g mask={!framed&&!shared?`url(#${id}-matte)`:undefined}><image data-couple-portrait={field} href={photo} x={(100-width)*px/100} y={(100-height)*py/100} width={width} height={height} preserveAspectRatio="none" style={{filter:shared?undefined:"saturate(.85) contrast(.98)"}}/></g>}
  </svg>;
}

export default function CoupleArtwork({image,title,details}:{image:string;title:string;details:Record<string,string>}) {
  const key=coupleDesignKey(image);
  const id=useId().replaceAll(":","");
  const stationery=optimizedImage(image.replace(/\.[^.]+$/,"-stationery.png"));
  const illustrated=key==="illustrated-photo";
  const childhood=key==="childhood-love";
  const garden=key==="garden-couple";
  const shared=key==="intimate-vows";
  const ratio=childhood?675/1200:illustrated?736/1037:2/3;
  const boxes:Box[]=illustrated?[[29.6,36.1,15.4,9.3],[55.7,36.6,15.7,9.3]]:childhood?[[6,54,43,41],[52,51,44,44]]:garden?[[72,72,14,27],[85,72,14,27]]:[[34,53,14,10],[53,53,14,10]];
  return <svg className="couplePersonalisedArtwork" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={title} data-couple-design={key} data-artwork-ratio={ratio}>
    <defs>
      <linearGradient id={`${id}-top`} x2="0" y2="1"><stop offset=".46" stopColor="white"/><stop offset=".50" stopColor="black"/></linearGradient>
      <mask id={`${id}-original-top`}><rect width="100" height="100" fill={`url(#${id}-top)`}/></mask>
      <clipPath id={`${id}-heart`}><path d="M42 45 Q42 42 50 44 Q56 42 59 46 Q61 48 50 54 Q42 49 42 45Z"/></clipPath>
      <clipPath id={`${id}-garden`}><rect x="72" y="70" width="28" height="30"/></clipPath>
    </defs>
    <image href={childhood||shared?stationery:optimizedImage(image)} width="100" height="100" preserveAspectRatio="none"/>
    {childhood&&<><image href={optimizedImage(image)} width="100" height="100" preserveAspectRatio="none" mask={`url(#${id}-original-top)`}/><image href={optimizedImage(image)} width="100" height="100" preserveAspectRatio="none" clipPath={`url(#${id}-heart)`}/></>}
    {garden&&<image href={stationery} width="100" height="100" preserveAspectRatio="none" clipPath={`url(#${id}-garden)`}/>}
    {shared?<><Portrait field="couplePhoto" box={[0,0,100,100]} details={details} ratio={ratio} shared/><rect width="100" height="100" fill="#211a15" opacity=".3"/></>:
      boxes.map((box,index)=><Portrait key={index} field={index===0?"partnerPhoto1":"partnerPhoto2"} box={box} details={details} ratio={ratio} framed={illustrated||key==="photo-frame"}/>)}
  </svg>;
}
