(() => {
  const OWNER = 'Zudin987';
  const FALLBACK_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const stableAssetNames = {
    'BPSR-ReadyAlert': 'BPSR-ReadyAlert.exe',
    'BPSR-MIDI-Lite': 'BPSR-MIDI-Lite.exe',
    'BPSR-Android-DPSMeter-Relay': 'BPSR-Android-DPSMeter-Relay.zip',
    'BPSR-CustomPFP-Lite': 'BPSR-CustomPFP-Lite-Windows.zip',
    'BPSR-Portable-Stream-Kit': 'StreamKit-win-x64.zip',
  };
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
      if (!cached || Date.now() - cached.savedAt > FALLBACK_CACHE_MAX_AGE_MS) return null;
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
    try {
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`GitHub release lookup failed: ${response.status}`);

      const release = await response.json();
      writeCache(repo, release);
      return release;
    } catch (error) {
      const cached = readCache(repo);
      if (cached) return cached;
      throw error;
    }
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

  function getOrCreateReleaseNote(context) {
    if (context.classList.contains('project-row')) {
      const meta = context.querySelector('.project-meta');
      if (!meta) return null;
      let item = meta.querySelector('[data-release-updated]');
      if (!item) {
        item = document.createElement('span');
        item.dataset.releaseUpdated = '';
        meta.append(item);
      }
      return item;
    }

    const resources = context.querySelector('.resource-links');
    if (!resources) return null;
    let item = resources.querySelector('[data-release-updated]');
    if (!item) {
      item = document.createElement('span');
      item.dataset.releaseUpdated = '';
      item.style.display = 'inline-flex';
      item.style.alignItems = 'center';
      item.style.minHeight = '44px';
      item.style.color = 'var(--muted)';
      resources.append(item);
    }
    return item;
  }

  function updateReleaseNote(context, release) {
    const date = formatDate(release.published_at || release.created_at || release.updated_at);
    if (!date) return;

    const item = getOrCreateReleaseNote(context);
    if (!item) return;
    item.textContent = `Updated ${date}${release.tag_name ? ` · ${release.tag_name}` : ''}`;
  }

  function setDownloadLink(link, url, assetName) {
    link.href = url;
    if (assetName) {
      link.title = `Download ${assetName}`;
      link.setAttribute('aria-label', `Download ${assetName}`);
    }
  }

  function setStableDownloadLinks(context, repo) {
    const assetName = stableAssetNames[repo];
    if (!assetName) return;
    const url = `https://github.com/${OWNER}/${repo}/releases/latest/download/${encodeURIComponent(assetName)}`;
    context.querySelectorAll('a').forEach(link => {
      if (!/^Download\b/i.test(link.textContent.trim())) return;
      setDownloadLink(link, url, assetName);
    });
  }

  function updateDownloadLinks(context, repo, release) {
    const asset = chooseAsset(repo, Array.isArray(release.assets) ? release.assets : []);
    if (!asset?.browser_download_url) return;

    context.querySelectorAll('a').forEach(link => {
      if (!/^Download\b/i.test(link.textContent.trim())) return;
      setDownloadLink(link, asset.browser_download_url, asset.name);
    });
  }

  const grouped = new Map();
  releaseContexts.forEach(context => {
    const repo = repoFromContext(context);
    if (!repo) return;
    setStableDownloadLinks(context, repo);
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
        // Stable-name projects still download the newest asset. Other projects keep the Releases fallback.
      });
  });
})();
