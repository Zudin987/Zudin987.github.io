#!/usr/bin/env python3
"""Generate the committed GitHub Pages HTML using Python's standard library."""
import argparse
import html
import json
from pathlib import Path
from string import Template
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://zudin987.github.io"
PROJECTS = json.loads((ROOT / "data/projects.json").read_text(encoding="utf-8"))
BASE = Template((ROOT / "templates/base.html").read_text(encoding="utf-8"))


def e(value):
    return html.escape(str(value), quote=True)


def link(url, label, css="", aria=""):
    return f'<a href="{e(url)}"' + (f' class="{css}"' if css else '') + (f' aria-label="{e(aria)}"' if aria else '') + f'>{e(label)}</a>'


def repo_url(project):
    return "https://github.com/Zudin987/" + project["repo"]


def download_url(project):
    return repo_url(project) + project.get("download_path", "/releases/latest")


def items(values, tag="ul", css=""):
    return f'<{tag} class="{css}">' + ''.join(f'<li>{e(value)}</li>' for value in values) + f'</{tag}>'


def page(title, description, path, content, footer_note="Independent tools by MrEz.", extra_head=""):
    return BASE.substitute(title=e(title), description=e(description), canonical=e(SITE + path), content=content, footer_note=e(footer_note), extra_head=extra_head)


def project_row(project):
    slug, name = project["slug"], project["name"]
    download_label = "Builds" if project.get("download_path") else "Download"
    return f'''<article class="project-row" aria-labelledby="{slug}-title">
      <div class="project-copy">
        <h3 id="{slug}-title">{link('/projects/' + slug + '/', name)}</h3>
        <p>{e(project['summary'])}</p>
        <p class="project-meta"><span>{e(project['platform'])}</span><span>{e(project['note'])}</span></p>
      </div>
      <div class="row-actions">
        {link('/projects/' + slug + '/', 'View project', 'button secondary', 'View ' + name)}
        {link(download_url(project), download_label, 'text-action', download_label + ' ' + name)}
      </div>
    </article>'''


def home():
    content = '''<section class="intro" aria-labelledby="intro-title">
      <p class="eyebrow">Independent software</p>
      <h1 id="intro-title">Tools I build and use.</h1>
      <p>I’m Zudin987, also known as MrEz. I build Windows and Android tools for Blue Protocol: Star Resonance, music, streaming and Discord.</p>
    </section>'''
    for category, anchor, title, description in [
        ("bpsr", "bpsr-tools", "BPSR tools", "Unofficial community tools for Blue Protocol: Star Resonance."),
        ("other", "other-tools", "Other tools", "Streaming, Discord speech and Android build utilities."),
    ]:
        content += f'''<section id="{anchor}" class="catalog-section" aria-labelledby="{anchor}-title">
          <div class="category-heading"><h2 id="{anchor}-title">{title}</h2><p>{description}</p></div>
          <div class="project-list">{''.join(project_row(p) for p in PROJECTS if p['category'] == category)}</div>
        </section>'''
    return page("MrEz / Zudin987 · Windows, Android and BPSR tools", "Windows and Android tools by MrEz / Zudin987. Explore BPSR companions, MIDI playback, streaming and Discord TTS, with downloads and setup guides.", "/", content, "BPSR tools are unofficial and are not affiliated with the game’s developers or publishers.")


