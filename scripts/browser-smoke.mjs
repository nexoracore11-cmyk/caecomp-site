import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3100";
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = process.env.SMOKE_OUTPUT_DIR ?? join(tmpdir(), "caecomp-browser-smoke");
const port = 9333;
await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${join(outputDir, "profile")}`,
  "about:blank",
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { return await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await delay(100); }
  }
  throw new Error("Chrome não abriu a porta de depuração.");
}

let socket;
let sequence = 0;
const pending = new Map();
const events = new Map();
function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
function waitEvent(method) {
  return new Promise((resolve) => {
    const callbacks = events.get(method) ?? [];
    callbacks.push(resolve);
    events.set(method, callbacks);
  });
}

try {
  await waitForDebugger();
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  const consoleErrors = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id); pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") consoleErrors.push(message.params.exceptionDetails.text);
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") consoleErrors.push(message.params.entry.text);
    const callbacks = events.get(message.method);
    if (callbacks?.length) callbacks.shift()(message.params);
  });
  await Promise.all([command("Page.enable"), command("Runtime.enable"), command("Log.enable")]);

  const routes = ["/", "/noticias", "/eventos", "/eventos/jornada-stack", "/produtos", "/vendinhas", "/oportunidades", "/documentos", "/documentos/matriz-curricular-pdf", "/galeria", "/olhares", "/olhares/pretinha", "/pretinha", "/sobre", "/admin/login"];
  const results = [];
  for (const viewport of [{ name: "desktop", width: 1440, height: 1000, mobile: false }, { name: "mobile", width: 390, height: 844, mobile: true }]) {
    await command("Emulation.setDeviceMetricsOverride", { width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile });
    for (const route of routes) {
      const loaded = waitEvent("Page.loadEventFired");
      await command("Page.navigate", { url: `${baseUrl}${route}` });
      await loaded;
      await delay(150);
      const evaluated = await command("Runtime.evaluate", { expression: `JSON.stringify({title:document.title,h1:document.querySelector('h1')?.textContent?.trim()||'',clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,bodyText:document.body.innerText.slice(0,300)})`, returnByValue: true });
      const page = JSON.parse(evaluated.result.value);
      results.push({ viewport: viewport.name, route, ...page, overflow: page.scrollWidth > page.clientWidth + 1 });
      if (route === "/") {
        const theme=await command("Runtime.evaluate",{expression:`(()=>{const before=document.documentElement.dataset.theme;document.querySelector('.theme-toggle')?.click();return before!==document.documentElement.dataset.theme})()`,returnByValue:true});
        if(theme.result.value!==true)consoleErrors.push("Alternância de tema falhou");
        const capture = await command("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
        await writeFile(join(outputDir, `home-${viewport.name}.png`), Buffer.from(capture.data, "base64"));
      }
    }
  }
  const failures = results.filter((result) => !result.h1 || result.overflow || /Application error|Internal Server Error/i.test(result.bodyText));
  const report = { ok: failures.length === 0 && consoleErrors.length === 0, baseUrl, results, consoleErrors, failures };
  await writeFile(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (!report.ok) process.exitCode = 1;
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill();
}
