// script.js v13
const player   = document.getElementById('player');
const statusEl = document.getElementById('status');
const buttons  = Array.from(document.querySelectorAll('.song'));

const setStatus = (t) => { statusEl.textContent = t; console.log(t); };

// show that this file is the one running
setStatus('JS v13 loaded (Manual edit in script.js)');

// Encode only the filename part so spaces/apostrophes work
function encodePath(raw) {
  const parts = raw.split('/');
  const file  = parts.pop();
  return [...parts, encodeURIComponent(file)].join('/');
}

function setActive(btn) {
  buttons.forEach(b => b.classList.remove('active','loading'));
  if (btn) btn.classList.add('active');
}


async function handleClick(btn) {
  const raw  = btn.dataset.src;          // e.g. "mp3/Little Donkey.mp3"
  const safe = encodePath(raw);          // e.g. "mp3/Little%20Donkey.mp3"
  setStatus('Trying: ' + safe);

  // Toggle if same track
  const endsWithSafe = player.src.endsWith(safe);
  if (endsWithSafe) {
    if (player.paused) {
      try { await player.play(); setStatus('Resumed: ' + safe); }
      catch(e){ setStatus('Resume error: ' + e.message); }
    } else {
      player.pause(); setStatus('Paused: ' + safe);
    }
    return;
  }

  // New track
  setActive(btn);
  btn.classList.add('loading');
  player.src = safe;
  player.load();                          // commit the new source
  setStatus('Loading: ' + safe);

  const start = performance.now();
  const tryPlay = async () => {
    try {
      await player.play();
      btn.classList.remove('loading');
      setStatus('Playing: ' + safe);
    } catch (e) {
      if (performance.now() - start < 10000) {
        setTimeout(tryPlay, 400);         // keep nudging Safari for up to 10s
      } else {
        btn.classList.remove('loading');
        setActive(null);
        setStatus('Error before play: timeout after 10 s');
      }
    }
  };
  tryPlay();
}

buttons.forEach(btn => btn.addEventListener('click', () => handleClick(btn)));

player.addEventListener('ended', () => { setActive(null); setStatus('Ended'); });
player.addEventListener('pause',  () => {
  if (player.currentTime > 0 && player.currentTime < (player.duration||1)) setStatus('Paused');
});
player.addEventListener('error',  () => {
  const e = player.error;
  setActive(null);
  setStatus('Audio error (' + (e? e.code : '?') + '): ' + player.src);
});

// --- Exit handling (PWA/kiosk aware) ---
const exitBtn = document.getElementById('exit');
const exitHelp = document.getElementById('exitHelp');
const dismissHelp = document.getElementById('dismissHelp');

function inStandalone() {
  // iOS: navigator.standalone; other: display-mode media query
  return (window.navigator.standalone === true) ||
         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
}

function tryExitNow() {
  try { player.pause(); } catch {}
  // Best-effort close (works if this tab was opened via window.open)
  window.close();

  // If still here:
  if (inStandalone()) {
    // We can't programmatically leave a Home-screen PWA → show help + Safari escape
    exitHelp.hidden = false;
  } else {
    // In normal Safari tab: just navigate away
    location.href = 'about:blank';
  }
}

// Long-press to avoid accidental exits
let pressTimer;
exitBtn.addEventListener('touchstart', () => { pressTimer = setTimeout(tryExitNow, 600); });
exitBtn.addEventListener('touchend',   () => { clearTimeout(pressTimer); });
exitBtn.addEventListener('click',      () => { tryExitNow(); });

dismissHelp.addEventListener('click', () => { exitHelp.hidden = true; });
