import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const origin = "http://127.0.0.1:5000";
const browser = await chromium.launch({
  channel: "msedge",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  await page.getByRole("heading", { name: "Soulforge" }).waitFor();
  await page.goto(origin + "/valley");
  await page.getByRole("button", { name: "Attack (F)" }).waitFor();
  await page.locator("canvas").click();
  const elapsed = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now();
        let frames = 0;
        function sample() {
          if (++frames === 60) resolve(performance.now() - start);
          else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }),
  );
  console.log(
    "Production /valley rendered, software WebGL rAF sample:",
    Math.round(60000 / elapsed),
    "FPS",
  );
  if (process.env.SOULFORGE_QA_PNG)
    await page.screenshot({ path: process.env.SOULFORGE_QA_PNG });
  await page.getByRole("button", { name: "Pause and settings" }).click();
  await page.getByLabel("Graphics").selectOption("Low");
  await page.getByRole("button", { name: "Resume adventure" }).click();
  assert.deepEqual(errors, []);
  const script = await page.locator("script[src]").first().getAttribute("src");
  const asset = await fetch(origin + script);
  assert.match(asset.headers.get("cache-control"), /immutable/);
  console.log(
    "Hosting deep link, graphics control and immutable asset cache passed.",
  );
} finally {
  await browser.close();
}
