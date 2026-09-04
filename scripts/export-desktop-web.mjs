#!/usr/bin/env node
/**
 * Snapshot the production SSR app into desktop/www for the WebView2 shell.
 */
import { cp, mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const www = join(root, "desktop", "www");
const output = join(root, ".vercel", "output");
const staticDir = join(output, "static");
const pages = [
  ["/", "index.html"],
  ["/widget/day", "widget/day.html"],
  ["/widget/week", "widget/week.html"],
  ["/widget/pomodoro", "widget/pomodoro.html"],
];

const INJECT = `<script>window.todoingDesktop=Object.assign({desktop:true},window.todoingDesktop||{});</script>`;

async function main() {
  if (!existsSync(join(output, "functions", "__server.func", "index.mjs"))) {
    throw new Error("missing production build — run npm run build first");
  }
  await rm(www, { recursive: true, force: true });
  await mkdir(www, { recursive: true });
  await cp(staticDir, www, { recursive: true });

  const { startDesktopServer } = await import(pathToFileURL(join(root, "desktop", "serve.mjs")).href);
  const { server, url } = await startDesktopServer(output);
  try {
    for (const [route, file] of pages) {
      const res = await fetch(url + route);
      if (!res.ok) throw new Error(`${route} -> ${res.status}`);
      let html = await res.text();
      if (!html.includes("Todoing")) throw new Error(`${route} missing app title`);
      if (html.includes("<head>")) html = html.replace("<head>", `<head>${INJECT}`);
      else if (html.includes("<head ")) html = html.replace(/<head /, `<head>${INJECT}<head `);
      const dest = join(www, file);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, html);
      console.log("[export-desktop-web]", route, "->", file, html.length, "bytes");
    }
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
