"use client";

import { useEffect, useRef } from "react";
import type { OrbState } from "./MilaOrb";

// ─── Reactive living void ───────────────────────────────────────────────
//
// A full-field WebGL2 background for Mila's light voice atelier: mineral linen,
// restrained eucalyptus, and the same electric signal used everywhere else.

const VS_SRC = /*glsl*/ `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FS_SRC = /*glsl*/ `#version 300 es
precision highp float;
in vec2 v_uv; out vec4 o;
uniform float u_t; uniform vec2 u_res; uniform float u_lv; uniform float u_warm; uniform float u_dark;
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x),
             mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vn(p); p *= 2.02; a *= 0.5; } return s; }
void main(){
  vec2 uv = v_uv; vec2 c = uv - 0.5; c.x *= u_res.x / u_res.y;
  float r = length(c); float ang = atan(c.y, c.x);
  float paperSweep = smoothstep(-0.95, 0.78, c.x - c.y * 0.34);
  vec3 base = mix(vec3(0.980, 0.973, 0.961), vec3(0.867, 0.910, 0.890), 0.32 * paperSweep);
  vec2 q = c * 2.2;
  float warp = fbm(q * 1.3 + vec2(u_t * 0.03, u_t * 0.02));
  float aNear = pow(fbm(q + vec2(warp * 1.2 - u_t * 0.02, warp * 0.8 + u_t * 0.015)), 1.7);
  float aFar = pow(fbm(q * 0.55 + vec2(u_t * 0.008, -u_t * 0.011) + warp * 0.4), 2.0);
  float aur = aNear * 0.72 + aFar * 0.55;
  
  // Quiet mineral atmosphere; magenta appears only as the active signal.
  vec3 mineral = vec3(0.945, 0.925, 0.898);
  vec3 mist = vec3(0.949, 0.965, 0.957);
  vec3 euca = vec3(0.373, 0.490, 0.447);
  vec3 eucaDeep = vec3(0.271, 0.416, 0.376);
  vec3 signal = vec3(0.851, 0.0, 0.424);

  vec3 hue = mix(mist, euca, 0.5 + 0.5 * sin(u_t * 0.05 + c.x * 1.5));
  hue = mix(hue, signal, u_warm * 0.42);
  
  float field = aur * (0.12 + 0.20 * u_lv);
  vec3 col = mix(base, hue, field);
  
  float halo = exp(-r * (2.8 - 1.1 * u_lv)) * (0.04 + 0.16 * u_lv);
  col = mix(col, eucaDeep, halo * 0.5);
  
  float rays = (0.5 + 0.5 * sin(ang * 14.0 + u_t * 0.12)) * (0.5 + 0.5 * sin(ang * 5.0 - u_t * 0.07)) * exp(-r * 1.7) * u_warm * 0.16;
  col = mix(col, signal, rays * 0.42);
  
  float shim = (0.5 + 0.5 * sin(r * 24.0 - u_t * 0.35)) * smoothstep(0.25, 0.85, r) * 0.022 * (0.4 + 0.6 * u_lv);
  col = mix(col, mix(mineral, signal, u_warm), shim * 0.7);
  
  vec2 mg = uv * u_res * 0.6; mg.y += u_t * 6.0; float sd = h2(floor(mg));
  float tw = step(0.9986, sd) * (0.5 + 0.5 * sin(u_t * 1.6 + sd * 80.0));
  col = mix(col, mist, tw * 0.35);
  col = mix(base, col, mix(0.48, 1.0, smoothstep(1.18, 0.10, r)));

  // Synthetic Presence mode: a graphite interface chamber with a living
  // magenta signal, faint machine-grid telemetry and enough warmth to keep
  // the companion emotionally present rather than clinically mechanical.
  vec3 voidBase = vec3(0.014, 0.020, 0.027);
  vec3 graphite = vec3(0.035, 0.047, 0.058);
  vec3 cyanMetal = vec3(0.105, 0.225, 0.235);
  vec3 magenta = vec3(1.000, 0.090, 0.510);
  float chamberHalo = exp(-r * (2.2 - u_lv * 0.55));
  float darkMist = fbm(c * 3.1 + vec2(u_t * 0.012, -u_t * 0.008));
  vec3 darkCol = mix(voidBase, graphite, 0.32 + chamberHalo * 0.52 + darkMist * 0.10);
  darkCol = mix(darkCol, cyanMetal, chamberHalo * (0.10 + u_lv * 0.14));
  darkCol = mix(darkCol, magenta, (0.018 + u_warm * 0.12) * exp(-r * 3.0));

  vec2 gridUv = uv * vec2(34.0 * u_res.x / max(u_res.y, 1.0), 34.0);
  vec2 gridCell = abs(fract(gridUv - 0.5) - 0.5) / fwidth(gridUv);
  float gridLine = 1.0 - min(min(gridCell.x, gridCell.y), 1.0);
  darkCol += vec3(0.08, 0.16, 0.17) * gridLine * 0.055 * smoothstep(1.05, 0.32, r);

  float interfaceRing = smoothstep(0.006, 0.0, abs(r - (0.305 + 0.008 * sin(u_t * 0.24))));
  darkCol = mix(darkCol, mix(cyanMetal, magenta, u_warm), interfaceRing * (0.11 + u_lv * 0.16));
  float scan = pow(0.5 + 0.5 * sin((uv.y * u_res.y + u_t * 28.0) * 0.075), 18.0);
  darkCol += vec3(0.04, 0.11, 0.12) * scan * 0.05;
  darkCol *= 1.0 - smoothstep(0.42, 1.16, r) * 0.64;
  col = mix(col, darkCol, u_dark);
  o = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") console.warn("MilaAurora shader:", gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function MilaAurora({
  phase,
  className,
  variant = "atelier",
}: {
  phase: OrbState;
  className?: string;
  variant?: "atelier" | "synthetic";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<OrbState>(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced =
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const gl = canvas.getContext("webgl2", {
      alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VS_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS_SRC);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production") console.warn("MilaAurora link:", gl.getProgramInfoLog(prog));
      return;
    }

    const uT = gl.getUniformLocation(prog, "u_t");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uLv = gl.getUniformLocation(prog, "u_lv");
    const uWarm = gl.getUniformLocation(prog, "u_warm");
    const uDark = gl.getUniformLocation(prog, "u_dark");

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    let level = 0, warm = 0, raf = 0;
    const t0 = performance.now();
    const renderScale = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, 1.25);

    const loop = () => {
      const t = reduced ? 5.5 : (performance.now() - t0) * 0.001;
      const st = phaseRef.current;
      const lvTarget = st === "thinking" || st === "manifesting" ? 1.0 : st === "listening" ? 0.5 : 0.0;
      const warmTarget = st === "manifesting" ? 1.0 : 0.0;
      level = reduced ? lvTarget : level + (lvTarget - level) * 0.05;
      warm = reduced ? warmTarget : warm + (warmTarget - warm) * 0.04;

      const w = Math.round(canvas.clientWidth * renderScale);
      const h = Math.round(canvas.clientHeight * renderScale);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform1f(uT, t);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uLv, level);
      gl.uniform1f(uWarm, warm);
      gl.uniform1f(uDark, variant === "synthetic" ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
      gl.deleteBuffer(buf); gl.deleteVertexArray(vao);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
}
