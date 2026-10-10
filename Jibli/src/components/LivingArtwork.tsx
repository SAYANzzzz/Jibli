import { useEffect, useRef } from "react";
import { invitationMotionProfiles } from "../invitationMotionProfiles";

// Local texture deformation moves pixels already in the artwork, without
// duplicating a character or adding unrelated decorative illustrations.
export default function LivingArtwork({ image, title, paused }: { image: string; title: string; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const key = image.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
    const regions = invitationMotionProfiles[key];
    if (!canvas || !regions) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    let disposed = false;
    let frame = 0;
    let visible = false;
    let time = 0;
    let previous = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
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
      uniform vec4 regions[6]; uniform int count;
      void main(){vec2 shift=vec2(0.);
        for(int i=0;i<6;i++){if(i<count){vec4 r=regions[i];vec2 d=(uv-r.xy)/r.zw;
          float mask=1.-smoothstep(.35,1.,length(d));
          float phase=time*(.8+float(i)*.06)+float(i)*1.9;
          shift+=mask*vec2(sin(phase)*.0012,cos(phase*.85)*.0035)*amount;
        }}gl_FragColor=texture2D(artwork,clamp(uv-shift,vec2(0.),vec2(1.)));}`);
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
    const values = new Float32Array(24);
    regions.slice(0,6).forEach(([x,y,rx,ry], i) => values.set([x,1-y,rx,ry], i*4));
    gl.uniform4fv(gl.getUniformLocation(program, "regions[0]"), values);
    gl.uniform1i(gl.getUniformLocation(program, "count"), Math.min(regions.length,6));
    const clock = gl.getUniformLocation(program, "time");
    const amount = gl.getUniformLocation(program, "amount");
    const draw = (stamp: number) => {
      if (disposed) return;
      const active = visible && !document.hidden && !pausedRef.current && !reduced.matches;
      if (active) time += Math.min((stamp-previous)/1000, .05);
      previous = stamp;
      if (visible) {
        gl.uniform1f(clock, time); gl.uniform1f(amount, reduced.matches ? 0 : 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(canvas);
    const source = new Image();
    source.crossOrigin = "anonymous";
    source.onload = () => {
      if (disposed) return;
      const scale = Math.min(1, 1200/source.naturalWidth);
      canvas.width = Math.round(source.naturalWidth*scale);
      canvas.height = Math.round(source.naturalHeight*scale);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,source);
      canvas.dataset.ready = "true";
      frame = requestAnimationFrame(draw);
    };
    source.src = image;
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      source.onload = null; delete canvas.dataset.ready;
      gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
      shaders.forEach((shader) => gl.deleteShader(shader));
    };
  }, [image]);
  return <div className="livingArtwork"><img className="inviteArtwork" src={image} alt={title} /><canvas ref={canvasRef} aria-hidden="true" /></div>;
}
