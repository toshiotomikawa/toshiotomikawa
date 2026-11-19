// Draws every image the profile README shows, in a dark and a light version. Text is outlined
// from the font files, so it looks the same on every machine, and everything moves with CSS,
// which GitHub keeps running inside an <img>. Run: npm run build
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as hb from "harfbuzzjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONTS = path.join(HERE, "..", "fonts");
const OUT = path.join(HERE, "..", "assets");
fs.mkdirSync(OUT, { recursive: true });

const U = 24; // one line
const THEMES = {
  dark: { bg: "#1a1a1a", fg: "#e6e6e6", muted: "#9a9aa2", line: "#34343a" },
  light: { bg: "#e6e6e6", fg: "#1a1a1a", muted: "#5c5c64", line: "#c8c8ce" },
};

const font = (file) => {
  const face = new hb.Face(new hb.Blob(fs.readFileSync(path.join(FONTS, file))));
  const f = new hb.Font(face);
  f.setVariations([new hb.Variation("wght", 400)]); // variable fonts open at their own default; Fira Code's is Light
  return { face, font: f };
};
const ALLO = { regular: font("Allo-Regular.ttf"), bold: font("Allo-Bold.ttf"), black: font("Allo-ExtraBold.ttf") };

// Outlined text, shaped by HarfBuzz (kerning, ligatures, Allo's ss02). Returns { svg, width }.
function text(f, str, x, y, size, fill, { anchor = "start", features = ["ss02"], attrs = "" } = {}) {
  const buf = new hb.Buffer();
  buf.addText(str);
  buf.guessSegmentProperties();
  hb.shape(f.font, buf, features.map((tag) => new hb.Feature(tag, 1)));
  const k = size / f.face.upem;
  let pen = 0;
  const glyphs = buf.getGlyphInfosAndPositions().map((g) => {
    const d = f.font.glyphToPath(g.codepoint);
    const part = d ? `<path transform="translate(${pen + g.xOffset} ${g.yOffset})" d="${d}"/>` : "";
    pen += g.xAdvance;
    return part;
  }).join("");
  const width = pen * k;
  const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const r = (n) => +n.toFixed(2);
  return { width, svg: `<g${attrs} fill="${fill}" transform="translate(${r(x0)} ${r(y)}) scale(${+k.toFixed(5)} ${-k.toFixed(5)})">${glyphs}</g>` };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
// `still` is the picture at rest, for people who turn motion off.
const doc = (w, h, label, css, body, still = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title>` +
  `<style>${css}@media (prefers-reduced-motion:reduce){*{animation:none!important}${still}}</style>${body}</svg>`;
// The page adds about 6px under each image row, so tiles leave no margin at the bottom: gaps come out 12px both ways.
const card = (w, h, t, bottom = 6) => `<rect x="6.5" y="6.5" width="${w - 13}" height="${h - 7 - bottom}" rx="${U / 2}" fill="${t.bg}" stroke="${t.line}"/>`;
const write = (name, theme, svg) => fs.writeFileSync(path.join(OUT, `${name}-${theme}.svg`), svg);
const box = "transform-box:fill-box;transform-origin:center;";
// Below these drawn widths (a phone), each image switches to larger text. Inside an image, a media query measures the image.
const PHONE = { hero: 600, tile: 200 };

/* ---------------------------------------------------------------- hero */
// A sunflower: 377 dots on the golden angle, turning slowly while a glow runs outwards.
function hero(t) {
  const W = 846, H = 15 * U + 12, cx = W / 2, cy = 6 + 6 * U, R = 4.5 * U, N = 377;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dots = [];
  for (let n = 1; n <= N; n++) {
    const rr = Math.sqrt(n / N);
    const a = n * golden;
    const x = cx + R * rr * Math.cos(a), y = cy + R * rr * Math.sin(a);
    dots.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(0.9 + 1.5 * rr).toFixed(2)}" style="animation-delay:${(-6 * rr).toFixed(2)}s"/>`);
  }
  const css =
    `.f{transform-origin:${cx}px ${cy}px;animation:turn 120s linear infinite}@keyframes turn{to{transform:rotate(360deg)}}` +
    `.f circle{opacity:.3;animation:glow 6s ease-in-out infinite}@keyframes glow{50%{opacity:1}}`;
  const name = text(ALLO.black, "toshiotomikawa", cx, 6 + 12 * U, 32, t.fg, { anchor: "middle" });
  const line = text(ALLO.regular, "Firefox add-ons, agent tools and small Windows utilities", cx, 6 + 13.5 * U, 15, t.muted, { anchor: "middle" });
  // On a phone the hero is drawn at about 0.42 of its size, so a smaller flower makes room for text 2.2 times larger.
  const big = 2.2, phone = [
    text(ALLO.black, "toshiotomikawa", cx, 6 + 10.5 * U, 32 * big, t.fg, { anchor: "middle" }),
    text(ALLO.regular, "Firefox add-ons, agent tools", cx, 6 + 12.5 * U, 15 * big, t.muted, { anchor: "middle" }),
    text(ALLO.regular, "and small Windows utilities", cx, 6 + 14 * U, 15 * big, t.muted, { anchor: "middle" }),
  ];
  for (const p of phone) if (p.width > W - 12 - 2 * U) console.warn(`hero: phone text is ${Math.round(p.width)}px, wider than the card`);
  const small = `@media (max-width:${PHONE.hero}px){.w{display:none}.n{display:inline}.s{transform:translateY(-${1.5 * U}px) scale(.7)}}`;
  return doc(W, H, "toshiotomikawa: Firefox add-ons, agent tools and small Windows utilities. A slowly turning sunflower of dots.",
    css + `.n{display:none}.s{transform-origin:${cx}px ${cy}px}` + small,
    card(W, H, t) + `<g class="s"><g class="f" fill="${t.fg}">${dots.join("")}</g></g>` +
    `<g class="w">${name.svg + line.svg}</g><g class="n">${phone.map((p) => p.svg).join("")}</g>`, ".f circle{opacity:.6}");
}

