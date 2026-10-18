import sharp from "sharp";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { invitationTextLayouts } from "../src/invitationTextLayouts.ts";

const root=fileURLToPath(new URL("../",import.meta.url));
const publicRoot=join(root,"public");
const output=join(publicRoot,"optimized");
await mkdir(output,{recursive:true});
const files=[];
async function walk(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    if(entry.name==="optimized")continue;
    const path=join(directory,entry.name);
    if(entry.isDirectory())await walk(path);
    else if(/\.(png|jpe?g|jfif|webp)$/i.test(entry.name))files.push(path);
  }
}
await walk(publicRoot);
const assets={};
let before=0,after=0,cursor=0;
await Promise.all(Array.from({length:4},async()=>{
  while(cursor<files.length){
    const path=files[cursor++];
    const source=await readFile(path);
    if(source.length<12000)continue;
    const encoded=await sharp(source).rotate().resize({width:1600,height:1800,fit:"inside",withoutEnlargement:true}).webp({quality:88,alphaQuality:95,effort:5}).toBuffer();
    if(encoded.length>source.length*.9)continue;
    const hash=createHash("sha256").update(encoded).digest("hex").slice(0,12);
    const filename=`${basename(path,extname(path))}-${hash}.webp`;
    await writeFile(join(output,filename),encoded);
    assets[`/${relative(publicRoot,path).replaceAll("\\","/")}`]=`/optimized/${filename}`;
    before+=source.length;after+=encoded.length;
  }
}));
const colours={};
for(const [key,slots] of Object.entries(invitationTextLayouts)){
  const path=files.find(path=>basename(path)===`${key}.jfif`);
  if(!path)continue;
  const {data,info}=await sharp(path).resize({width:480,withoutEnlargement:true}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  colours[key]=slots.map(slot=>{
    if(slot.background)return slot.background;
    const [x,y,w,h]=slot.box;
    const bins=new Map();
    for(let row=Math.floor(y/100*info.height);row<Math.min(info.height,(y+h)/100*info.height);row+=2){
      for(let col=Math.floor(x/100*info.width);col<Math.min(info.width,(x+w)/100*info.width);col+=2){
        const i=(row*info.width+col)*info.channels;
        const r=data[i],g=data[i+1],b=data[i+2];
        const bin=(r>>4)*256+(g>>4)*16+(b>>4);
        const entry=bins.get(bin)||{count:0,r:0,g:0,b:0};
        entry.count++;entry.r+=r;entry.g+=g;entry.b+=b;bins.set(bin,entry);
      }
    }
    const dominant=[...bins.values()].sort((a,b)=>b.count-a.count)[0];
    return dominant?`rgb(${Math.round(dominant.r/dominant.count)},${Math.round(dominant.g/dominant.count)},${Math.round(dominant.b/dominant.count)})`:"var(--paper)";
  });
}
await writeFile(join(root,"src/optimizedAssets.json"),JSON.stringify(Object.fromEntries(Object.entries(assets).sort()),null,2)+"\n");
await writeFile(join(root,"src/invitationArtworkColours.json"),JSON.stringify(colours,null,2)+"\n");
console.log(JSON.stringify({images:Object.keys(assets).length,originalBytes:before,optimizedBytes:after,savedPercent:Math.round((1-after/before)*100),textPalettes:Object.keys(colours).length}));
