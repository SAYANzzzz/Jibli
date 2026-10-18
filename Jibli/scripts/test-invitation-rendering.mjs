import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolveInvitationImage, invitationIsCertificate } from "../src/invitationTemplates.ts";
import { invitationTextLayouts } from "../src/invitationTextLayouts.ts";
import { invitationBootstrap } from "../api/invitation.mjs";
const source=await readFile(new URL("../src/invitationTemplates.ts",import.meta.url),"utf8");
const images=[...source.matchAll(/image["']?: ["'](\/invitations\/[^"']+\.jfif)["']/g)].map(match=>match[1]);
assert.equal(images.length,40);
for(const path of images) {
 assert.equal(resolveInvitationImage({image:path.replace(".jfif",".png"),title:"Test"}),path);
 assert.equal(invitationIsCertificate(path,true),/certificate|weekly-star/.test(path));
 assert.equal(invitationIsCertificate(path,false),/certificate|weekly-star/.test(path));
 assert(invitationTextLayouts[path.split("/").at(-1).replace(".jfif","")]);
}
const custom="https://example.invalid/final.png";
assert.equal(resolveInvitationImage({image:custom,title:"Wedding"}),custom);
assert.equal(invitationIsCertificate(custom,true),true);
const invitation={title:"Test",details:{name:"</script><img src=x>&\u2028"}};
const bootstrap=invitationBootstrap(invitation,"test-token");
assert(!bootstrap.includes("<img"));
const payload=JSON.parse(bootstrap.replace(/^.*?>/,"").replace(/<\/script>$/,""));
assert.deepEqual(payload,{token:"test-token",invitation});
assert.equal(invitationBootstrap(null,"x"),"");
console.log("PASS: canonical artwork, all template types, custom artwork, safely escaped bootstrap.");
