#!/usr/bin/env python3
"""Offline integrity checks for the committed website and curated project pages."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = json.loads((ROOT / 'data/projects.json').read_text(encoding='utf-8'))
ERRORS = []


class Document(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.urls = []
        self.images = []
        self.canonicals = []
        self.title = False
        self.headings = []
        self.heading_depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        identifier = a.get('id')
        if identifier:
            if identifier in self.ids:
                ERRORS.append(f'Duplicate HTML id: {identifier}')
            self.ids.add(identifier)
        if tag in ('a', 'link') and a.get('href'):
            self.urls.append(a['href'])
        if tag == 'img':
            self.images.append(a)
            if a.get('src'):
                self.urls.append(a['src'])
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonicals.append(a.get('href'))
        if tag == 'title':
            self.title = True
        if tag in ('h1', 'h2', 'h3'):
            self.heading_depth = 1

    def handle_data(self, value):
        if self.heading_depth:
            self.headings.append(value.strip())

    def handle_endtag(self, tag):
        if tag in ('h1', 'h2', 'h3'):
            self.heading_depth = 0


def locate(url):
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not parts.path:
        return None
    path = unquote(parts.path)
    if path.startswith('/'):
        candidate = ROOT / path.lstrip('/')
    else:
        candidate = CURRENT.parent / path
    if candidate.is_dir() or path.endswith('/'):
        candidate /= 'index.html'
    resolved = candidate.resolve()
    if not resolved.is_relative_to(ROOT.resolve()):
        ERRORS.append(f'Link escapes the website root: {url}')
        return None
    return resolved


slugs = [project['slug'] for project in PROJECTS]
assert len(slugs) == len(set(slugs)), 'Duplicate project slug'
assert len(PROJECTS) == 8, 'Review the inventory before changing project count'
paths = [ROOT / 'index.html', ROOT / '404.html', ROOT / 'projects/index.html']
paths += [ROOT / f'projects/{slug}/index.html' for slug in slugs]
for CURRENT in paths:
    if not CURRENT.is_file():
        ERRORS.append(f'Missing page: {CURRENT.relative_to(ROOT)}')
        continue
    document = Document()
    content = CURRENT.read_text(encoding='utf-8')
    document.feed(content)
    name = CURRENT.relative_to(ROOT).as_posix()
    if not document.title:
        ERRORS.append(f'{name}: missing title')
    if len(document.canonicals) != 1:
        ERRORS.append(f'{name}: expected exactly one canonical URL')
    if content.count('<h1') != 1:
        ERRORS.append(f'{name}: expected one H1')
    if CURRENT.parent.name in slugs:
        project = next(p for p in PROJECTS if p['slug'] == CURRENT.parent.name)
        expected = f'https://zudin987.github.io/projects/{project["slug"]}/'
        if document.canonicals != [expected]:
            ERRORS.append(f'{name}: canonical does not match metadata')
        if project['name'] not in content:
            ERRORS.append(f'{name}: missing project name')
        if f'https://github.com/Zudin987/{project["repo"]}' not in content:
            ERRORS.append(f'{name}: missing repository link')
        for section in ('Quick start', 'Requirements'):
            if section not in content:
                ERRORS.append(f'{name}: missing {section} section')
        if '/releases' not in content:
            ERRORS.append(f'{name}: missing release/build link')
    for image in document.images:
        if not image.get('alt', '').strip():
            ERRORS.append(f'{name}: image needs descriptive alt text')
    for url in document.urls:
        target = locate(url)
        if target is not None and not target.is_file():
            ERRORS.append(f'{name}: missing local target {url}')

homepage = (ROOT / 'index.html').read_text(encoding='utf-8')
for project in PROJECTS:
    if f'/projects/{project["slug"]}/' not in homepage:
        ERRORS.append(f'Homepage missing {project["slug"]}')

if ERRORS:
    raise SystemExit('Website validation failed:\n' + '\n'.join(f'- {error}' for error in ERRORS))
print(f'Validated {len(paths)} HTML pages and {len(PROJECTS)} project entries.')
