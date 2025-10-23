const player = document.getElementById('player');
const status = document.getElementById('status');
const buttons = document.querySelectorAll('.song');
const exitBtn = document.getElementById('exit');

let current = null;
let timeout = null;

function setStatus(msg) {
  status.textContent = msg;
  console.log(msg);
}

async function safePlay(src) {
  if (player.src.endsWith(src)) {
    if (!player.paused) {
      player.pause();
      setStatus('Paused');
      return;
    } else {
      try { await player.play(); setStatus('Resumed'); } catch(e) { setStatus('Error resuming'); }
      return;
    }
  }

  buttons.forEach(b => b.classList.remove('active'));
  current = buttons.find(b => b.dataset.src === src);
  if (current) current.classList.add('active');

  player.src = src;
  player.load();
  setStatus('Loading…');

  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    setStatus('Error before play: timeout after 10 s');
    player.pause();
  }, 10000);

  player.oncanplaythrough = async () => {
    clearTimeout(timeout);
    try {
      await player.play();
      setStatus('Playing ' + src);
    } catch (e) {
      setStatus('Error playing: ' + e.message);
    }
  };
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => safePlay(btn.dataset.src));
});

player.addEventListener('ended', () => {
  buttons.forEach(b => b.classList.remove('active'));
  setStatus('Playback ended');
});

exitBtn.addEventListener('click', () => {
  setStatus('Exit clicked — closing player');
  player.pause();
  window.close();
});