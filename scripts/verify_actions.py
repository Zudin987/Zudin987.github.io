#!/usr/bin/env python3
"""Guard the stable two-action layout in the homepage and every project page.

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

css = (ROOT / 'styles.css').read_text(encoding='utf-8')
for selector in ('.row-actions > :is(.button, .text-action)', '.project-actions > .button', '.project-highlight-grid > article'):
    if selector not in css:
        errors.append(f'styles.css: missing shared UI selector {selector}')

if errors:
    raise SystemExit('Action layout validation failed:\n' + '\n'.join('- ' + error for error in errors))
print(f'Validated {len(PROJECTS)} homepage action pairs and {len(PROJECTS)} two-button project headers.')
