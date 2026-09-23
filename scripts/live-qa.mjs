// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 Tim Martinez

const baseUrl = (process.env.BASE_URL || "https://whattimeba.pages.dev").replace(/\/$/, "");

const failures = [];
const passes = [];

function pass(message) {
  passes.push(message);
  console.log(`✓ ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`✗ ${message}`);
}

async function get(path, options = {}) {
  const url = new URL(path, `${baseUrl}/`).toString();
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      ...options,
    });
  } catch (error) {
    fail(`${path}: request failed: ${error.message}`);
    return null;
  }
}

function expectHeader(response, header, predicate, description) {
  const value = response.headers.get(header) || "";
  if (predicate(value)) pass(`${header}: ${description}`);
  else fail(`${header}: expected ${description}; got "${value || "(missing)"}"`);
}

const root = await get("/");
if (root) {
  if (root.ok) pass(`Homepage returned HTTP ${root.status}`);
  else fail(`Homepage returned HTTP ${root.status}`);

  const html = await root.text();

  const requiredHtml = [
    ["whattimeba.com", "brand name is present"],
    ["What time is that for me?", "main heading is present"],
    ["timothypaulmartinez.com", "maintainer link is present"],
    ["GPL-3.0-only", "license reference is present"],
    ["/js/app.js", "application script is referenced"],
    ["/styles.css", "stylesheet is referenced"],
  ];

  for (const [needle, label] of requiredHtml) {
    if (html.includes(needle)) pass(label);
    else fail(`${label}; missing "${needle}"`);
  }

  expectHeader(root, "content-security-policy", value =>
    value.includes("default-src 'self'") &&
    value.includes("script-src 'self'") &&
    value.includes("object-src 'none'") &&
    value.includes("frame-ancestors 'none'"),
    "restrictive CSP is active"
  );
  expectHeader(root, "strict-transport-security", value => /max-age=\d+/.test(value), "HSTS is active");
  expectHeader(root, "x-content-type-options", value => value.toLowerCase() === "nosniff", "nosniff is active");
  expectHeader(root, "x-frame-options", value => value.toUpperCase() === "DENY", "clickjacking protection is active");
  expectHeader(root, "referrer-policy", value => value.includes("strict-origin-when-cross-origin"), "conservative referrer policy is active");
  expectHeader(root, "permissions-policy", value => value.includes("camera=()") && value.includes("microphone=()"), "sensitive browser permissions are disabled");
}

const assets = [
  ["/styles.css", "text/css"],
  ["/js/app.js", "javascript"],
  ["/js/time.js", "javascript"],
  ["/assets/whattimeba-logo.svg", "image/svg+xml"],
  ["/assets/whattimeba-mark.svg", "image/svg+xml"],
  ["/site.webmanifest", "application/manifest+json"],
  ["/robots.txt", "text/plain"],
  ["/sitemap.xml", "xml"],
  ["/license.txt", "text/plain"],
];

for (const [path, expectedType] of assets) {
  const response = await get(path);
  if (!response) continue;
  if (response.ok) pass(`${path} returned HTTP ${response.status}`);
  else {
    fail(`${path} returned HTTP ${response.status}`);
    continue;
  }
  const type = response.headers.get("content-type") || "";
  if (type.toLowerCase().includes(expectedType.toLowerCase())) {
    pass(`${path} content type is appropriate`);
  } else {
    fail(`${path} content type "${type}" did not include "${expectedType}"`);
  }

  if (path.startsWith("/assets/")) {
    const cache = response.headers.get("cache-control") || "";
    if (/max-age=31536000/.test(cache) && /immutable/i.test(cache)) {
      pass(`${path} has long-lived immutable caching`);
    } else {
      fail(`${path} cache-control is "${cache || "(missing)"}"`);
    }
  }
}

const robots = await get("/robots.txt");
if (robots?.ok) {
  const body = await robots.text();
  if (body.includes("Sitemap: https://whattimeba.com/sitemap.xml")) pass("robots.txt points to the production sitemap");
  else fail("robots.txt does not point to https://whattimeba.com/sitemap.xml");
}

const sitemap = await get("/sitemap.xml");
if (sitemap?.ok) {
  const body = await sitemap.text();
  if (body.includes("https://whattimeba.com/")) pass("sitemap uses the production canonical domain");
  else fail("sitemap does not contain https://whattimeba.com/");
}

const missing = await get("/definitely-not-a-real-file-whattimeba.txt");
if (missing) {
  if (missing.status === 404) pass("Unknown static files return 404");
  else fail(`Unknown static file returned HTTP ${missing.status} instead of 404`);
}

console.log(`\nLive QA summary: ${passes.length} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
