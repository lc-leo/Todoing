import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function safeStaticPath(staticRoot, urlPath) {
  const decoded = decodeURIComponent((urlPath.split("?")[0] ?? "/").replace(/^\/+/, ""));
  if (!decoded || decoded.endsWith("/")) return null;
  const full = normalize(join(staticRoot, decoded));
  const root = normalize(staticRoot);
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (full !== root && !full.startsWith(prefix)) return null;
  return full;
}

function incomingToRequest(req, origin) {
  const url = new URL(req.url ?? "/", origin);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  const method = req.method ?? "GET";
  /** @type {RequestInit} */
  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }
  return new Request(url, init);
}

async function writeResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  if (!response.body) {
    res.end();
    return;
  }
  Readable.fromWeb(response.body).pipe(res);
}

export async function startDesktopServer(outputRoot) {
  const staticRoot = join(outputRoot, "static");
  const handlerPath = join(outputRoot, "functions", "__server.func", "index.mjs");
  const mod = await import(pathToFileURL(handlerPath).href);
  const handler = mod.default;
  if (!handler || typeof handler.fetch !== "function") {
    throw new Error("Nitro server handler is missing fetch()");
  }

  const server = createServer((req, res) => {
    void (async () => {
      try {
        const urlPath = req.url ?? "/";
        const filePath = safeStaticPath(staticRoot, urlPath);
        if (filePath) {
          try {
            const info = await stat(filePath);
            if (info.isFile()) {
              const body = await readFile(filePath);
              res.writeHead(200, {
                "content-type": MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream",
                "cache-control": urlPath.startsWith("/assets/")
                  ? "public, max-age=31536000, immutable"
                  : "no-cache",
              });
              res.end(body);
              return;
            }
          } catch {
            /* fall through to SSR */
          }
        }

        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : 0;
        const origin = `http://127.0.0.1:${port}`;
        const request = incomingToRequest(req, origin);
        const response = await handler.fetch(request, { waitUntil() {} });
        await writeResponse(res, response);
      } catch (error) {
        console.error("[todoing-desktop] request failed", error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("Todoing 桌面版启动失败");
        }
      }
    })();
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return {
    server,
    port,
    url: `http://127.0.0.1:${port}`,
  };
}
