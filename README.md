# MrEz / Zudin987 tools

Project directory: **[zudin987.github.io](https://zudin987.github.io/)**. Short introductions, download links and setup guidance for Windows, Android and Blue Protocol: Star Resonance tools.

The site is static and published from `main` through GitHub Pages. `data/projects.json` defines the eight homepage entries and provides new-project scaffolding. `scripts/build.py` generates the homepage, sitemap, 404 and directory redirect. **Existing project detail pages are curated HTML**, because they contain genuine screenshots, galleries and project-specific metadata that the basic scaffold cannot recreate. The generator preserves them; edit `projects/<slug>/index.html` alongside `data/projects.json` when project information changes.

`release-meta.js` resolves exact release files when the public GitHub API is available, with a short-lived browser cache. Original GitHub Releases links remain safe fallbacks. It never guesses a different binary if the expected asset is absent.

## Documentation standard

Keep the homepage concise and project pages focused on **what it does, requirements, a quick start and important limitations**. GitHub READMEs are the user-facing installation guides, not copies of changelogs or technical designs. A practical order is purpose → downloads and website → key features → requirements → quick start → safety/privacy → further reading. Short projects may need fewer sections; retain full network, backup and privacy warnings where necessary. Move extended technical information into linked documents, but keep one authoritative installation guide.

## Update a project

1. Verify current features, release assets and requirements against the relevant app repository. Update `data/projects.json`.
2. Edit its existing `projects/<slug>/index.html`, including its title, canonical URL, setup steps, screenshots and Open Graph metadata where applicable. For a new project, running the generator scaffolds a basic page to customize.
3. Run `python3 scripts/build.py`, then `python3 scripts/build.py --check` and `python3 scripts/validate_site.py`. Also run `node --check release-meta.js` after JavaScript changes. Commit metadata and affected HTML together.

The shared page shell for newly generated pages is `templates/base.html`; styles are in `styles.css`. The CI workflow in `.github/workflows/site-validation.yml` checks the generated shared pages, the curated pages' essential content and internal links, and JavaScript syntax. These checks do not replace a real desktop/mobile browser and keyboard review.

## Preview

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Check narrow and desktop layouts after visual changes. Keep genuine screenshots with recorded sources; do not replace real application imagery with mockups.

## Screenshot source

- `assets/screenshots/bluemeter-expanded.png`: unchanged screenshot from [`BPSR-BlueMeter-Lite/docs/screenshots`](https://github.com/Zudin987/BPSR-BlueMeter-Lite/tree/main/docs/screenshots).

BPSR tools are unofficial community projects and are not affiliated with the game's developers or publishers. Each application's license and third-party notices remain in its own repository.
