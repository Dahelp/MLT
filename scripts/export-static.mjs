import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "static-export");
const port = 4173;
const origin = `http://127.0.0.1:${port}`;
const routes = [
  "/",
  "/plan",
  "/proposal",
  "/collections/freedom",
  "/collections/signature",
  "/collections/concierge",
  "/collections/private",
  "/fleet/explorer",
  "/fleet/granduca",
  "/fleet/compatto",
  "/legal/imprint",
  "/legal/privacy",
  "/legal/terms",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, "dist", "client"), output, { recursive: true });

const server = spawn(process.execPath, [
  path.join(root, "node_modules", "vinext", "dist", "cli.js"),
  "start",
  "--port",
  String(port),
], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });

let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error(`Preview server did not start.\n${serverLog}`);

  for (const route of routes) {
    const response = await fetch(`${origin}${route}`);
    if (!response.ok) throw new Error(`Failed to render ${route}: ${response.status}`);
    const html = await response.text();
    const target = route === "/"
      ? path.join(output, "index.html")
      : path.join(output, route.slice(1), "index.html");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, "utf8");
  }
} finally {
  server.kill();
}

console.log(`Static preview exported to ${output}`);

