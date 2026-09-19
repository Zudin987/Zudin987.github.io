#!/usr/bin/env python3
"""Check real website screenshots against their PNG headers and HTML dimensions.

The non-strict report mode distinguishes temporary network errors from 404s.
The CI strict mode requires successful verification of every screenshot.
"""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import struct
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted((ROOT / 'projects').glob('*/index.html'))

class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.images.append(dict(attrs))

def dimensions(src):
    parsed = urlsplit(src)
    if parsed.scheme:
        if parsed.scheme != 'https' or parsed.hostname != 'raw.githubusercontent.com' or not parsed.path.startswith('/Zudin987/'):
            return None, 'Unsupported external image origin'
        try:
            request = Request(src, headers={'Range': 'bytes=0-23', 'User-Agent': 'MrEz-website-image-audit/1.0'})
            with urlopen(request, timeout=15) as response:
                data = response.read(24)
        except HTTPError as exc:
            return None, f'HTTP {exc.code}'
        except (URLError, TimeoutError, OSError) as exc:
            return None, f'UNVERIFIED: network error ({type(exc).__name__})'
    else:
        target = (ROOT / unquote(parsed.path).lstrip('/')).resolve() if parsed.path.startswith('/') else None
        if target is None or not target.is_relative_to(ROOT) or not target.is_file():
            return None, 'Missing local image'
        data = target.read_bytes()[:24]
    if len(data) < 24 or data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
        return None, 'Not a valid PNG header'
    return struct.unpack('>II', data[16:24]), None

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-dimensions', action='store_true', help='Fail if image cannot be checked or width/height differs')
    args = parser.parse_args()
    failures = []
    reviewed = 0
    seen = {}
    for page in PAGES:
        document = Images()
        document.feed(page.read_text(encoding='utf-8'))
        for image in document.images:
            src = image.get('src', '')
            if src not in seen:
                seen[src] = dimensions(src)
            actual, error = seen[src]
            name = page.parent.name
            if error:
                print(f'{name}: {error}: {src}')
                if args.require_dimensions or not error.startswith('UNVERIFIED:'):
                    failures.append(f'{name}: {error}: {src}')
                continue
            reviewed += 1
            provided = (image.get('width'), image.get('height'))
            expected = (str(actual[0]), str(actual[1]))
            status = 'OK' if provided == expected else f'DIMENSIONS REQUIRED (HTML width={provided[0]}, height={provided[1]})'
            print(f'{name}: {status}: native {actual[0]}x{actual[1]}: {src}')
            if args.require_dimensions and provided != expected:
                failures.append(f'{name}: expected width={expected[0]} height={expected[1]}: {src}')
    if failures:
        raise SystemExit('Image audit failed:\n' + '\n'.join(failures))
    print(f'Image audit complete: {reviewed} image uses checked, {len(seen)} unique sources.')

if __name__ == '__main__':
    main()
