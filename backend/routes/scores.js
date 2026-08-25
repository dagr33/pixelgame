const express = require('express');

const router = express.Router();
const db = require('../db');

const NAME_REGEX = /^[A-Za-z0-9 _-]{1,16}$/;
const MAX_SCORE = 999999999;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

router.get('/top', async (req, res) => {
  const parsedLimit = parseInt(req.query.limit, 10);
  const limit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  try {
    const { rows } = await db.query(
      'SELECT player_name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT $1',
      [limit],
    );
    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch scores', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

router.post('/', async (req, res) => {
  const { name, score } = req.body ?? {};

  if (typeof name !== 'string' || !NAME_REGEX.test(name.trim())) {
    return res.status(400).json({ error: 'Name must be 1-16 letters, numbers, spaces, - or _' });
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return res.status(400).json({ error: 'Score must be an integer between 0 and 999999999' });
  }

  try {
    const { rows } = await db.query(
      'INSERT INTO scores (player_name, score) VALUES ($1, $2) RETURNING id, player_name, score, created_at',
      [name.trim(), score],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Failed to save score', err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

module.exports = router;
