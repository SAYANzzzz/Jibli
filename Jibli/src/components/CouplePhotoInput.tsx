import { useState } from "react";
import BirthdayPhotoInput from "./BirthdayPhotoInput";
import { coupleDesignKey, couplePhotoDetails, couplePhotoFields, hasCouplePhotos } from "../couplePersonalisation";

export default function CouplePhotoInput({image,details,onChange,onBusyChange,disabled=false}:{image:string;details:Record<string,string>;onChange:(fields:Record<string,string>)=>void;onBusyChange?:(busy:boolean)=>void;disabled?:boolean}) {
  const [busy,setBusy]=useState(false);
  const topAligned=["illustrated-photo","photo-frame"].includes(coupleDesignKey(image));
  if(!hasCouplePhotos(image))return null;
  return <div className="couplePhotoInputs">{couplePhotoFields(image).map((field,index)=>{
    const shared=field==="couplePhoto";
    return <BirthdayPhotoInput key={field} details={couplePhotoDetails(details,field,topAligned)} disabled={disabled||busy} onBusyChange={value=>{setBusy(value);onBusyChange?.(value);}}
      legend={shared?"Couple photo (optional)":index===0?"First partner photo (optional)":"Second partner photo (optional)"}
      uploadLabel={shared?"Upload couple photo":index===0?"Upload first partner photo":"Upload second partner photo"}
      description={shared?"Choose a photo of you together. It replaces the sample photo; adjust the crop in the preview.":"Choose a clear portrait of one partner. We remove its background and blend it into the design. Adjust each portrait separately."}
      removeBackground={!shared}
      onChange={fields=>{
        const prepared=fields.birthdayPhoto&&topAligned?{...fields,birthdayPhotoY:"0"}:fields;
        onChange(Object.fromEntries(Object.entries(prepared).map(([key,value])=>[key.replace("birthdayPhoto",field),value])));
      }} />;
  })}</div>;
}
