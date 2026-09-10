(() => {
  const OWNER = 'Zudin987';
  const CACHE_TTL_MS = 30 * 60 * 1000;
  const assetPickers = {
    'BPSR-ReadyAlert': assets => assets.find(asset => asset.name === 'BPSR-ReadyAlert.exe'),
    'BPSR-MIDI-Lite': assets => assets.find(asset => asset.name === 'BPSR-MIDI-Lite.exe'),
    'BPSR-BlueMeter-Lite': assets => assets.find(asset => /arm64-v8a\.apk$/i.test(asset.name)),
    'BPSR-Android-DPSMeter-Relay': assets => assets.find(asset => asset.name === 'BPSR-Android-DPSMeter-Relay.zip'),
    'BPSR-CustomPFP-Lite': assets => assets.find(asset => asset.name === 'BPSR-CustomPFP-Lite-Windows.zip'),
    'BPSR-Portable-Stream-Kit': assets => assets.find(asset => asset.name === 'StreamKit-win-x64.zip'),
    'Malay-TTS-Bot': assets => assets.find(asset => /-CLEAN\.zip$/i.test(asset.name)),
  };

  const releaseContexts = [
    ...document.querySelectorAll('.project-row'),
    ...document.querySelectorAll('.project-header'),
  ];

  function repoFromContext(context) {
    const githubLink = [...context.querySelectorAll('a[href*="github.com/Zudin987/"]')]
      .map(link => ({ link, url: new URL(link.href, window.location.href) }))
      .find(({ url }) => url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2);

    if (!githubLink) return null;
    const [owner, repo] = githubLink.url.pathname.split('/').filter(Boolean);
    return owner.toLowerCase() === OWNER.toLowerCase() ? repo : null;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  function readCache(repo) {
    try {
      const cached = JSON.parse(localStorage.getItem(`release-meta:${repo}`));
      if (!cached || Date.now() - cached.savedAt > CACHE_TTL_MS) return null;
      return cached.release;
    } catch {
      return null;
    }
  }

  function writeCache(repo, release) {
    try {
      localStorage.setItem(`release-meta:${repo}`, JSON.stringify({ savedAt: Date.now(), release }));
    } catch {
      // Storage can be unavailable in strict privacy modes; the page still works without it.
    }
  }

  async function getLatestRelease(repo) {
    const cached = readCache(repo);
    if (cached) return cached;

    const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`GitHub release lookup failed: ${response.status}`);

    const release = await response.json();
    writeCache(repo, release);
    return release;
  }

  function chooseAsset(repo, assets) {
    const preferred = assetPickers[repo]?.(assets);
    if (preferred) return preferred;

    return assets.find(asset => {
      const name = asset.name.toLowerCase();
      return !name.includes('sha256') &&
        !name.includes('source') &&
        !name.endsWith('.txt') &&
        !name.endsWith('.json') &&
        !name.endsWith('.sig') &&
        /\.(exe|apk|zip)$/i.test(asset.name);
    });
  }

  function updateReleaseNote(context, release) {
    const date = formatDate(release.published_at || release.created_at || release.updated_at);
    if (!date) return;

    const text = `Updated ${date}${release.tag_name ? ` · ${release.tag_name}` : ''}`;
    if (context.classList.contains('project-row')) {
      const meta = context.querySelector('.project-meta');
      if (!meta || meta.querySelector('[data-release-updated]')) return;
      const item = document.createElement('span');
      item.dataset.releaseUpdated = '';
      item.textContent = text;
      meta.append(item);
      return;
    }

    const resources = context.querySelector('.resource-links');
    if (!resources || resources.querySelector('[data-release-updated]')) return;
    const item = document.createElement('span');
    item.dataset.releaseUpdated = '';
    item.textContent = text;
    item.style.display = 'inline-flex';
    item.style.alignItems = 'center';
    item.style.minHeight = '44px';
    item.style.color = 'var(--muted)';
    resources.append(item);
  }

  function updateDownloadLinks(context, repo, release) {
    const asset = chooseAsset(repo, Array.isArray(release.assets) ? release.assets : []);
    if (!asset?.browser_download_url) return;

    context.querySelectorAll('a').forEach(link => {
      if (!/^Download\b/i.test(link.textContent.trim())) return;
      link.href = asset.browser_download_url;
      link.title = `Download ${asset.name}`;
      link.setAttribute('aria-label', `Download ${asset.name}`);
    });
  }

  const grouped = new Map();
  releaseContexts.forEach(context => {
    const repo = repoFromContext(context);
    if (!repo) return;
    if (!grouped.has(repo)) grouped.set(repo, []);
    grouped.get(repo).push(context);
  });

  grouped.forEach((contexts, repo) => {
    getLatestRelease(repo)
      .then(release => {
        contexts.forEach(context => {
          updateReleaseNote(context, release);
          updateDownloadLinks(context, repo, release);
        });
      })
      .catch(() => {
        // Keep the existing GitHub Releases link as a safe fallback if the API is unavailable.
      });
  });
})();
