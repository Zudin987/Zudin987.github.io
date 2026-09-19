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

  function repoFor(context) {
    const link = [...context.querySelectorAll('a[href*="github.com/Zudin987/"]')].find(a => {
      try {
        const url = new URL(a.href);
        const parts = url.pathname.split('/').filter(Boolean);
        return url.hostname === 'github.com' && parts[0]?.toLowerCase() === OWNER.toLowerCase() && parts.length >= 2;
      } catch { return false; }
    });
    return link ? new URL(link.href).pathname.split('/')[2] : null;
  }

  function readCache(repo) {
    try {
      const value = JSON.parse(localStorage.getItem(`release-meta:${repo}`));
      return value && Number.isFinite(value.savedAt) && value.release &&
        Date.now() >= value.savedAt && Date.now() - value.savedAt <= STALE_TTL ? value : null;
    } catch { return null; }
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
      try { localStorage.setItem(`release-meta:${repo}`, JSON.stringify({ savedAt: Date.now(), release })); }
      catch { /* Browsers with disabled storage still work. */ }
      return release;
    } catch (error) {
      if (cached) return cached.release;
      throw error;
    }
  }

  function exactAsset(release, matcher) {
    if (!Array.isArray(release.assets) || !matcher) return null;
    return release.assets.find(asset => {
      if (!asset || !asset.browser_download_url || typeof asset.name !== 'string') return false;
      return typeof matcher === 'string' ? asset.name === matcher : matcher instanceof RegExp && matcher.test(asset.name);
    }) || null;
  }

  function setAsset(link, asset, label) {
    if (!link || !asset) return;
    link.href = asset.browser_download_url;
    if (label) link.textContent = label;
    link.title = `Download ${asset.name}`;
    link.setAttribute('aria-label', `Download ${asset.name}`);
  }

  function apply(context, repo, release) {
    const isRow = context.classList.contains('project-row');
    const main = context.querySelector(isRow ? '.row-actions > a.text-action' : '.project-actions > a.button');
    const asset = exactAsset(release, preferredAssets[repo]);
    if (asset && main && /^Download\b/i.test(main.textContent.trim())) {
      // The homepage has exactly two actions per project by design. Change the
      // target, not the visible label, width, dates, or number of buttons.
      const label = isRow ? null : repo === 'BPSR-MIDI-Lite' ? 'Download Lite' :
        repo === 'BPSR-BlueMeter-Lite' ? 'Download Android (ARM64)' : 'Download latest release';
      setAsset(main, asset, label);
    }

    // Edition and architecture choices are already present in static detail
    // HTML, including safe Releases fallbacks when the API is unavailable.
    // Upgrade existing choices only; never append extra actions or badges.
    if (!isRow && repo === 'BPSR-MIDI-Lite') {
      const studio = exactAsset(release, 'BPSR-MIDI-Studio-Experimental-Beta.exe');
      if (studio) setAsset(context.querySelector('[data-release-link="studio"]'), studio, 'Download Studio (Experimental)');
    }
  }

  const groups = new Map();
  document.querySelectorAll('.project-row, .project-header').forEach(context => {
    const repo = repoFor(context);
    if (!repo || !(repo in preferredAssets)) return;
    if (!groups.has(repo)) groups.set(repo, []);
    groups.get(repo).push(context);
  });
  groups.forEach((contexts, repo) => {
    getRelease(repo).then(release => contexts.forEach(context => apply(context, repo, release)))
      .catch(() => { /* Static Releases links remain available; layout never changes. */ });
  });
})();
