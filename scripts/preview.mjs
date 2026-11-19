// Shows the README on a page shaped like a GitHub profile, light or dark with the system. Run: npm run preview
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize, extname, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = `<!doctype html><meta charset="utf-8"><title>Profile preview</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown.min.css">
<style>body{margin:0;padding:32px 16px;background:light-dark(#fff,#0d1117);color-scheme:light dark}
.markdown-body{max-width:846px;margin:auto;padding:24px;border:1px solid light-dark(#d1d9e0,#3d444d);border-radius:6px;background:transparent}</style>
<article class="markdown-body"></article>
<script>fetch("/README.md").then(r=>r.text()).then(t=>document.querySelector("article").innerHTML=t)</script>`;

createServer(async (req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch { return res.writeHead(400).end(); }
  if (p === "/") return res.writeHead(200, { "content-type": "text/html" }).end(page);
  const file = normalize(join(root, p));
  if (!file.startsWith(root + sep)) return res.writeHead(403).end();
  let body;
  try { body = await readFile(file); } catch { return res.writeHead(404).end(); }
  res.writeHead(200, { "content-type": { ".svg": "image/svg+xml", ".md": "text/plain" }[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
  res.end(body);
}).listen(5181, "127.0.0.1", () => console.log("Preview on http://localhost:5181/"));