/* --------------------------------------------------------------- tiles */
// Each tile: a small moving picture in the top five lines, then the name and one line about it.
const TW = 282, TH = 8 * U + 6, MX = TW / 2, MY = 6 + 2.5 * U;

const PICTURES = {
  // The same "Aa" in seven typefaces, one after another.
  firefonts(t) {
    const files = ["Allo-Regular.ttf", "EBGaramond.ttf", "Pacifico-Regular.ttf", "FiraCode.ttf", "Oswald.ttf", "Literata.ttf", "Caveat.ttf"];
    const slot = 1.5, T = slot * files.length;
    const css = `.a{opacity:0;animation:aa ${T}s linear infinite}@keyframes aa{0%{opacity:0}2%{opacity:1}12.3%{opacity:1}14.3%{opacity:0}}`;
    const glyphs = files.map((f, i) => text(font(f), "Aa", MX, MY + 18, 56, t.fg, { anchor: "middle", features: [], attrs: ` class="a" style="animation-delay:${i * slot - T}s"` }).svg);
    return { css, svg: glyphs.join(""), still: ".a:first-of-type{opacity:1}" };
  },
  // A list of videos; the middle one fades out and gets struck through.
  "yt-filter"(t) {
    const x = MX - 86, rows = [MY - 36, MY, MY + 36];
    const css = `.h{animation:hide 5s ease-in-out infinite}@keyframes hide{0%,25%{opacity:1}35%,80%{opacity:.2}90%,100%{opacity:1}}` +
      `.s{stroke-dasharray:1 2;stroke-dashoffset:1.1;animation:strike 5s ease-in-out infinite}@keyframes strike{0%,22%{stroke-dashoffset:1.1}32%,82%{stroke-dashoffset:0}90%,100%{stroke-dashoffset:1.1}}`;
    const row = (y, i) => `<g${i === 1 ? ' class="h"' : ""}><rect x="${x}" y="${y - 12}" width="40" height="24" rx="4" fill="${t.fg}" opacity=".85"/>` +
      `<rect x="${x + 52}" y="${y - 7}" width="120" height="6" rx="3" fill="${t.fg}"/><rect x="${x + 52}" y="${y + 3}" width="70" height="5" rx="2.5" fill="${t.muted}"/></g>`;
    return { css, still: ".h{opacity:.2}.s{stroke-dashoffset:0}", svg: rows.map(row).join("") + `<line class="s" pathLength="1" x1="${x - 6}" y1="${MY}" x2="${x + 178}" y2="${MY}" stroke="${t.fg}" stroke-width="2" stroke-linecap="round"/>` };
  },
  // Three usage bars filling to different levels.
  AgentUsage(t) {
    const x = MX - 80, levels = [0.82, 0.55, 0.3];
    const css = `.b{transform-box:fill-box;transform-origin:0 50%;transform:scaleX(0);animation:5s cubic-bezier(.2,.8,.2,1) infinite}`;
    const keys = levels.map((v, i) => `@keyframes f${i}{0%{transform:scaleX(0)}40%,80%{transform:scaleX(${v})}95%,100%{transform:scaleX(0)}}`).join("");
    const bars = levels.map((v, i) => {
      const y = MY - 24 + i * 24 - 4;
      return `<rect x="${x}" y="${y}" width="160" height="8" rx="4" fill="${t.fg}" opacity=".15"/><rect class="b b${i}" style="animation-name:f${i};animation-delay:${i * 0.15}s" x="${x}" y="${y}" width="160" height="8" rx="4" fill="${t.fg}"/>`;
    });
    return { css: css + keys, svg: bars.join(""), still: levels.map((v, i) => `.b.b${i}{transform:scaleX(${v})}`).join("") };
  },
  // A folder path typed out, letter by letter.
  "copy-as-path"(t) {
    const s = "C:\\Projects\\notes.txt";
    // Monospaced, so every step of the typing uncovers exactly one letter.
    const w = text(font("FiraCode.ttf"), s, MX, MY + 6, 16, t.fg, { anchor: "middle", features: [] });
    const x0 = MX - w.width / 2, n = s.length, W = w.width.toFixed(2);
    const css = `.c{transform-box:fill-box;transform-origin:100% 50%;animation:cover 6s infinite}@keyframes cover{0%{transform:scaleX(1);animation-timing-function:steps(${n})}50%,90%{transform:scaleX(0);animation-timing-function:step-end}100%{transform:scaleX(1)}}` +
      `.k{animation:type 6s infinite,blink 1s step-end infinite}@keyframes type{0%{transform:translateX(0);animation-timing-function:steps(${n})}50%,90%{transform:translateX(${W}px);animation-timing-function:step-end}100%{transform:translateX(0)}}@keyframes blink{50%{opacity:0}}`;
    return { css, still: `.c{display:none}.k{transform:translateX(${W}px)}`, svg: w.svg + `<rect class="c" x="${x0.toFixed(2)}" y="${MY - 16}" width="${W}" height="28" fill="${t.bg}"/><rect class="k" x="${(x0 - 1).toFixed(2)}" y="${MY - 11}" width="2" height="22" fill="${t.fg}"/>` };
  },
  // A ring and a tick that draw themselves: a decision, signed off.
  A2H(t) {
    const css = `.r{stroke-dasharray:1 2;animation:ring 4s ease-in-out infinite}@keyframes ring{0%{stroke-dashoffset:1.1}30%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:-1.1}}` +
      `.t{stroke-dasharray:1 2;animation:tick 4s ease-in-out infinite}@keyframes tick{0%,25%{stroke-dashoffset:1.1}45%,85%{stroke-dashoffset:0}100%{stroke-dashoffset:-1.1}}`;
    return { css, svg: `<g fill="none" stroke="${t.fg}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle class="r" pathLength="1" cx="${MX}" cy="${MY}" r="30" transform="rotate(-90 ${MX} ${MY})"/><path class="t" pathLength="1" d="M${MX - 12} ${MY + 1}l8 8l16 -17"/></g>` };
  },
  // Two agents with messages crossing between them both ways.
  "a2a-bridge"(t) {
    const L = MX - 70, Rr = MX + 70, a = L + 22, b = Rr - 22;
    const css = `.p{animation:go 2.4s linear infinite}@keyframes go{0%{transform:translateX(0);opacity:0}15%,85%{opacity:1}100%{transform:translateX(${b - a}px);opacity:0}}` +
      `.q{animation:back 2.4s linear infinite}@keyframes back{0%{transform:translateX(0);opacity:0}15%,85%{opacity:1}100%{transform:translateX(${a - b}px);opacity:0}}`;
    const node = (x) => `<rect x="${x - 18}" y="${MY - 18}" width="36" height="36" rx="8" fill="none" stroke="${t.fg}" stroke-width="2"/><circle cx="${x}" cy="${MY}" r="4" fill="${t.fg}"/>`;
    const lane = (y) => `<line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${t.fg}" opacity=".15" stroke-width="2"/>`;
    const dots = [0, 0.8, 1.6].map((d) => `<circle class="p" style="animation-delay:-${d}s" cx="${a}" cy="${MY - 8}" r="3" fill="${t.fg}"/><circle class="q" style="animation-delay:-${(d + 0.4).toFixed(1)}s" cx="${b}" cy="${MY + 8}" r="3" fill="${t.fg}"/>`);
    return { css, still: ".p,.q{display:none}", svg: node(L) + node(Rr) + lane(MY - 8) + lane(MY + 8) + dots.join("") };
  },
  // Four squares trading places.
  shuffles(t) {
    const size = 28, gap = 12, x0 = MX - (4 * size + 3 * gap) / 2, step = size + gap;
    const perms = [[0, 1, 2, 3], [2, 0, 3, 1], [3, 2, 1, 0], [1, 3, 0, 2]];
    let css = "";
    const squares = [0, 1, 2, 3].map((i) => {
      const at = (k) => (perms[k % 4][i] - i) * step;
      const frames = [0, 1, 2, 3].map((k) => `${k * 25}%,${k * 25 + 15}%{transform:translateX(${at(k)}px)}`).join("") + `100%{transform:translateX(${at(0)}px)}`;
      css += `@keyframes s${i}{${frames}}`;
      return `<rect style="animation:s${i} 8s cubic-bezier(.6,0,.2,1) infinite" x="${x0 + i * step}" y="${MY - size / 2}" width="${size}" height="${size}" rx="6" fill="${t.fg}" opacity="${(0.49 + i * 0.17).toFixed(2)}"/>`;
    });
    return { css, svg: squares.join("") };
  },
  // Two identical pictures; the copy slides into the original and is gone.
  DeletesDupes(t) {
    const pic = (x, cls) => `<g${cls}><rect x="${x - 28}" y="${MY - 22}" width="56" height="44" rx="6" fill="none" stroke="${t.fg}" stroke-width="2"/>` +
      `<path d="M${x - 20} ${MY + 14}l12 -14l9 9l6 -6l13 11z" fill="${t.fg}"/><circle cx="${x + 10}" cy="${MY - 9}" r="4" fill="${t.fg}"/></g>`;
    const css = `.d{${box}animation:dupe 5s ease-in-out infinite}@keyframes dupe{0%,30%{transform:none;opacity:1}55%,85%{transform:translateX(-80px) scale(.6);opacity:0}86%{transform:none;opacity:0}100%{opacity:1}}`;
    return { css, svg: pic(MX - 40, "") + pic(MX + 40, ' class="d"') };
  },
  // A hub sending pulses out to five sessions.
  AgentNodes(t) {
    const r = 40, nodes = [0, 1, 2, 3, 4].map((i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return [MX + r * Math.cos(a), MY + r * Math.sin(a)];
    });
    let css = "";
    const parts = nodes.map(([x, y], i) => {
      const dx = (x - MX).toFixed(1), dy = (y - MY).toFixed(1);
      css += `@keyframes n${i}{0%{transform:translate(0,0);opacity:0}10%{opacity:1}60%{transform:translate(${dx}px,${dy}px);opacity:1}75%,100%{transform:translate(${dx}px,${dy}px);opacity:0}}`;
      return `<line x1="${MX}" y1="${MY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${t.fg}" opacity=".2" stroke-width="2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${t.fg}"/>` +
        `<circle style="animation:n${i} 2.5s ease-out infinite;animation-delay:-${i * 0.5}s;opacity:0" cx="${MX}" cy="${MY}" r="2.5" fill="${t.fg}"/>`;
    });
    return { css, svg: parts.join("") + `<circle cx="${MX}" cy="${MY}" r="7" fill="${t.fg}"/>` };
  },
};

