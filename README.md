<p align="center">
  <img src="public/assets/whattimeba-logo.svg" alt="whattimeba.com" width="520">
</p>

# whattimeba.com

**A fast, privacy-friendly meeting time translator for remote workers, freelancers, clients, and distributed teams.**

Live domain: [whattimeba.com](https://whattimeba.com/)  
Repository: [github.com/tpbmartinez/whattimeba](https://github.com/tpbmartinez/whattimeba)

Paste a normal message such as **“Thursday 5pm EST”** and whattimeba.com converts it to the visitor's local timezone. It also calls out date changes, ambiguous abbreviations, and common daylight-saving mistakes instead of quietly guessing.

## Why it exists

Timezone tools are often accurate but still make people think like timezone experts. whattimeba.com is designed around the question people actually have: **“What time is that for me?”**

A key example is the difference between literal **EST (UTC−5)** and **Eastern Time / New York**, which may be observing **EDT (UTC−4)** depending on the date. The app shows the difference when it matters.

## Features

- Automatic browser timezone detection
- Natural-language meeting input
- Manual date, time, and timezone fallback
- IANA timezone conversion using the browser's `Intl` implementation
- EST/EDT, PST/PDT, and similar seasonal abbreviation checks
- CST and IST ambiguity prompts instead of unsafe guessing
- DST gap and repeated-hour protection
- Next-day and previous-day indicators
- Human-friendly time-of-day labels
- Copyable meeting confirmation
- Shareable meeting URLs
- Google Calendar links
- `.ics` calendar downloads
- Responsive, mobile-first interface
- No account, database, analytics SDK, or API required for the MVP
- No third-party runtime JavaScript dependencies

## Privacy and security

Meeting conversion happens in the browser. The MVP does not send entered meeting text to an application server and does not require an account.

The production Cloudflare configuration adds a restrictive Content Security Policy, clickjacking protection, MIME-sniffing protection, HSTS, a limited Permissions Policy, and conservative referrer handling. URL-derived values are validated, and the UI uses text/DOM APIs rather than injecting untrusted HTML.

See [`SECURITY.md`](SECURITY.md) for security reporting and design notes.

## Project structure

```text
whattimeba/
├── .github/                 # CI, issue and pull-request templates
├── local-test/              # README plus generated standalone test build (HTML ignored by Git)
├── public/                  # Production site deployed to Cloudflare
│   ├── assets/
│   ├── js/
│   ├── _headers
│   ├── index.html
│   ├── robots.txt
│   ├── site.webmanifest
│   ├── sitemap.xml
│   └── styles.css
├── scripts/
├── tests/
├── BRAND.md
├── CONTRIBUTING.md
├── LICENSE
├── NOTICE
├── SECURITY.md
├── package.json
└── wrangler.jsonc
```

## Run locally

The production JavaScript uses ES modules, so serve the `public` folder locally:

```bash
cd public
python3 -m http.server 8080
```

Open `http://localhost:8080`.

### Standalone local test

To create a single HTML file that can be double-clicked without a server:

```bash
npm run build:local
```

Then open `local-test/whattimeba-local-test.html`. The generated HTML is intentionally ignored by Git because it embeds the production assets and JavaScript; rebuild it locally when needed.

## QA and tests

Requires Node.js 20 or newer.

```bash
npm run qa
```

The QA command rebuilds the standalone local version and runs timezone/parser tests plus security/static checks. Pull requests also run the same checks through GitHub Actions.

Important behaviour covered by tests includes:

- literal EST versus daylight-saving-aware Eastern Time
- next-day Manila conversion
- CST ambiguity handling
- London and Sydney parsing
- DST spring-forward gaps
- DST fall-back repeated hours
- validation of shared URL timezone data
- absence of common DOM injection patterns
- required production security headers

## Deployment QA

The repository has two complementary GitHub Actions checks:

- **QA** validates the parser, timezone logic, generated local build, and static security rules.
- **Live deployment QA** checks the deployed Cloudflare Pages site after pushes to `main`, including required assets, production security headers, caching, SEO files, and 404 behaviour.

## Cloudflare deployment

### Cloudflare Pages

1. Connect this GitHub repository to Cloudflare Pages.
2. Framework preset: `None`.
3. Build command: `exit 0`.
4. Build output directory: `public`.
5. Deploy.
6. Add `whattimeba.com` as the custom domain.

The repository also includes `wrangler.jsonc` for Cloudflare Workers static assets if the project later moves to Workers.

## Project status and roadmap

The repository currently contains the first public MVP. The near-term roadmap includes:

- broader natural-language timezone coverage
- improved meeting overlap and working-hours suggestions
- additional accessibility and mobile QA
- more timezone/DST regression tests
- optional installable PWA improvements

Please open an issue before starting a large feature so effort is not duplicated.

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), run `npm run qa`, and open a pull request with a focused change. Timezone correctness is more important than guessing: ambiguous user input should stay explicit.

## License

Source code is licensed under the **GNU General Public License v3.0 only (GPL-3.0-only)**. See [`LICENSE`](LICENSE).

GPL-3.0 is intentional: people can inspect, modify, and redistribute the code, while redistributed modified versions must preserve the same software freedoms. If the goal later changes toward maximum permissive reuse in commercial/proprietary products, Apache-2.0 would be a reasonable alternative, but GPL-3.0 fits this community-contribution model well.

**Brand exception:** the whattimeba.com name, rabbit-clock logo, wordmark, and related brand artwork are not licensed under GPL. See [`BRAND.md`](BRAND.md).

## Maintainer

Maintained and developed by [Tim Martinez](https://timothypaulmartinez.com/).

Copyright © 2026 Tim Martinez.
