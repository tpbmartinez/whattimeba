import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const publicDir = path.join(root, "public");
const outputDir = path.join(root, "local-test");
fs.mkdirSync(outputDir, { recursive: true });

let html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(publicDir, "styles.css"), "utf8");
let time = fs.readFileSync(path.join(publicDir, "js", "time.js"), "utf8");
let app = fs.readFileSync(path.join(publicDir, "js", "app.js"), "utf8");

// The production build uses ES modules. The standalone file combines them so
// it can be opened directly from file:// without a local web server.
time = time.replace(/^export\s+/gm, "");
app = app.replace(/^import\s*\{[\s\S]*?\}\s*from\s*["']\.\/time\.js["'];\s*/m, "");

html = html.replace(/<link rel="stylesheet" href="\/styles\.css" \/>/, `<style>\n${css}\n</style>`);
html = html.replace(/\s*<link rel="manifest" href="\/site\.webmanifest" \/>\s*/, "\n");
html = html.replace(/<script type="module" src="\/js\/app\.js"><\/script>/, `<script>\n${time}\n\n${app}\n</script>`);
html = html.replace(/href="\/"/g, 'href="#"');

const assetPattern = /(src|href)="\/assets\/([^"]+)"/g;
html = html.replace(assetPattern, (full, attr, file) => {
  const filePath = path.join(publicDir, "assets", file);
  if (!fs.existsSync(filePath)) return full;
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
  const data = fs.readFileSync(filePath).toString("base64");
  return `${attr}="data:${mime};base64,${data}"`;
});

const banner = `<!-- Standalone local test build generated from production source. -->`;
html = html.replace(/<!-- SPDX-License-Identifier:[^>]+-->/, match => `${match}\n${banner}`);
fs.writeFileSync(path.join(outputDir, "whattimeba-local-test.html"), html);
fs.writeFileSync(path.join(outputDir, "README.txt"), `whattimeba.com local test\n\nDouble-click whattimeba-local-test.html. No server or installation is required.\n\nThe production project remains in ../public/. Regenerate this file with npm run build:local.\n`);
console.log("Built local-test/whattimeba-local-test.html");
