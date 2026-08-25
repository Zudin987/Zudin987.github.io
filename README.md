# Zudin987 Tools

Static GitHub Pages hub for the public gaming, BPSR, MIDI, and streaming utilities maintained under the Zudin987 GitHub account.

Live site: **https://zudin987.github.io/**

## Site structure

- `/` — compact project directory and trust/help information.
- `/projects/bpsr-midi/` — BPSR MIDI Lite / Studio landing page.
- `/projects/bluemeter/` — BlueMeter Lite landing page and APK architecture picker.
- `/projects/custompfp/` — CustomPFP Lite landing page with prominent safety/risk information.
- `/projects/readyalert/` — BPSR Ready Alert landing page.
- `/projects/streamkit/` — Portable Stream Kit landing page.
- `404.html` — friendly missing-page fallback.
- `robots.txt` and `sitemap.xml` — basic crawler/search discovery files.

## Design priorities

1. Explain the tool's purpose before features or implementation details.
2. Keep the normal-user download path obvious and close to the top of each product page.
3. Surface requirements, unofficial behavior, and material risk before download.
4. Use semantic HTML, visible keyboard focus, large touch targets, responsive layouts, and reduced-motion support.
5. Prefer progressive enhancement: core navigation and links remain usable without JavaScript.
6. Keep performance predictable with plain HTML/CSS and minimal JavaScript; there is no framework or build step.
7. No analytics, ads, cookies, account system, database, external font, or third-party site framework.

## Release links

Stable-filename projects use GitHub's `/releases/latest/download/...` redirects so the website does not need manual version edits for every release.

BlueMeter publishes versioned APK names for multiple CPU architectures. Its product page falls back to the latest release page without JavaScript and, when JavaScript is available, uses GitHub's public releases API to resolve the matching current APK asset.

## Maintenance

Edit static source files directly and deploy through normal branch → pull request → merge workflow. GitHub Pages publishes from the root of `main`.
