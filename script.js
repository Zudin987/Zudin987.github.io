const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#site-nav');

function closeNav() {
  if (!toggle || !nav) return;
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNav();
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

const wallpaperParts = [
  '/assets/art/wallpaper.avif.part01.txt',
  '/assets/art/wallpaper.avif.part02.txt',
  '/assets/art/wallpaper.avif.part03.txt'
];

Promise.all(
  wallpaperParts.map(path => fetch(path).then(response => response.ok ? response.text() : Promise.reject()))
)
  .then(parts => {
    const encoded = parts.map(part => part.trim()).join('');
    if (!encoded.startsWith('AAAA')) throw new Error('Invalid wallpaper data');
    document.documentElement.style.setProperty('--wallpaper-image', `url("data:image/avif;base64,${encoded}")`);
  })
  .catch(() => {});

const releaseNodes = [...document.querySelectorAll('[data-release-repo]')];
const repos = [...new Set(releaseNodes.map(node => node.dataset.releaseRepo).filter(Boolean))];

for (const repo of repos) {
  fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(release => {
      const published = release.published_at ? new Date(release.published_at) : null;
      const dateText = published && !Number.isNaN(published.valueOf())
        ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(published)
        : '';

      document.querySelectorAll(`[data-release-meta][data-release-repo="${repo}"]`).forEach(node => {
        node.textContent = [release.tag_name || release.name || 'Latest release', dateText].filter(Boolean).join(' · ');
      });

      document.querySelectorAll(`[data-release-asset][data-release-repo="${repo}"]`).forEach(link => {
        const match = link.dataset.releaseAsset;
        const asset = Array.isArray(release.assets) ? release.assets.find(item => item.name === match || item.name.includes(match)) : null;
        if (asset?.browser_download_url) link.href = asset.browser_download_url;
      });
    })
    .catch(() => {});
}
