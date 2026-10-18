const origin = "https://www.jiblitunisia.com";
export function searchStructuredData(path, page) {
  const canonical = origin + path;
  const graph = [
      { "@type":"Organization", "@id":origin+"/#organization", name:"Jibli", url:origin+"/", logo:origin+"/Logo.png", areaServed:{"@type":"Country",name:"Tunisia"}, email:"jiblitunisia@gmail.com", contactPoint:{"@type":"ContactPoint",telephone:"+21692001397",contactType:"customer support",availableLanguage:["English","French","Arabic"]}, sameAs:["https://www.instagram.com/jibli.tunisia"] },
      { "@type":"WebSite", "@id":origin+"/#website", name:"Jibli Tunisia", alternateName:"Jibli", url:origin+"/", publisher:{"@id":origin+"/#organization"} },
      { "@type":"WebPage", "@id":canonical+"#webpage", name:page.title, description:page.description, url:canonical, inLanguage:page.language || "en", isPartOf:{"@id":origin+"/#website"}, about:{"@id":origin+"/#organization"} }
    ];
    if(path!=="/" && page.basePath!=="/") {
      const prefix=page.language && page.language!=="en"?`/${page.language}`:"";
      const home=prefix || "/";
      const homeLabel=page.language==="fr"?"Accueil":page.language==="ar"?"الرئيسية":"Home";
      const invitationsLabel=page.language==="fr"?"Invitations digitales":page.language==="ar"?"الدعوات الرقمية":"Digital invitations";
      const ancestors=page.basePath?.startsWith("/invitations/")?[[home,homeLabel],[prefix+"/invitations",invitationsLabel],[path,page.label]]:path===home?[[home,homeLabel]]:[[home,homeLabel],[path,page.label]];
      graph.push({"@type":"BreadcrumbList",itemListElement:ancestors.map(([url,name],index)=>({"@type":"ListItem",position:index+1,name,item:origin+url}))});
    }
  return {"@context":"https://schema.org","@graph":graph};
}
