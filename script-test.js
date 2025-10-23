const statusEl = document.getElementById('status');
function setStatus(t){ if(statusEl) statusEl.textContent = t; }

let currentBtn = null;
let currentAudio = null;

function encodePath(raw) {
  const parts = raw.split('/');
  const file = parts.pop();
  return [...parts, encodeURIComponent(file)].join('/');
}

function setActive(btn) {
  document.querySelectorAll('.song.active, .song.loading')
    .forEach(b => b.classList.remove('active','loading'));
  if (btn) btn.classList.add('active');
  currentBtn = btn || null;
}

async function handleTap(btn){
  const raw  = btn.dataset.src;
  const safe = encodePath(raw);

  if (currentAudio && currentAudio.dataset.src === safe) {
    if (currentAudio.paused) {
      try { await currentAudio.play(); setStatus('Resumed ' + safe); }
      catch(e){ setStatus('Playback error: ' + e.message); }
    } else {
      currentAudio.pause();
      setStatus('Paused ' + safe);
    }
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio.load();
    currentAudio = null;
  }

  btn.classList.add('loading');
  setStatus('Loading ' + safe);

  const audio = new Audio();
  audio.dataset.src = safe;
  audio.src = safe;
  audio.volume = 1.0;
  audio.preload = 'auto';
  currentAudio = audio;

  const start = Date.now();
  const tryPlay = async () => {
    try {
      await audio.play();
      btn.classList.remove('loading');
      setActive(btn);
      setStatus('Playing ' + safe);
    } catch (e) {
      if (Date.now() - start < 10000) {
        setTimeout(tryPlay, 500);
      } else {
        btn.classList.remove('loading');
        setActive(null);
        setStatus('Error before play: timeout after 10 s');
      }
    }
  };
  tryPlay();

  audio.addEventListener('ended', () => { setStatus('Ended'); setActive(null); });
  audio.addEventListener('pause', () => {
    if (audio.currentTime>0 && audio.currentTime<audio.duration) setStatus('Paused');
  });
  audio.addEventListener('error', () => {
    const e = audio.error;
    setStatus('Error loading (' + (e ? e.code : '?') + '): ' + safe);
    setActive(null);
  });
}

document.querySelectorAll('.song').forEach(btn =>
  btn.addEventListener('click', () => handleTap(btn))
);

// ----- EXIT BUTTON -----
function isStandalone() {
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
         || (typeof navigator !== 'undefined' && navigator.standalone === true);
}

function tryCloseStrategies() {
  window.close();
  try {
    const w = window.open('', '_self');
    if (w) w.close();
  } catch {}
  try { location.href = 'about:blank'; } catch {}
}

const exitBtn = document.getElementById('exitBtn');
if (exitBtn) {
  exitBtn.addEventListener('click', () => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio.load();
      }
    } catch {}
    tryCloseStrategies();
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        const msg = isStandalone()
          ? 'To exit, swipe up to go Home.'
          : 'To exit this tab, tap the tabs button in Safari.';
        setStatus(msg);
      }
    }, 250);
  });
}