def project_page(project):
    name, repo = project["name"], repo_url(project)
    category = "BPSR tools" if project["category"] == "bpsr" else "Other tools"
    anchor = "bpsr-tools" if project["category"] == "bpsr" else "other-tools"
    content = f'''<nav class="breadcrumb" aria-label="Breadcrumb">{link('/#' + anchor, category)}<span aria-hidden="true">/</span><span aria-current="page">{e(name)}</span></nav>
      <header class="project-header">
        <p class="eyebrow">{e(project['platform'])}</p>
        <h1>{e(name)}</h1>
        <p class="lede">{e(project['description'])}</p>
        <div class="project-actions">
          {link(download_url(project), project.get('download_label', 'Download latest release'), 'button')}
          {link(repo + '#readme', 'Read documentation', 'button secondary')}
        </div>
        <div class="resource-links">{link(repo, 'View source on GitHub')}{link(repo + '/issues', 'Report an issue')}</div>
      </header>
      <div class="project-layout"><div class="project-main">
        <section aria-labelledby="features"><h2 id="features">What it does</h2>{items(project['features'], css='feature-list')}</section>'''
    if project.get("variants"):
        content += '<section aria-labelledby="editions"><h2 id="editions">Choose your edition</h2><div class="table-wrap"><table><thead><tr><th scope="col">Edition</th><th scope="col">Use it for</th></tr></thead><tbody>'
        for variant in project["variants"]:
            content += f'<tr><th scope="row">{e(variant["name"])}</th><td>{e(variant["purpose"])}<span class="filename">{e(variant["file"])}</span></td></tr>'
        content += '</tbody></table></div></section>'
    if project.get("screenshot"):
        s = project["screenshot"]
        content += f'<figure><a href="{e(s["src"])}" aria-label="Open full-size BlueMeter screenshot"><img src="{e(s["src"])}" alt="{e(s["alt"])}" width="{s["width"]}" height="{s["height"]}" loading="lazy" decoding="async"></a><figcaption>{e(s["caption"])}</figcaption></figure>'
    content += f'<section aria-labelledby="setup"><h2 id="setup">Quick start</h2>{items(project["steps"], "ol", "steps")}</section>'
    if project["docs"]:
        content += '<section aria-labelledby="docs"><h2 id="docs">Further reading</h2><ul class="doc-links">' + ''.join('<li>' + link(repo + '/blob/main/' + doc['path'], doc['label']) + '</li>' for doc in project["docs"]) + '</ul></section>'
    content += f'</div><aside class="project-aside" aria-label="Requirements and limitations"><section><h2>Requirements</h2>{items(project["requirements"])}'
    if project.get("requirement_link"):
        req = project["requirement_link"]
        content += link(req["url"], req["label"], "text-action")
    content += '</section><section><h2>Before you use it</h2>' + ''.join(f'<p>{e(note)}</p>' for note in project["notes"]) + '</section></aside></div>'
    footer = "Unofficial BPSR community tool. Not affiliated with the game’s developers or publishers." if project["category"] == "bpsr" else "Independent tools by MrEz."
    return page(name + " · MrEz / Zudin987", project["summary"], '/projects/' + project['slug'] + '/', content, footer)


def outputs():
    pages = {"index.html": home()}
    for project in PROJECTS:
        pages[f'projects/{project["slug"]}/index.html'] = project_page(project)
    pages["404.html"] = page("Page not found · MrEz / Zudin987", "This page could not be found. Browse the project directory to find a tool or its documentation.", "/404.html", '<section class="not-found"><p class="eyebrow">404</p><h1>Page not found.</h1><p>The link may be out of date. Find the tool you need in the project directory.</p>' + link('/#bpsr-tools', 'Browse projects', 'button') + '</section>', extra_head='<meta name="robots" content="noindex">')
    pages["projects/index.html"] = page("Projects · MrEz / Zudin987", "Browse Windows, Android and BPSR tools by MrEz.", "/", '<section class="not-found"><h1>Project directory</h1><p>The full project directory is on the homepage.</p>' + link('/#bpsr-tools', 'Browse all projects', 'button') + '</section>', extra_head='<meta http-equiv="refresh" content="0;url=/#bpsr-tools">')
    sitemap = ElementTree.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in ['/'] + ['/projects/' + p['slug'] + '/' for p in PROJECTS]:
        ElementTree.SubElement(ElementTree.SubElement(sitemap, "url"), "loc").text = SITE + path
    ElementTree.indent(sitemap, space="  ")
    pages["sitemap.xml"] = '<?xml version="1.0" encoding="UTF-8"?>\n' + ElementTree.tostring(sitemap, encoding="unicode") + '\n'
    return pages


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify generated files without writing them")
    args = parser.parse_args()
    generated = outputs()
    stale = []
    for path, content in generated.items():
        target = ROOT / path
        if args.check:
            if not target.exists() or target.read_text(encoding="utf-8") != content:
                stale.append(path)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
    if stale:
        raise SystemExit('Regenerate with python3 scripts/build.py: ' + ', '.join(stale))
    print(f'{"Checked" if args.check else "Generated"} {len(generated)} files.')
