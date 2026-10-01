import { useEffect, useRef } from 'react'

/*
 * Two reaching arms rendered as ASCII on a WebGL2 canvas.
 * The scene (two cutout textures + a spark) is evaluated once per cell at the
 * cell's center, its luminance picks a glyph off RAMP, its color tints it.
 */

// dim -> bright; the last entry is the inverted "?" tile
const RAMP = [' ', '.', ':', '-', '+', '*', '%', '#', '@', 'TILE']
const LOOP = 9.55 // seconds
const ASPECT = 3696 / 2304 // design frame, covered onto the canvas
const CELL = 21 / 2304 // cell size as a fraction of the covered frame's height

const vert = /* glsl */ `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const frag = /* glsl */ `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 u_res;        // canvas px
uniform float u_cell;      // cell px
uniform float u_time;      // seconds into the loop
uniform float u_aspect;
uniform sampler2D u_atlas; // RAMP glyphs, one row
uniform float u_glyphs;
uniform sampler2D u_left;
uniform sampler2D u_right;
uniform vec2 u_leftSize;   // design units
uniform vec2 u_rightSize;

// layer transforms: xy = center, z = rotation (radians)
uniform vec3 u_leftA;
uniform vec3 u_leftB;
uniform vec3 u_rightA;
uniform vec3 u_rightB;
uniform vec2 u_spark;