export const TILES = [
  ["firefonts", "Firefonts", "Your font on the sites you choose"],
  ["yt-filter", "yt-filter", "Hides YouTube videos by title words"],
  ["AgentNodes", "AgentNodes", "A live map of your agent sessions"],
  ["a2a-bridge", "a2a-bridge", "Coding agents talking over A2A"],
  ["AgentUsage", "AgentUsage", "Agent quotas in a small desktop app"],
  ["A2H", "A2H", "Human sign-off for agent actions"],
  ["shuffles", "shuffles", "Shuffles file names into sequences"],
  ["DeletesDupes", "DeletesDupes", "Recycles duplicate image files"],
  ["copy-as-path", "copy-as-path", "Copy as path on any folder"],
];

function tile([repo, title, about], t) {
  const pic = PICTURES[repo](t);
  const name = text(ALLO.bold, title, 6 + U, 6 + 6.5 * U, 16, t.fg);
  const line = text(ALLO.regular, about, 6 + U, 6 + 7.4 * U, 13, t.muted);
  if (line.width > TW - 12 - 2 * U) console.warn(`${repo}: description is ${Math.round(line.width)}px, wider than the tile`);
  // On a phone a tile is drawn at about 0.42 of its size: only the name stays, twice as large and centred; the line about it stays in the alt text.
  const big = text(ALLO.bold, title, MX, 6 + 7 * U, 32, t.fg, { anchor: "middle" });
  if (big.width > TW - 12 - U) console.warn(`${repo}: phone name is ${Math.round(big.width)}px, wider than the tile`);
  const css = pic.css + `.n{display:none}@media (max-width:${PHONE.tile}px){.w{display:none}.n{display:inline}}`;
  return doc(TW, TH, `${title}: ${about}.`, css, card(TW, TH, t, 0) + pic.svg + `<g class="w">${name.svg + line.svg}</g><g class="n">${big.svg}</g>`, pic.still);
}

for (const theme of Object.keys(THEMES)) {
  const t = THEMES[theme];
  write("hero", theme, hero(t));
  for (const row of TILES) write(`tile-${row[0]}`, theme, tile(row, t));
}
console.log(`Wrote ${2 * (1 + TILES.length)} images to assets/`);

// The README is only these images, each linked; written here so it always matches the tiles.
const pic = (name, alt, width) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg"><img src="assets/${name}-light.svg" width="${width}" alt="${esc(alt)}"></picture>`;
const readme = [
  pic("hero", "toshiotomikawa: Firefox add-ons, agent tools and small Windows utilities.", "100%"),
  `<p align="center"><a href="https://toshiotomikawa.github.io/">Portfolio</a> &nbsp;·&nbsp; <a href="https://tomiesl.com.br/">Tomi ESL</a></p>`,
  `<p align="center">${TILES.map(([repo, title, about]) => `<a href="https://github.com/toshiotomikawa/${repo}">${pic(`tile-${repo}`, `${title}: ${about}.`, "33.3%")}</a>`).join("")}</p>`, // a third each, so rows stay three wide at any page width
].join("\n\n");
fs.writeFileSync(path.join(HERE, "..", "README.md"), readme + "\n");
