// Wires up the DOM screens/buttons to the Game instance and the leaderboard API.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const screens = {
    start: document.getElementById('screen-start'),
    gameover: document.getElementById('screen-gameover'),
    leaderboard: document.getElementById('screen-leaderboard'),
  };

  function showScreen(name) {
    Object.keys(screens).forEach((key) => {
      screens[key].classList.toggle('hidden', key !== name);
    });
  }

  function hideAllScreens() {
    Object.keys(screens).forEach((key) => screens[key].classList.add('hidden'));
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  }

  async function loadLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '<li>Loading...</li>';
    try {
      const scores = await Network.getTopScores(10);
      if (scores.length === 0) {
        list.innerHTML = '<li>No scores yet — be the first!</li>';
        return;
      }
      list.innerHTML = scores
        .map((s) => `<li><span>${escapeHtml(s.player_name)}</span><span>${s.score}</span></li>`)
        .join('');
    } catch (err) {
      list.innerHTML = '<li>Could not load leaderboard.</li>';
    }
  }

  const ui = {
    onGameOver(score) {
      document.getElementById('final-score').textContent = String(score);
      showScreen('gameover');
    },
  };

  const game = new Game(ctx, ui);

  Input.bindTouchButton(document.getElementById('touch-left'), 'left');
  Input.bindTouchButton(document.getElementById('touch-right'), 'right');
  Input.bindTouchButton(document.getElementById('touch-fire'), 'fire');

  document.getElementById('btn-play').addEventListener('click', () => {
    hideAllScreens();
    game.start();
  });

  document.getElementById('btn-leaderboard').addEventListener('click', async () => {
    await loadLeaderboard();
    showScreen('leaderboard');
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    showScreen('start');
  });

  document.getElementById('btn-skip').addEventListener('click', async () => {
    await loadLeaderboard();
    showScreen('leaderboard');
  });

  document.getElementById('form-score').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('player-name');
    const name = input.value.trim();
    if (!name) return;
    try {
      await Network.submitScore(name, game.score);
    } catch (err) {
      console.error(err);
    } finally {
      input.value = '';
      await loadLeaderboard();
      showScreen('leaderboard');
    }
  });
})();
