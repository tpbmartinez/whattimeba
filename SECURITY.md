# Security policy

## Supported version

The latest version on the `main` branch is the supported version.

## Reporting a vulnerability

Please do not publish exploit details in a public issue before a fix is available. For potentially sensitive security reports, contact the maintainer through [timothypaulmartinez.com](https://timothypaulmartinez.com/) and mention **whattimeba.com security**.

For ordinary bugs that do not expose user data or create a security risk, a public GitHub issue is appropriate.

## Security design

whattimeba.com is intentionally a static, browser-side application. It has no account system, database, server-side meeting storage, analytics SDK, or third-party runtime JavaScript dependency in the MVP. Production security headers include a restrictive Content Security Policy, frame blocking, MIME sniffing protection, a locked-down Permissions Policy, and HSTS.
