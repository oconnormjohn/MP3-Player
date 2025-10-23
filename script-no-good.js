const player = document.getElementById('player');
const statusEl = document.getElementById('status');
const btns = Array.from(document.querySelectorAll('.song'));

let currentBtn = null;
let playTimeout = null;

const setStatus = (t) => { statusEl.textContent = t || ''; console.log(t); };

// Encode only the last path segment (the filename) so spaces/apostrophes work
function encodePath(raw) {
  const parts = raw.split('/');
  const file = parts.pop();
  return [...parts, encodeURIComponent(file)].join('/');
}

function setActive(btn) {
  btns.forEach(b => b.classList.remove('active','loading'));
  if (btn) btn.classList.add('active');
  currentBtn = btn || null;
}

async function playSrc(btn, rawSrc) {
  const src = encodePath(rawSrc);

  // Toggle if same track
  if (currentBtn === btn && player.src.endsWith(src)) {
    if (player.paused) {
      try { await player.play(); setStatus('Resumed'); } catch(e){ setStatus('Resume error: ' + e.message); }
    } else {
      player.pause(); setStatus('Paused');
    }
    return;
  }

  // Switch track
  setActive(btn);
  btn.classList.add('loading');
  setStatus('Loading… ' + src);

  // Clear any previous timeout
  if (playTimeout) clearTimeout(playTimeout);

  player.src = src;
  player.load();

  // Give Safari time to decode, then try to play; retry a few times up to 10s
  const startedAt = performance.now();
  const tryPlay = async () => {
    try {
      await player.play();
      btn.classList.remove('loading');
      setStatus('Playing ' + src);
    } catch (e) {
      if (performance.now() - startedAt < 10000) {
        setTimeout(tryPlay, 400);
      } else {
        btn.classList.remove('loading');
        setActive(null);
        setStatus('Error before play: timeout after 10 s');
      }
    }
  };
  tryPlay();
}

btns.forEach(btn => btn.addEventListener('click', () => playSrc(btn, btn.dataset.src)));

player.addEventListener('ended', () => { setActive(null); setStatus('Ended'); });
player.addEventListener('pause', () => {
  if (player.currentTime > 0 && player.currentTime < (player.duration || 1)) setStatus('Paused');
});
player.addEventListener('error', () => {
  const e = player.error;
  setActive(null);
  setStatus('Error loading (' + (e ? e.code : '?') + '): ' + player.src);
});

// Exit button (best-effort close)
document.getElementById('exit')?.addEventListener('click', () => {
  try { player.pause(); player.removeAttribute('src'); player.load(); } catch {}
  window.close();
  setStatus('Exit clicked — closing player');
});