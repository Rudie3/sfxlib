const express = require('express');
const fs = require('fs');
const path = require('path');
const { db } = require('../db/database');
const { indexLibrary } = require('../services/indexer');
const { startWatcher } = require('../services/watcher');
const { indexState } = require('../services/state');

const router = express.Router();

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, now);
}

router.get('/', (req, res) => {
  const rootPath = getSetting('rootPath');
  res.json({
    isSetup: Boolean(rootPath),
    rootPath,
  });
});

router.get('/status', (req, res) => {
  res.json(indexState);
});

router.post('/', async (req, res, next) => {
  try {
    const { rootPath } = req.body;
    if (!rootPath || typeof rootPath !== 'string') {
      res.status(400).json({ error: 'rootPath is required' });
      return;
    }

    const resolvedRoot = path.resolve(rootPath);
    if (!fs.existsSync(resolvedRoot)) {
      res.status(400).json({ error: 'Path does not exist' });
      return;
    }

    const stat = fs.statSync(resolvedRoot);
    if (!stat.isDirectory()) {
      res.status(400).json({ error: 'Path must be a directory' });
      return;
    }

    setSetting('rootPath', resolvedRoot);
    const result = await indexLibrary(resolvedRoot);
    startWatcher(resolvedRoot);

    res.json({
      success: true,
      rootPath: resolvedRoot,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/reindex', async (req, res, next) => {
  try {
    const rootPath = getSetting('rootPath');
    if (!rootPath) {
      res.status(400).json({ error: 'Root path is not configured' });
      return;
    }

    const result = await indexLibrary(rootPath);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  setupRouter: router,
  getSetting,
};
