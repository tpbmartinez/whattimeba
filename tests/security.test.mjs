import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
const html = read("public/index.html");
const app = read("public/js/app.js");
const headers = read("public/_headers");

test("production HTML has no inline executable scripts", () => {
  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.equal(inlineScripts.length, 0);
});

test("client code avoids high-risk HTML injection and dynamic code execution", () => {
  for (const pattern of [/\.innerHTML\s*=/, /insertAdjacentHTML\s*\(/, /document\.write\s*\(/, /\beval\s*\(/, /new\s+Function\s*\(/]) {
    assert.equal(pattern.test(app), false, `Found disallowed pattern: ${pattern}`);
  }
});

test("external new-tab links are protected with noopener", () => {
  const links = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)].map(m => m[0]);
  assert.ok(links.length >= 2);
  for (const link of links) assert.match(link, /rel="[^"]*noopener[^"]*"/i);
});

test("Cloudflare headers include baseline browser protections", () => {
  for (const expected of [
    "Content-Security-Policy:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: DENY",
    "Strict-Transport-Security:",
    "Permissions-Policy:",
    "Referrer-Policy:",
  ]) assert.ok(headers.includes(expected), `Missing ${expected}`);
});

test("no third-party JavaScript is loaded by production HTML", () => {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/gi)].map(m => m[1]);
  assert.ok(scripts.length > 0);
  assert.ok(scripts.every(src => src.startsWith("/")), `External script found: ${scripts.join(", ")}`);
});

test("personal site attribution uses HTTPS", () => {
  assert.match(html, /href="https:\/\/timothypaulmartinez\.com\/"/);
});
