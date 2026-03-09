const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { db } = require('../db/database');
const { indexSingleFile, SUPPORTED_EXTENSIONS } = require('./indexer');

let watcher = null;

function deleteByAbsolutePath(absolutePath) {
  db.prepare('DELETE FROM files WHERE absolute_path = ?').run(absolutePath);
}

function startWatcher(rootPath) {
  if (watcher) {
    watcher.close();
    watcher = null;
  }

  watcher = chokidar.watch(rootPath, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 800, pollInterval: 100 },
  });

  watcher.on('add', async (absolutePath) => {
    const ext = path.extname(absolutePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return;
    }

    try {
      await indexSingleFile(rootPath, absolutePath);
    } catch (err) {
      // Ignore individual file failures so watch loop keeps running.
    }
  });

  watcher.on('change', async (absolutePath) => {
    const ext = path.extname(absolutePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return;
    }

    if (!fs.existsSync(absolutePath)) {
      return;
    }

    try {
      await indexSingleFile(rootPath, absolutePath);
    } catch (err) {
      // Ignore individual file failures so watch loop keeps running.
    }
  });

  watcher.on('unlink', (absolutePath) => {
    deleteByAbsolutePath(absolutePath);
  });

  return watcher;
}

function stopWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

module.exports = {
  startWatcher,
  stopWatcher,
};
