(() => {
  'use strict';
  const OWNER = 'Zudin987';
  const CACHE_TTL = 60 * 60 * 1000;
  const STALE_TTL = 24 * CACHE_TTL;
  const preferredAssets = {
    'BPSR-ReadyAlert': 'BPSR-ReadyAlert.exe',
    'BPSR-MIDI-Lite': 'BPSR-MIDI-Lite.exe',
    'BPSR-BlueMeter-Lite': /arm64-v8a\.apk$/i,
    'BPSR-Android-DPSMeter-Relay': 'BPSR-Android-DPSMeter-Relay.zip',
    'BPSR-CustomPFP-Lite': 'BPSR-CustomPFP-Lite-Windows.zip',
    'BPSR-Portable-Stream-Kit': 'StreamKit-win-x64.zip',
    'Malay-TTS-Bot': /-CLEAN\.zip$/i,
  };
  const contexts = [...document.querySelectorAll('.project-row, .project-header')];

  function repoFor(context) {
    const link = [...context.querySelectorAll('a[href*="github.com/Zudin987/"]')].find(a => {
      try {
        const u = new URL(a.href);
        return u.hostname === 'github.com' && u.pathname.split('/').filter(Boolean)[0]?.toLowerCase() === OWNER.toLowerCase() && u.pathname.split('/').filter(Boolean).length >= 2;
      } catch { return false; }
    });
    return link ? new URL(link.href).pathname.split('/')[2] : null;
  }

  function releasesUrl(repo) {
    return `https://github.com/${OWNER}/${repo}/releases/latest`;
  }

  function readCache(repo) {
    try {
      const value = JSON.parse(localStorage.getItem(`release-meta:${repo}`));
      return value && Number.isFinite(value.savedAt) && value.release && Date.now() >= value.savedAt && Date.now() - value.savedAt <= STALE_TTL ? value : null;
    } catch { return null; }
  }

  function writeCache(repo, release) {
    try { localStorage.setItem(`release-meta:${repo}`, JSON.stringify({ savedAt: Date.now(), release })); }
    catch { /* The site works without local storage. */ }
  }

  async function getRelease(repo) {
    const cached = readCache(repo);
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) return cached.release;
    try {
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store',
      });
      if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
      const release = await response.json();
      if (!Array.isArray(release.assets)) throw new Error('Invalid release response');
      writeCache(repo, release);
      return release;
    } catch (error) {
      if (cached) return cached.release;
      throw error;
    }
  }

  function exactAsset(release, matcher) {
    if (!Array.isArray(release.assets)) return null;
    return release.assets.find(asset => {
      if (!asset || !asset.browser_download_url || typeof asset.name !== 'string') return false;
      return typeof matcher === 'string' ? asset.name === matcher : matcher instanceof RegExp && matcher.test(asset.name);
    }) || null;
  }

  function updateLink(link, asset, label) {
    link.href = asset.browser_download_url;
    link.textContent = label;
    link.title = `Download ${asset.name}`;
    link.setAttribute('aria-label', `Download ${asset.name}`);
  }

  function addLink(context, key, text, href, css, assetName = null) {
    // Project detail pages include fallback choices in their HTML. Upgrade them
    // to a verified asset if available; never append a duplicate or guess a file.
    const existing = context.querySelector(`[data-release-link="${key}"]`);
    if (existing) {
      if (assetName) updateLink(existing, { name: assetName, browser_download_url: href }, text);
      return;
    }
    const parent = context.querySelector(context.classList.contains('project-row') ? '.row-actions' : '.project-actions');
    if (!parent) return;
    const link = document.createElement('a');
    link.dataset.releaseLink = key;
    link.className = css;
    link.href = href;
    link.textContent = text;
    if (assetName) link.setAttribute('aria-label', `Download ${assetName}`);
    parent.append(link);
  }

  function updateDate(context, release) {
    const published = new Date(release.published_at || release.created_at || '');
    if (Number.isNaN(published.getTime())) return;
    const parent = context.classList.contains('project-row') ? context.querySelector('.project-meta') : context.querySelector('.resource-links');
    if (!parent) return;
    let date = parent.querySelector('[data-release-updated]');
    if (!date) {
      date = document.createElement('span');
      date.dataset.releaseUpdated = '';
      if (context.classList.contains('project-header')) date.className = 'release-date';
      parent.append(date);
    }
    date.textContent = `Updated ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(published)}${release.tag_name ? ` · ${release.tag_name}` : ''}`;
  }

  function apply(context, repo, release) {
    updateDate(context, release);
    const main = context.querySelector('a.text-action, .project-actions > a.button');
    const asset = exactAsset(release, preferredAssets[repo]);
    if (asset && main && /^Download\b/i.test(main.textContent.trim())) {
      const label = repo === 'BPSR-MIDI-Lite' ? 'Download Lite' : repo === 'BPSR-BlueMeter-Lite' ? 'Download Android (ARM64)' : 'Download latest release';
      updateLink(main, asset, label);
    }
    if (repo === 'BPSR-MIDI-Lite') {
      const studio = exactAsset(release, 'BPSR-MIDI-Studio-Experimental-Beta.exe');
      if (studio) addLink(context, 'studio', 'Download Studio (Experimental)', studio.browser_download_url, context.classList.contains('project-row') ? 'text-action' : 'button secondary', studio.name);
      addLink(context, 'all', 'All release files', releasesUrl(repo), 'text-action');
    }
    if (repo === 'BPSR-BlueMeter-Lite') {
      addLink(context, 'architectures', 'Other APK versions', releasesUrl(repo), 'text-action');
    }
  }

  const grouped = new Map();
  contexts.forEach(context => {
    const repo = repoFor(context);
    if (!repo || !(repo in preferredAssets)) return;
    if (!grouped.has(repo)) grouped.set(repo, []);
    grouped.get(repo).push(context);
  });
  grouped.forEach((group, repo) => {
    getRelease(repo).then(release => group.forEach(context => apply(context, repo, release)))
      .catch(() => { /* Pre-rendered Releases links remain valid. */ });
  });
})();
