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

// Exit (best-effort)
document.getElementById('exit')?.addEventListener('click', () => {
  try { player.pause(); player.removeAttribute('src'); player.load(); } catch {}
  window.close();
  setStatus('Exit clicked — closing player');
});