#!/usr/bin/env python3
"""Guard consistent actions and avoid soliciting unmonitored issue reports.

This checks document structure, not rendered geometry. Use a real browser at phone,
tablet and desktop widths when changing the associated CSS.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = json.loads((ROOT / 'data/projects.json').read_text(encoding='utf-8'))
GROUP = re.compile(r'<div\s+class="(row-actions|project-actions)"[^>]*>(.*?)</div>', re.S)
LINK = re.compile(r'<a\s+[^>]*class="([^"]+)"[^>]*>', re.S)
FEEDBACK_LINK = re.compile(r'<a\b[^>]*href="https://github\.com/[^"\s]+/(?:issues|pulls)(?:[/?#"])[^>]*>', re.I)
FEEDBACK_PROMPT = re.compile(r'\b(?:report an issue|view pull requests|propose fixes via)\b', re.I)
errors = []

def inspect(path, group_type, expected):
    content = path.read_text(encoding='utf-8')
    matches = [(kind, LINK.findall(inner)) for kind, inner in GROUP.findall(content)]
    actual = [links for kind, links in matches if kind == group_type]
    if len(actual) != expected:
        errors.append(f'{path.relative_to(ROOT)}: expected {expected} {group_type} groups, got {len(actual)}')
    for number, links in enumerate(actual, 1):
        if len(links) != 2:
            errors.append(f'{path.relative_to(ROOT)} group {number}: expected exactly two equal-size actions; got {len(links)}')
        if group_type == 'project-actions' and (not links or 'button' not in links[0].split()):
            errors.append(f'{path.relative_to(ROOT)}: first action must use the shared button style')
        if group_type == 'row-actions' and len(links) == 2 and ('button' not in links[0].split() or 'text-action' not in links[1].split()):
            errors.append(f'{path.relative_to(ROOT)}: homepage actions must use the shared catalog button classes')
    return content

inspect(ROOT / 'index.html', 'row-actions', len(PROJECTS))
for project in PROJECTS:
    page = ROOT / 'projects' / project['slug'] / 'index.html'
    content = inspect(page, 'project-actions', 1)
    if project['slug'] in ('bluemeter', 'bpsr-midi') and 'Read documentation</a>' not in content.split('class="resource-links"', 1)[-1].split('</div>', 1)[0]:
        errors.append(f'{page.relative_to(ROOT)}: documentation fallback missing in resource links')

# Do not advertise feedback channels that the site owner does not receive.
# Scan all pages, including the homepage, error page and directory redirect.
for page in ROOT.rglob('*.html'):
    if 'templates' in page.parts:
        continue
    content = page.read_text(encoding='utf-8')
    if FEEDBACK_LINK.search(content) or FEEDBACK_PROMPT.search(content):
        errors.append(f'{page.relative_to(ROOT)}: unmonitored issue-report or pull-request invitation')

scaffold = (ROOT / 'scripts/build.py').read_text(encoding='utf-8')
if 'Report an issue' in scaffold or 'View pull requests' in scaffold:
    errors.append('scripts/build.py: project scaffold must not recreate report links')

css = (ROOT / 'styles.css').read_text(encoding='utf-8')
for selector in ('.row-actions > :is(.button, .text-action)', '.project-actions > .button', '.project-highlight-grid > article'):
    if selector not in css:
        errors.append(f'styles.css: missing shared UI selector {selector}')

if errors:
    raise SystemExit('Action layout validation failed:\n' + '\n'.join('- ' + error for error in errors))
print(f'Validated {len(PROJECTS)} homepage action pairs, {len(PROJECTS)} two-button project headers and absence of unmonitored report links.')