vec4 layer(sampler2D tex, vec2 p, vec3 xf, vec2 size) {
  vec2 d = p - xf.xy;
  float c = cos(-xf.z), s = sin(-xf.z);
  d = vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  vec2 uv = d / size + 0.5;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return vec4(0.0);
  return texture(tex, uv);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  // cell center in canvas px (y down)
  vec2 frag = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 cell = floor(frag / u_cell);
  vec2 local = (frag - cell * u_cell) / u_cell;
  vec2 center = (cell + 0.5) * u_cell;

  // cover-fit the design frame: x in [0, aspect], y in [0, 1]
  float unit = max(u_res.x / u_aspect, u_res.y);
  vec2 p = (center - u_res * 0.5) / unit + vec2(u_aspect * 0.5, 0.5);

  float t = u_time;
  float k = smoothstep(0.0, 6.8, t);
  vec3 lx = mix(u_leftA, u_leftB, k);
  vec3 rx = mix(u_rightA, u_rightB, k);

  vec4 L = layer(u_left, p, lx, u_leftSize);
  vec4 R = layer(u_right, p, rx, u_rightSize);

  // left arm reads cool grey-white, right arm warm
  float lg = dot(L.rgb, vec3(0.299, 0.587, 0.114));
  vec3 lcol = mix(vec3(lg), L.rgb, 0.18) * vec3(0.96, 0.95, 0.97);
  float rg = dot(R.rgb, vec3(0.299, 0.587, 0.114));
  vec3 rcol = rg * vec3(1.4, 0.6, 0.32);

  vec3 col = rcol * R.a;
  col = mix(col, lcol, L.a);
  float a = max(L.a, R.a);

  // shading: arms fall off toward their roots so the hands carry the light
  float dist = distance(p, u_spark);
  col *= mix(0.55, 1.25, smoothstep(1.1, 0.12, dist));

  // overall exposure climbs as the hands close in
  col *= mix(0.8, 1.15, k);

  // spark where the fingers meet: hot white-yellow core, orange halo, rays
  float glow = smoothstep(5.0, 6.6, t);
  vec2 d = p - u_spark;
  float ang = atan(d.y, d.x);
  float rays = 0.6 + 0.4 * pow(abs(sin(ang * 3.0 + 0.4)), 6.0);
  float flick = 0.85 + 0.15 * sin(t * 23.0 + hash(cell) * 6.28);
  float core = exp(-dist * dist / 0.0012);
  float halo = exp(-dist / 0.075) * rays;
  float spark = glow * flick * (core * 1.4 + halo * 1.4);
  col += mix(vec3(0.95, 0.3, 0.08), vec3(1.0, 0.86, 0.22), clamp(core * 1.6, 0.0, 1.0)) * spark;
  a = max(a, clamp(spark, 0.0, 1.0));

  float lum = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0) * a;
  lum = pow(lum, 1.9);
  float idx = floor(clamp(lum, 0.0, 0.999) * u_glyphs);
  if (idx < 1.0) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  vec2 auv = vec2((idx + local.x) / u_glyphs, local.y);
  float ink = texture(u_atlas, auv).r;

  // glyph color: the scene color lifted so dim glyphs stay legible
  vec3 tint = col / max(max(col.r, max(col.g, col.b)), 1e-3);
  vec3 c = tint * mix(0.35, 1.0, lum);
  outColor = vec4(c * ink, 1.0);
}
`

function buildAtlas(cellPx: number) {
  const n = RAMP.length
  const size = Math.max(8, Math.round(cellPx))
  const canvas = document.createElement('canvas')
  canvas.width = size * n
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const font = `${Math.round(size * 0.92)}px ui-monospace, SFMono-Regular, Menlo, monospace`
  RAMP.forEach((g, i) => {
    const cx = i * size + size / 2
    const cy = size / 2 + size * 0.04
    if (g === 'TILE') {
      const inset = size * 0.14
      ctx.fillStyle = '#fff'
      ctx.fillRect(i * size + inset, inset * 0.6, size - inset * 2, size - inset * 1.2)
      ctx.fillStyle = '#000'
      ctx.font = `bold ${font}`
      ctx.fillText('?', cx, cy)
      return
    }
    ctx.fillStyle = '#fff'
    ctx.font = font
    ctx.fillText(g, cx, cy)
  })
  return canvas
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
  return sh
}

function texture(gl: WebGL2RenderingContext, src: TexImageSource, unit: number, linear: boolean) {
  const tex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
  const f = linear ? gl.LINEAR : gl.NEAREST
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return tex
}

// scene layout in design units (x 0..ASPECT, y 0..1 top-down)
const SCENE = {
  leftWidth: 1.15,
  rightWidth: 1.4,
  leftA: [0.052, 0.634, -0.18],
  leftB: [0.212, 0.544, -0.18],
  rightA: [1.505, 0.172, -0.2],
  rightB: [1.375, 0.207, -0.2],
  spark: [0.775, 0.41],
}

type Props = { playing?: boolean; time?: number }

export function AsciiAdam({ playing = true, time }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const playingRef = useRef(playing)
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false })
    if (!gl) return

    let raf = 0
    let disposed = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    Promise.all([loadImage('/hero/ascii/arm-left.webp'), loadImage('/hero/ascii/arm-right.webp')]).then(([left, right]) => {
      if (disposed) return
      const prog = gl.createProgram()!
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vert))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, frag))
      gl.linkProgram(prog)
      gl.useProgram(prog)

      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const loc = gl.getAttribLocation(prog, 'a_pos')
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

      const u = (n: string) => gl.getUniformLocation(prog, n)
      texture(gl, left, 1, true)
      texture(gl, right, 2, true)
      gl.uniform1i(u('u_left'), 1)
      gl.uniform1i(u('u_right'), 2)
      gl.uniform1i(u('u_atlas'), 0)
      gl.uniform1f(u('u_glyphs'), RAMP.length)
      gl.uniform1f(u('u_aspect'), ASPECT)
      gl.uniform2f(u('u_leftSize'), SCENE.leftWidth, (SCENE.leftWidth * left.height) / left.width)
      gl.uniform2f(u('u_rightSize'), SCENE.rightWidth, (SCENE.rightWidth * right.height) / right.width)
      gl.uniform3fv(u('u_leftA'), SCENE.leftA)
      gl.uniform3fv(u('u_leftB'), SCENE.leftB)
      gl.uniform3fv(u('u_rightA'), SCENE.rightA)
      gl.uniform3fv(u('u_rightB'), SCENE.rightB)
      gl.uniform2fv(u('u_spark'), SCENE.spark)

      let atlasCell = 0
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
        const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
        }
        gl.viewport(0, 0, w, h)
        // cells scale with the covered frame so the grid density never changes
        const cell = Math.max(w / ASPECT, h) * CELL
        gl.uniform2f(u('u_res'), w, h)
        gl.uniform1f(u('u_cell'), cell)
        if (Math.round(cell) !== atlasCell) {
          atlasCell = Math.round(cell)
          texture(gl, buildAtlas(cell), 0, true)
        }
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)

      const start = performance.now()
      let paused = 0
      let last = start
      const frame = (now: number) => {
        if (!playingRef.current) paused += now - last
        last = now
        const t =
          time ?? (reduced ? LOOP - 0.5 : (((now - start - paused) / 1000) % LOOP))
        gl.uniform1f(u('u_time'), t)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        if (time === undefined && !reduced) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      cleanup = () => ro.disconnect()
    })

    let cleanup = () => {}
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      cleanup()
    }
  }, [time])

  return <canvas ref={ref} className="ascii-adam" aria-hidden="true" />
}
