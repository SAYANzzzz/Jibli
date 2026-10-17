import { useState } from "react";
import { apiFetch } from "../api";
import { useCommerceCopy } from "../i18n/commerceCopy";

export default function BirthdayPhotoInput({details,onChange,onBusyChange,disabled=false}:{details:Record<string,string>;onChange:(fields:Record<string,string>)=>void;onBusyChange?:(busy:boolean)=>void;disabled?:boolean}) {
  const copy=useCommerceCopy();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  return <fieldset className="venuePhotoUpload birthdayPhotoUpload" disabled={busy||disabled}>
    <legend>{copy("Birthday photo (optional)")}</legend>
    <p>{copy("Your photo replaces the child in this design. Adjust the crop in the preview. A portrait with a plain background works best.")}</p>
    <label>{copy("Upload birthday photo")}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={async event=>{
      const file=event.target.files?.[0];event.target.value="";if(!file)return;
      setError("");
      if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){setError(copy("Choose a JPG, PNG or WebP photo, no larger than 5 MB."));return;}
      setBusy(true);onBusyChange?.(true);
      try {
        const body=new FormData();body.append("image",file);
        const result=await apiFetch("/invitations/photos",{method:"POST",body});
        onChange({birthdayPhoto:result.url,birthdayPhotoX:"50",birthdayPhotoY:"50",birthdayPhotoZoom:"1"});
      } catch(cause){setError(cause instanceof Error?cause.message:copy("Could not upload photos. Try again."));}
      finally{setBusy(false);onBusyChange?.(false);}
    }}/></label>
    {busy&&<p role="status">{copy("Uploading photos…")}</p>}
    {error&&<p role="alert">{error}</p>}
    {details.birthdayPhoto&&<>
      <img className="birthdayPhotoThumbnail" src={details.birthdayPhoto} alt={copy("Birthday photo (optional)")} />
      {([['birthdayPhotoZoom','Photo zoom','1','3','0.05','1'],['birthdayPhotoX','Photo horizontal position','0','100','1','50'],['birthdayPhotoY','Photo vertical position','0','100','1','50']] as const).map(([key,label,min,max,step,fallback])=><label key={key}>{copy(label)}<input type="range" min={min} max={max} step={step} value={details[key]??fallback} onChange={event=>onChange({[key]:event.target.value})}/></label>)}
      <button type="button" className="outlineBtn" onClick={()=>onChange({birthdayPhoto:"",birthdayPhotoX:"50",birthdayPhotoY:"50",birthdayPhotoZoom:"1"})}>{copy("Remove photo")}</button>
    </>}
  </fieldset>;
}
