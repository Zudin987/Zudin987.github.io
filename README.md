# MrEz / Zudin987 tools

The project directory at **[zudin987.github.io](https://zudin987.github.io/)**. Concise introductions, requirements and download links for Windows, Android and BPSR tools.

The site serves static HTML and one stylesheet. Navigation and downloads work without JavaScript, external fonts or runtime API calls. GitHub Pages publishes the committed files from `main` using the existing Pages workflow.

## Update a project

1. Edit [`data/projects.json`](data/projects.json). Confirm features and requirements against the project repository and published releases.
2. Run `python3 scripts/build.py` (or `python scripts/build.py` on Windows).
3. Commit the metadata and generated HTML together. Keep existing project slugs so old links continue to work.

The shared page shell is in [`templates/base.html`](templates/base.html); page generation is in [`scripts/build.py`](scripts/build.py); the visual system is in [`styles.css`](styles.css). No third-party Python packages or Node dependencies are required.

## Preview and check

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Before committing, run:

```sh
python3 scripts/build.py --check
```

Check a desktop and phone layout after CSS changes. Keep download links pointed at GitHub Releases rather than embedding a version number. The generator also maintains the sitemap, 404 page and `/projects/` directory redirect.

Real screenshots belong in `assets/screenshots/`, with their source recorded below. Do not substitute mock application interfaces.

## Screenshot source

- `assets/screenshots/bluemeter-expanded.png`: unchanged screenshot from [`BPSR-BlueMeter-Lite/docs/screenshots`](https://github.com/Zudin987/BPSR-BlueMeter-Lite/tree/main/docs/screenshots).

BPSR tools are unofficial community projects, not affiliated with the game’s developers or publishers. Licenses and third-party notices for each application remain in its own repository.
