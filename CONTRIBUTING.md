# Contributing to whattimeba.com

Thanks for helping improve whattimeba.com. Contributions that make timezone conversion clearer, safer, more accessible, or more accurate are welcome.

## Before opening a pull request

1. Fork the repository and create a focused branch.
2. Keep changes small enough to review easily.
3. Run `npm run qa` before submitting.
4. Add or update tests for parser, timezone, or security-sensitive logic.
5. Avoid adding runtime dependencies unless there is a strong reason. The project intentionally has no third-party runtime JavaScript dependencies.

## Local development

```bash
cd public
python3 -m http.server 8080
```

Open `http://localhost:8080`.

For the single-file test build:

```bash
npm run build:local
```

Then open `local-test/whattimeba-local-test.html`.

## Code style

- Prefer browser-native APIs and small, readable functions.
- Treat timezone abbreviations conservatively. If an abbreviation is ambiguous, ask rather than guess.
- Render untrusted or URL-derived content with `textContent` or DOM APIs, not HTML injection.
- Keep accessibility and mobile behaviour in mind.
- Do not add analytics, trackers, cookies, or external scripts without discussing the privacy impact first.

## Pull requests

Describe what changed, why it changed, how you tested it, and any timezone/DST edge cases involved. Screenshots are helpful for visible UI changes.

By contributing, you agree that your contribution may be distributed under the repository's GPL-3.0-only source-code license. Brand assets are governed separately by `BRAND.md`.
