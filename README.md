# MrEz / Zudin987 tools

The project directory at **[zudin987.github.io](https://zudin987.github.io/)**. Short introductions, requirements and download links for Windows, Android and BPSR tools.

This is a static GitHub Pages site. Its project pages come from `data/projects.json`, the shared template and `scripts/build.py`. `release-meta.js` adds current release dates and direct downloads when GitHub's API is available; the GitHub Releases links remain usable fallbacks. Pages publishes committed files from `main`.

## Documentation standard

Keep the homepage concise and each project page focused on **what it does, requirements, a three-step quick start and important limitations**. The project's GitHub README is the user-facing installation guide, not a copy of its changelog or technical design.

Use a consistent README order: **purpose → latest download and website → key features → requirements → quick start → important safety/privacy notes → further reading**. A short project may need fewer sections; a relay or file-modifying tool must keep its safety instructions visible. Put long implementation notes, tuning, release validation and advanced troubleshooting into linked documents rather than deleting them. Prefer stable `/releases/latest` links to hard-coded versions. Keep names, instructions and platform requirements consistent with `data/projects.json`.

## Update a project

1. Edit [`data/projects.json`](data/projects.json). Verify feature claims, file names and requirements against the project repository and published releases.
2. Run `python3 scripts/build.py` (or `python scripts/build.py` on Windows).
3. Commit the metadata and generated pages together. Keep existing project slugs so links remain valid.

The shared page shell is in [`templates/base.html`](templates/base.html), the visual styles in [`styles.css`](styles.css), and direct asset selection in [`release-meta.js`](release-meta.js). The generator also maintains the sitemap, 404 page and `/projects/` directory redirect. No third-party Python or Node packages are required.

## Preview and check

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Check both a phone and desktop layout after design changes. Before committing, verify generated files:

```sh
python3 scripts/build.py --check
```

Store genuine screenshots in `assets/screenshots/` and record their origins. Do not substitute mock application interfaces.

## Screenshot source

- `assets/screenshots/bluemeter-expanded.png`: unchanged screenshot from [`BPSR-BlueMeter-Lite/docs/screenshots`](https://github.com/Zudin987/BPSR-BlueMeter-Lite/tree/main/docs/screenshots).

BPSR tools are unofficial community projects and are not affiliated with the game's developers or publishers. Each application's license and third-party notices remain in its own repository.
