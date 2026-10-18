import { useEffect, useRef } from "react";
import { invitationMotionProfiles } from "../invitationMotionProfiles";
import { optimizedImage } from "../optimizedImage";

// Local texture deformation moves pixels already in the artwork, without
// duplicating a character or adding unrelated decorative illustrations.
export default function LivingArtwork({ image, title, paused, animate = false, paperTheme = "", onError }: { image: string; title: string; paused: boolean; animate?: boolean; paperTheme?: string; onError?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const key = image.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
    const regions = invitationMotionProfiles[key];
    if (!canvas || !regions || !animate || paused) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    const synchronized = key === "eid-school-welcome";
    const starCertificate = key === "weekly-star-blue";
    const floralWedding = key === "arabesque-burgundy";
    const satinWedding = key === "arabic-satin" || key === "garden-hands" || key === "ring-promise";
    const embossedWedding = key === "blush-embossed";
    const ivoryWedding = key === "garden-couple" || key === "classic-ivory" || key === "photo-frame";
    const photoCharacters = key === "illustrated-photo";
    const tealWedding = key === "teal-love";
    const woodenHeart = key === "childhood-love";
    const vintageBirthday = key === "tiffs-party";
    const floatingPartyDecorations = key === "disco-eighteen" || key === "blue-cake" || vintageBirthday;
    const pinkNight = key === "pink-night";
    const pinkSparkle = key === "pink-sparkle";
    const coolKid = key === "cool-kid";
    const birthdayDisco = key === "birthday-disco";
    const silverFourteen = key === "silver-fourteen";
    const burgundyBow = key === "burgundy-bow";
    const nouveauFlorals = key === "nouveau-florals";
    const greenTradition = key === "green-tradition";
    const familyTree = key === "family-roots";
    const gatheringBrunch = key === "gathering-brunch";
    const pinkCertificate = key === "weekly-star-pink";
    const pinkQuranCertificate = key === "quran-certificate-pink";
    const quranCertificate = key === "quran-certificate-blue" || pinkQuranCertificate;
    const followsCursor = synchronized || pinkCertificate || quranCertificate;
    const eyeDimensions = pinkCertificate ? "vec2(736.,552.)" : quranCertificate ? "vec2(735.,519.)" : "vec2(735.,967.)";
    const regionCount = regions.length;
    let disposed = false;
    let frame = 0;
    let visible = false;
    let textureReady = false;
    let time = 0;
    let previous = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointer = [.5, .5];
    const trackPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch" || pausedRef.current || reduced.matches) return;
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointer = [(event.clientX - bounds.left) / bounds.width, 1 - (event.clientY - bounds.top) / bounds.height];
    };
    const resetPointer = () => { pointer = [.5, .5]; };
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, "attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.)*.5;gl_Position=vec4(p,0.,1.);}");
    const fragment = compile(gl.FRAGMENT_SHADER, `precision mediump float;
      varying vec2 uv; uniform sampler2D artwork; uniform float time; uniform float amount;
      uniform vec4 regions[${regionCount}]; uniform int count; uniform vec2 pointer;
      ${tealWedding ? `
      void outlineEdge(vec2 p,vec2 a,vec2 b,inout float distance,inout float inside){
        vec2 edge=b-a;
        distance=min(distance,length(p-a-edge*clamp(dot(p-a,edge)/dot(edge,edge),0.,1.)));
        if((a.y>p.y)!=(b.y>p.y)){if(p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x){inside=1.-inside;}}
      }
      float coupleMask(vec2 p){float distance=1.;float inside=0.;
      ${[[.255,.39],[.46,.38],[.68,.43],[.70,.56],[.60,.60],[.72,.71],[.64,.78],[.70,.94],[.53,.985],[.23,.99],[.03,.95],[.03,.90],[.15,.77],[.0,.72],[.0,.68],[.12,.55]].map((a,i,points) => {
        const b=points[(i+1)%points.length];
        return `outlineEdge(p,vec2(${a[0].toFixed(3)},${a[1].toFixed(3)}),vec2(${b[0].toFixed(3)},${b[1].toFixed(3)}),distance,inside);`;
      }).join("\n")}
      return inside>0.5 ? 1. : 1.-smoothstep(0.,.008,distance);}
      ` : ""}
      ${followsCursor ? `
      vec2 followEye(vec2 point, vec2 center) {
        vec2 delta=(point-center)/vec2(9.,12.);
        float mask=1.-smoothstep(.65,1.,length(delta));
        vec2 gaze=clamp((pointer*${eyeDimensions}-center)/vec2(140.,160.),vec2(-1.),vec2(1.));
        return mask*gaze*vec2(2.5,2.)*amount;
      }
      ` : ""}
      void main(){vec2 shift=vec2(0.);
        for(int i=0;i<${regionCount};i++){if(i<count){vec4 r=regions[i];vec2 d=(uv-r.xy)/r.zw;
          float mask=1.-smoothstep(.35,1.,length(d));
          ${ivoryWedding ? "mask=1.-smoothstep(.65,1.,length(d));" : ""}
          ${key === "photo-frame" ? `
          float textArea=smoothstep(.24,.27,uv.x)*(1.-smoothstep(.78,.81,uv.x))
            *smoothstep(.10,.12,1.-uv.y)*(1.-smoothstep(.89,.91,1.-uv.y));
          mask*=1.-textArea;
          ` : ""}
          ${satinWedding ? "mask=1.-smoothstep(.8,1.,max(abs(d.x),abs(d.y)));" : ""}
          ${key === "garden-hands" ? "if(i==0){mask*=smoothstep(.85,.865,1.-uv.y);}" : ""}
          ${key === "ring-promise" ? `
          mask*=smoothstep(.747,.76,1.-uv.y);
          mask*=1.-smoothstep(.22,.25,uv.x)*(1.-smoothstep(.90,.92,1.-uv.y));
          ` : ""}
          ${embossedWedding ? `
          float corner=i==0 ? uv.x+(1.-uv.y)*2. : (1.-uv.x)+uv.y*2.;
          mask=1.-smoothstep(.52,.58,corner);
          if(i==1){mask*=max(smoothstep(.80,.84,uv.x),1.-smoothstep(.12,.15,uv.y));}
          ` : ""}
          float phase=${synchronized ? "time*1.745329" : "time*(.8+float(i)*.06)+float(i)*1.9"};
          ${gatheringBrunch ? `
          float y=1.-uv.y;
          mask=(1.-smoothstep(.55,1.,length(d)))*smoothstep(.485,.505,y)*(1.-smoothstep(.65,.675,y));
          shift+=mask*vec2(sin(time*.75+float(i)*1.6)*.0012,cos(time*.85+float(i)*1.8)*.0014)*amount;
          mask=0.;
          ` : ""}
          ${familyTree ? `
          float y=1.-uv.y;
          mask=(1.-smoothstep(.84,1.,length(d)))*smoothstep(.15,.17,y)*(1.-smoothstep(.55,.59,y));
          float branchHeight=clamp((.61-y)/.44,0.,1.);
          shift+=mask*vec2(sin(time*.85)*.006*branchHeight,sin(time*.85+uv.x*4.)*.0015)*amount;
          mask=0.;
          ` : ""}
          ${greenTradition ? `
          float y=1.-uv.y;
          mask=smoothstep(.735,.76,y);
          shift+=mask*vec2(sin(time*.9+uv.x*5.)*.0035,cos(time*.8+uv.x*4.)*.0025)*amount;
          mask=0.;
          ` : ""}
          ${nouveauFlorals ? `
          float y=1.-uv.y;
          mask=1.-smoothstep(.7,1.,max(abs(d.x),abs(d.y)));
          float wording=smoothstep(.27,.31,uv.x)*(1.-smoothstep(.69,.73,uv.x))
            *smoothstep(.21,.23,y)*(1.-smoothstep(.78,.80,y));
          shift+=mask*(1.-wording)*vec2(sin(phase+y*3.)*.003,cos(phase)*.0025)*amount;
          mask=0.;
          ` : ""}
          ${burgundyBow ? `
          float y=1.-uv.y;
          mask=smoothstep(.465,.48,y)*(1.-smoothstep(.88,.90,y));
          float freeFabric=smoothstep(.03,.22,abs(uv.x-.49));
          shift+=mask*freeFabric*vec2(sin(time*1.1+y*4.)*.003,sin(time*1.1+uv.x*4.)*.005)*amount;
          mask=0.;
          ` : ""}
          ${silverFourteen ? `
          mask=1.-smoothstep(.87,1.03,i<2 ? length(d) : max(abs(d.x),abs(d.y)));
          vec2 p=vec2(uv.x,1.-uv.y);
          if(i==1){mask*=smoothstep(.64,.66,p.x)*max(smoothstep(.78,.80,p.x),smoothstep(.825,.84,p.y));}
          if(i==4){
            mask=smoothstep(-.004,.003,p.y-(.48-.47*p.x))
              *smoothstep(-.004,.003,.598-.258*p.y-p.x)
              *smoothstep(-.004,.003,.190+.379*p.x-p.y);
          }
          if(p.x<.78 && p.y>.745 && p.y<.835){mask=0.;}
          float angle=sin(phase)*.025;
          vec2 offset=(uv-r.xy)*vec2(736.,1309.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
          shift+=mask*((offset-rotated)/vec2(736.,1309.)+vec2(0.,sin(phase)*.0025))*amount;
          mask=0.;
          ` : ""}
          ${birthdayDisco ? `
          mask=1.-smoothstep(.85,1.04,i==0 || i==6 ? length(d) : max(abs(d.x),abs(d.y)));
          if(i==1){mask*=smoothstep(.29,.31,uv.x)*(1.-smoothstep(.72,.74,uv.x));}
          if(i==3){mask*=1.-smoothstep(.285,.30,1.-uv.y);}
          float rhythm=i==9 ? time*1.16+11.4 : phase;
          float angle=sin(rhythm)*.025;
          float scale=i==4 || i==5 || i==7 || i==8 ? 1.+sin(rhythm)*.035 : 1.;
          vec2 offset=(uv-r.xy)*vec2(675.,1200.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset/scale;
          shift+=mask*((offset-rotated)/vec2(675.,1200.)+vec2(sin(rhythm)*.0015,cos(rhythm)*.003))*amount;
          mask=0.;
          ` : ""}
          ${coolKid ? `
          mask=1.-smoothstep(.85,1.04,i<3 ? length(d) : max(abs(d.x),abs(d.y)));
          if(i<3){mask*=smoothstep(.67,.70,uv.x);}
          if(i==3){mask*=1.-smoothstep(.325,.338,uv.x);}
          float rhythm=i<3 ? time*1.2 : time*.9;
          float angle=sin(rhythm)*.025;
          vec2 offset=(uv-r.xy)*vec2(736.,1030.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
          shift+=mask*((offset-rotated)/vec2(736.,1030.)+vec2(sin(rhythm)*.002,cos(rhythm)*.004))*amount;
          mask=0.;
          ` : ""}
          ${pinkSparkle ? `
          mask=1.-smoothstep(.85,1.04,i==1 ? length(d) : max(abs(d.x),abs(d.y)));
          if(i==0){mask*=1.-smoothstep(.79,.82,uv.x);}
          if(i==2){mask*=1.-smoothstep(.25,.26,1.-uv.y);}
          float angle=sin(phase)*.03;
          float scale=i>=3 ? 1.+sin(phase)*.035 : 1.;
          vec2 offset=(uv-r.xy)*vec2(675.,1200.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset/scale;
          shift+=mask*((offset-rotated)/vec2(675.,1200.)+vec2(0.,sin(phase)*.0025))*amount;
          mask=0.;
          ` : ""}
          ${pinkNight ? `
          mask=1.-smoothstep(.85,1.03,i<2 ? length(d) : max(abs(d.x),abs(d.y)));
          float rhythm=i>=2 && i<=5 ? time*.9 : phase;
          float angle=sin(rhythm)*.025;
          vec2 offset=(uv-r.xy)*vec2(735.,1041.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
          shift+=mask*((offset-rotated)/vec2(735.,1041.)+vec2(sin(rhythm)*.002,cos(rhythm)*.0035))*amount;
          mask=0.;
          ` : ""}
          ${floatingPartyDecorations ? `
          mask=1.-smoothstep(.92,1.04,i<2 ? length(d) : max(abs(d.x),abs(d.y)));
          ${vintageBirthday ? `
          if(i==2){
            vec2 p=vec2(uv.x,1.-uv.y);
            float hat=smoothstep(-.01,.005,p.y-(.499-.449*p.x))
              *smoothstep(-.01,.005,.889+.115*p.y-p.x)
              *smoothstep(-.01,.005,.1075+.222*p.x-p.y);
            float star=1.-smoothstep(.8,1.15,length((p-vec2(.9,.078))/vec2(.035,.03)));
            mask=max(hat,star);
          }
          ` : ""}
          float angle=sin(phase)*.04;
          float scale=i==2 ? 1.+sin(phase)*${vintageBirthday ? ".015" : ".035"} : 1.;
          vec2 offset=(uv-r.xy)*${vintageBirthday ? "vec2(735.,1105.)" : "vec2(675.,1200.)"};
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset/scale;
          shift+=mask*((offset-rotated)/${vintageBirthday ? "vec2(735.,1105.)" : "vec2(675.,1200.)"}+vec2(0.,sin(phase)*.0025))*amount;
          mask=0.;
          ` : ""}
          ${woodenHeart ? `
          mask=1.-smoothstep(.85,1.1,max(abs(d.x),abs(d.y)));
          float pulse=1.+.06*sin(time*2.1);
          float angle=sin(time*1.05)*.035;
          vec2 offset=(uv-r.xy)*vec2(675.,1200.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset/pulse;
          shift+=mask*((offset-rotated)/vec2(675.,1200.)+vec2(0.,sin(time*1.05)*.0015))*amount;
          mask=0.;
          ` : ""}
          ${tealWedding ? `
          mask=i==0 ? coupleMask(vec2(uv.x,1.-uv.y)) : 1.-smoothstep(.85,1.05,max(abs(d.x),abs(d.y)));
          float angle=sin(phase)*.018;
          vec2 offset=(uv-r.xy)*vec2(736.,981.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
          shift+=mask*((offset-rotated)/vec2(736.,981.)+vec2(sin(phase)*.003,cos(phase)*.004))*amount;
          mask=0.;
          ` : ""}
          ${photoCharacters ? `
          // Move each person, hands, frame, and photo together without bending the photo.
          mask=1.-smoothstep(.88,1.08,max(abs(d.x),abs(d.y)));
          float angle=sin(phase)*.025;
          vec2 offset=(uv-vec2(r.x,.39))*vec2(736.,1029.);
          vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
          shift+=mask*((offset-rotated)/vec2(736.,1029.)+vec2(sin(phase)*.003,cos(phase)*.006))*amount;
          mask=0.;
          ` : ""}
          ${floralWedding ? `
          if(i<2){mask*=1.-smoothstep(.245,.27,1.-uv.y);}
          if(i==4){
            mask=1.-smoothstep(.8,1.05,length(d));
            float angle=sin(phase)*.025;
            vec2 offset=(uv-vec2(.5,.95))*vec2(736.,1104.);
            vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
            shift+=mask*(offset-rotated)/vec2(736.,1104.)*amount;
          }
          if(i>=5){mask=1.-smoothstep(.7,1.1,length(d));}
          ` : ""}
          ${starCertificate ? `
          if(i==0){
            // Keep the entire star, including its face and outline, moving as one piece.
            mask=1.-smoothstep(.9,1.08,length(d));
            float angle=sin(phase)*.035;
            vec2 offset=(uv-r.xy)*vec2(736.,589.);
            vec2 rotated=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*offset;
            shift+=mask*(offset-rotated)/vec2(736.,589.)*amount;
          }
          ` : ""}
          shift+=mask*${synchronized ? "vec2(sin(phase)*.0015,sin(phase)*.005)" : satinWedding || embossedWedding || ivoryWedding ? "vec2(sin(phase+d.x*.4)*.0035,cos(phase)*.0045)" : floralWedding ? "vec2(sin(phase)*.0025,cos(phase)*.004)" : starCertificate || pinkCertificate || quranCertificate ? "vec2(sin(phase)*.004,cos(phase)*.009)" : "vec2(sin(phase)*.0012,cos(phase*.85)*.0035)"}*amount;
        }}
        vec2 sampleUV=clamp(uv-shift*1.55,vec2(0.),vec2(1.));
        ${coolKid ? `
        vec2 flamePoint=vec2(sampleUV.x*736.,(1.-sampleUV.y)*1030.);
        float flameMask=1.-smoothstep(.3,1.,length((flamePoint-vec2(133.,738.))/vec2(5.,14.)));
        sampleUV+=flameMask*vec2(sin(time*13.)*.0012,cos(time*9.)*.001)*amount;
        ` : ""}
        ${quranCertificate ? `
        vec2 point=vec2(sampleUV.x*735.,(1.-sampleUV.y)*519.);
        vec2 eyeShift=${pinkQuranCertificate ? "followEye(point,vec2(84.,274.))+followEye(point,vec2(118.,269.))" : "followEye(point,vec2(100.,296.))+followEye(point,vec2(136.,293.))"};
        sampleUV-=eyeShift/vec2(735.,-519.);
        ` : ""}
        ${pinkCertificate ? `
        vec2 point=vec2(sampleUV.x*736.,(1.-sampleUV.y)*552.);
        vec2 eyeShift=followEye(point,vec2(102.,226.))+followEye(point,vec2(145.,205.));
        sampleUV-=eyeShift/vec2(736.,-552.);
        ` : ""}
        ${synchronized ? `
        vec2 point=vec2(sampleUV.x*735.,(1.-sampleUV.y)*967.);
        vec2 eyeShift=followEye(point,vec2(110.,721.))+followEye(point,vec2(154.,720.))
          +followEye(point,vec2(583.,721.))+followEye(point,vec2(625.,729.));
        sampleUV-=eyeShift/vec2(735.,-967.);
        vec4 color=texture2D(artwork,sampleUV);
        // Keep the arch and stone frame fixed while the two wooden leaves swing inward.
        vec2 door=vec2(367.,891.);
        vec2 local=point-door;
        bool inside=abs(local.x)<16. && point.y<910. &&
          (point.y>=882. || length(vec2(local.x/16.,(point.y-882.)/8.))<1.);
        if(inside){
          float opening=(.5-.5*cos(time*1.047198))*amount;
          float leafWidth=16.*(1.-opening*.82);
          float edgeDistance=16.-abs(local.x);
          color=vec4(.16,.085,.045,1.);
          if(edgeDistance<leafWidth){
            float sourceX=local.x<0. ? 351.+edgeDistance*16./leafWidth : 383.-edgeDistance*16./leafWidth;
            color=texture2D(artwork,vec2(sourceX/735.,sampleUV.y));
            color.rgb*=1.-opening*.22;
          }
        }
        gl_FragColor=color;
        ` : "gl_FragColor=texture2D(artwork,sampleUV);"}
      }`);
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!vertex || !fragment || !program || !buffer || !texture) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program); gl.deleteBuffer(buffer); gl.deleteTexture(texture);
      return;
    }
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program); gl.deleteBuffer(buffer); gl.deleteTexture(texture);
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "artwork"), 0);
    const values = new Float32Array(regionCount * 4);
    regions.forEach(([x,y,rx,ry], i) => values.set([x,1-y,rx,ry], i*4));
    gl.uniform4fv(gl.getUniformLocation(program, "regions[0]"), values);
    gl.uniform1i(gl.getUniformLocation(program, "count"), regionCount);
    const clock = gl.getUniformLocation(program, "time");
    const amount = gl.getUniformLocation(program, "amount");
    const pointerLocation = gl.getUniformLocation(program, "pointer");
    const draw = (stamp: number) => {
      frame = 0;
      if (disposed) return;
      const active = visible && !document.hidden && !pausedRef.current && !reduced.matches;
      if (!active) return;
      if (active) time += Math.min((stamp-previous)/1000, .05);
      previous = stamp;
      if (visible) {
        gl.uniform1f(clock, time * 1.15); gl.uniform1f(amount, reduced.matches ? 0 : 1);
        gl.uniform2f(pointerLocation, pointer[0], 1 - pointer[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = requestAnimationFrame(draw);
    };
    const resume = () => {
      if (!disposed && textureReady && visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) resume();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", resume);
    reduced.addEventListener("change", resume);
    if (followsCursor) {
      window.addEventListener("pointermove", trackPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", resetPointer);
    }
    const source = new Image();
    source.crossOrigin = "anonymous";
    source.onload = () => {
      if (disposed) return;
      const scale = Math.min(1, 1200/source.naturalWidth);
      canvas.width = Math.round(source.naturalWidth*scale);
      canvas.height = Math.round(source.naturalHeight*scale);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      const paperColours: Record<string, [number, number, number]> = {
        garden: [221, 235, 214], midnight: [24, 37, 56],
        confetti: [249, 222, 232], champagne: [246, 233, 208],
      };
      let target = paperColours[paperTheme];
      let artworkSource: TexImageSource = source;
      if (paperTheme) {
        const paper = document.createElement("canvas");
        paper.width = canvas.width; paper.height = canvas.height;
        const context = paper.getContext("2d", { willReadFrequently: true });
        if (context) {
          context.drawImage(source, 0, 0, paper.width, paper.height);
          const pixels = context.getImageData(0, 0, paper.width, paper.height);
          const data = pixels.data;
          // Find the dominant pale paper colour in the central writing area.
          const bins = new Map<number, { count: number; index: number }>();
          for (let y = Math.floor(paper.height * .18); y < paper.height * .8; y += 3) {
            for (let x = Math.floor(paper.width * .25); x < paper.width * .75; x += 3) {
              const index = y * paper.width + x, offset = index * 4;
              const r = data[offset], g = data[offset + 1], b = data[offset + 2];
              if (Math.min(r, g, b) < 165 || Math.max(r, g, b) - Math.min(r, g, b) > 65) continue;
              const bin = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
              const entry = bins.get(bin);
              bins.set(bin, { count: (entry?.count || 0) + 1, index });
            }
          }
          const seed = [...bins.values()].sort((a, b) => b.count - a.count)[0]?.index;
          if (seed !== undefined) {
            const base = [data[seed * 4], data[seed * 4 + 1], data[seed * 4 + 2]];
            if (!target) target = [base[0], base[1], base[2]];
            const seen = new Uint8Array(paper.width * paper.height);
            const queue = new Int32Array(seen.length);
            let head = 0, tail = 1; queue[0] = seed; seen[seed] = 1;
            while (head < tail) {
              const index = queue[head++], offset = index * 4;
              const distance = Math.max(...base.map((value, channel) => Math.abs(data[offset + channel] - value)));
              if (distance > 38) continue;
              const weight = Math.min(1, (38 - distance) / 14);
              const shade = (data[offset] + data[offset + 1] + data[offset + 2]) / (base[0] + base[1] + base[2]);
              for (let channel = 0; channel < 3; channel++) {
                if (paperTheme) data[offset + channel] = data[offset + channel] * (1 - weight) + Math.min(255, target[channel] * shade) * weight;
              }
              const x = index % paper.width;
              const neighbours = [x > 0 ? index - 1 : -1, x < paper.width - 1 ? index + 1 : -1, index - paper.width, index + paper.width];
              for (const next of neighbours) {
                if (next >= 0 && next < seen.length && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
              }
            }
            context.putImageData(pixels, 0, 0);
            artworkSource = paper;
          }
        }
      }
      // Reuse the exact rendered artwork for the invitation's decorative edges.
      const invitation = canvas.closest<HTMLElement>(".animatedInvite");
      if (invitation) {
        const decoration = artworkSource instanceof HTMLCanvasElement ? artworkSource.toDataURL("image/png") : optimizedImage(image);
        invitation.style.setProperty("--invitation-decoration", `url("${decoration}")`);
        invitation.style.setProperty("--invitation-paper", target ? `rgb(${target.join(",")})` : "var(--paper)");
      }
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,artworkSource);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      textureReady = true;
      canvas.dataset.ready = "true";
      resume();
    };
    source.src = optimizedImage(image);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("pointermove", trackPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", resume);
      reduced.removeEventListener("change", resume);
      source.onload = null; delete canvas.dataset.ready;
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
    };
  }, [image, paperTheme, animate, paused]);
  return <div className="livingArtwork"><img className="inviteArtwork" src={optimizedImage(image)} alt={title} onError={onError} loading={animate ? "eager" : "lazy"} decoding="async" /><canvas ref={canvasRef} aria-hidden="true" />
    {image.endsWith("/family-roots.jfif") && <svg className="treeLeaves" viewBox="0 0 736 1030" aria-hidden="true">
      {[{ x: 195, y: 285, dx: -110 }, { x: 235, y: 405, dx: -140 }, { x: 290, y: 220, dx: -125 }, { x: 515, y: 285, dx: 115 }, { x: 510, y: 435, dx: 145 }, { x: 430, y: 225, dx: 140 }, { x: 170, y: 460, dx: -100 }, { x: 565, y: 375, dx: 95 }].map((leaf, index) => <g key={index} transform={`translate(${leaf.x} ${leaf.y})`}>
        <g className="treeLeaf" style={{ animationPlayState: paused || !animate ? "paused" : "running", animationDelay: `${-index * 1.4}s`, animationDuration: `${8 + index % 3}s`, "--leaf-out": `${leaf.dx}px` } as React.CSSProperties}>
          <path d="M0 0C-10-3-15-15-8-25C4-24 12-9 0 0Z" fill={index % 2 ? "#e8b642" : "#dca134"} fillOpacity=".85" stroke="#c99436" strokeWidth=".6" />
          <path d="M0 0L-7-21M-3-9L3-15" fill="none" stroke="#b88734" strokeWidth=".7" />
        </g>
      </g>)}
    </svg>}
    {image.endsWith("/green-tradition.jfif") && <svg className="risingLeaves" viewBox="0 0 736 1037" aria-hidden="true">
      {[25, 65, 105, 631, 671, 711].map((x, index) => <g key={x} transform={`translate(${x} ${980 - index % 2 * 70})`}>
        <g className="risingLeaf" style={{ animationPlayState: paused || !animate ? "paused" : "running", animationDelay: `${-index * 1.9}s`, animationDuration: `${9 + index % 3}s`, "--leaf-sway": `${index < 3 ? -22 : 22}px` } as React.CSSProperties}>
          <path d="M0 0C-16-9-20-29-9-43C10-37 20-16 0 0Z" fill={index % 2 ? "#839875" : "#647b50"} stroke="#667c50" strokeWidth="1" />
          <path d="M0 0L-8-36M-4-15L7-26M-6-24L-14-29" fill="none" stroke="#c0c8a2" strokeWidth="1" />
        </g>
      </g>)}
    </svg>}
    {image.endsWith("/nouveau-florals.jfif") && <svg className="nouveauLeaves" viewBox="0 0 736 1030" aria-hidden="true" style={{ animationPlayState: paused || !animate ? "paused" : "running" }}>
      {[{ x: 155, y: 170, direction: -1 }, { x: 105, y: 460, direction: -1 }, { x: 165, y: 870, direction: -1 }, { x: 595, y: 140, direction: 1 }, { x: 640, y: 570, direction: 1 }, { x: 595, y: 920, direction: 1 }].map((leaf, index) => <g key={index} transform={`translate(${leaf.x} ${leaf.y})`}>
        <g className="nouveauLeaf" style={{ animationDelay: `${-index * 1.7}s`, animationDuration: `${9 + index % 3}s`, "--leaf-drift": `${leaf.direction * 75}px` } as React.CSSProperties}>
          <path d="M0 0C-9-7-13-21-6-32C8-28 14-13 0 0Z" fill={index % 2 ? "#a4a660" : "#b7b779"} stroke="#9c925b" strokeWidth="1" />
          <path d="M0 0L-5-27M-3-12L5-19M-4-18L-10-23" fill="none" stroke="#918754" strokeWidth=".8" />
        </g>
      </g>)}
    </svg>}
  </div>;
}

