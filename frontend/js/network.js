// Thin fetch wrappers for the leaderboard API.

const Network = (() => {
  async function getTopScores(limit = 10) {
    const res = await fetch(`/api/scores/top?limit=${encodeURIComponent(limit)}`);
    if (!res.ok) throw new Error('Failed to load leaderboard');
    return res.json();
  }

  async function submitScore(name, score) {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to submit score');
    }
    return res.json();
  }

  return { getTopScores, submitScore };
})();
