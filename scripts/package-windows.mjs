#!/usr/bin/env node
/**
 * Build a double-click Windows installer + a tiny portable zip.
 * The shipped app is only the WebView2 shell (~7 MB), never Chromium/Electron.
 * Leaves the live preview on :8080 alone.
 */
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const desktop = join(root, "desktop");
const tools = join(desktop, "tools");
const goBin = join(root, ".tools", "go", "bin", "go");
const serverEntry = join(root, ".vercel", "output", "functions", "__server.func", "index.mjs");
const releaseDir = join(root, "release", "windows");
const unpacked = join(releaseDir, "webview-unpacked");
const artifacts = join(root, "artifacts", "windows");
const seven = join(tools, "7zz");
const sfx = join(tools, "7zsd_All.sfx");
const sfxConfig = join(desktop, "sfx-config.txt");
const setupName = "Todoing-Setup-1.0.0.exe";
const portableName = "Todoing-Portable-1.0.0.zip";

function run(command, args, cwd = root, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

function goEnv(extra = {}) {
  return {
    PATH: `${join(root, ".tools", "go", "bin")}:${join(root, ".tools", "gopath", "bin")}:${process.env.PATH || ""}`,
    GOPATH: join(root, ".tools", "gopath"),
    GOCACHE: join(root, ".tools", "gocache"),
    GOPROXY: process.env.GOPROXY || "https://proxy.golang.org,direct",
    CGO_ENABLED: "0",
    ...extra,
  };
}

function wipe(path) {
  rmSync(path, { recursive: true, force: true });
}

function cleanStaleElectron() {
  // Previous Electron attempts left Chromium (~200–300 MB) under these names.
  for (const dir of [releaseDir, artifacts]) {
    if (!existsSync(dir)) continue;
    wipe(join(dir, "win-unpacked"));
    for (const name of readdirSync(dir)) {
      if (/rishi|electron|nsis/i.test(name) && !/todoing/i.test(name)) {
        wipe(join(dir, name));
      }
    }
  }
}

async function main() {
  mkdirSync(releaseDir, { recursive: true });
  mkdirSync(artifacts, { recursive: true });
  cleanStaleElectron();
  if (!existsSync(goBin)) {
    throw new Error("Go toolchain missing under .tools/go");
  }
  if (!existsSync(serverEntry)) {
    console.log("[dist:win] production web build missing — running npm run build");
    await run("npm", ["run", "build"]);
  }
  await run("python3", [join(root, "scripts", "make-desktop-icon.py")]);
  console.log("[dist:win] exporting static web into desktop/www");
  await run("node", [join(root, "scripts", "export-desktop-web.mjs")]);
  console.log("[dist:win] fetching Go modules");
  await run(goBin, ["mod", "tidy"], desktop, goEnv());
  try {
    console.log("[dist:win] embedding icon");
    await run(
      goBin,
      ["run", "github.com/akavel/rsrc@v0.10.2", "-arch", "amd64", "-manifest", "app.manifest", "-ico", "build/icon.ico", "-o", "rsrc_windows_amd64.syso"],
      desktop,
      goEnv({ GOOS: process.platform === "win32" ? "windows" : "linux", GOARCH: "amd64" }),
    );
  } catch (error) {
    console.warn("[dist:win] icon embed skipped", error);
  }
  const exePath = join(unpacked, "Todoing.exe");
  wipe(unpacked);
  mkdirSync(unpacked, { recursive: true });
  console.log("[dist:win] cross-compiling WebView2 shell");
  await run(
    goBin,
    ["build", "-trimpath", "-ldflags=-H windowsgui -s -w", "-o", exePath, "."],
    desktop,
    goEnv({ GOOS: "windows", GOARCH: "amd64" }),
  );
  if (!existsSync(exePath)) throw new Error("Todoing.exe was not produced");
  copyFileSync(join(desktop, "使用说明.txt"), join(unpacked, "使用说明.txt"));
  if (!existsSync(seven) || !existsSync(sfx)) {
    throw new Error("missing desktop/tools/7zz or 7zsd_All.sfx");
  }

  const archive = join(releaseDir, "todoing-app.7z");
  wipe(archive);
  console.log("[dist:win] compressing installer");
  await run(seven, ["a", "-t7z", "-mx=9", "-mmt=2", archive, "."], unpacked);
  const payload = Buffer.concat([readFileSync(sfx), readFileSync(sfxConfig), readFileSync(archive)]);
  if (payload.subarray(0, 2).toString("ascii") !== "MZ") {
    throw new Error("SFX module is not a Windows executable");
  }
  const setupPath = join(releaseDir, setupName);
  writeFileSync(setupPath, payload);

  for (const name of readdirSync(artifacts)) {
    if (name !== setupName) wipe(join(artifacts, name));
  }
  copyFileSync(setupPath, join(artifacts, setupName));
  wipe(archive);
  wipe(join(releaseDir, portableName));

  const exeMb = (readFileSync(exePath).length / 1024 / 1024).toFixed(1);
  const setupMb = (payload.length / 1024 / 1024).toFixed(1);
  console.log(`[dist:win] ${setupName} ${setupMb} MB  |  Todoing.exe ${exeMb} MB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
