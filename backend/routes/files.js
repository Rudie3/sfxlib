const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { db } = require('../db/database');

const router = express.Router();

function openInFileExplorer(targetPath, isFile) {
  if (process.platform === 'win32') {
    const args = isFile ? ['/select,', targetPath] : [targetPath];
    const child = spawn('explorer.exe', args, { detached: true, stdio: 'ignore' });
    child.unref();
    return;
  }

  if (process.platform === 'darwin') {
    const args = isFile ? ['-R', targetPath] : [targetPath];
    const child = spawn('open', args, { detached: true, stdio: 'ignore' });
    child.unref();
    return;
  }

  const child = spawn('xdg-open', [isFile ? path.dirname(targetPath) : targetPath], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

function buildTree(files) {
  const root = { name: '/', type: 'directory', children: [] };

  const ensureDir = (node, name) => {
    let dir = node.children.find((c) => c.type === 'directory' && c.name === name);
    if (!dir) {
      dir = { name, type: 'directory', children: [] };
      node.children.push(dir);
    }
    return dir;
  };

  for (const file of files) {
    const parts = file.relative_path.split(path.sep);
    const fileName = parts.pop();

    let cursor = root;
    for (const part of parts) {
      if (!part || part === '.') {
        continue;
      }
      cursor = ensureDir(cursor, part);
    }

    cursor.children.push({
      id: file.id,
      name: fileName,
      type: 'file',
      relative_path: file.relative_path,
      duration_seconds: file.duration_seconds,
      waveform: file.waveform,
      tags: file.tags,
    });
  }

  const sortNode = (node) => {
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    for (const child of node.children) {
      if (child.type === 'directory') {
        sortNode(child);
      }
    }
  };

  sortNode(root);
  return root;
}

router.get('/tree', (req, res) => {
  const rows = db.prepare(`
    SELECT f.*, COALESCE(json_group_array(t.name), '[]') AS tags_json
    FROM files f
    LEFT JOIN file_tags ft ON ft.file_id = f.id
    LEFT JOIN tags t ON t.id = ft.tag_id
    GROUP BY f.id
    ORDER BY f.relative_path ASC
  `).all();

  const files = rows.map((row) => ({
    ...row,
    tags: JSON.parse(row.tags_json).filter(Boolean),
    waveform: row.waveform_json ? JSON.parse(row.waveform_json) : [],
  }));

  res.json({ tree: buildTree(files), count: files.length });
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT f.*, COALESCE(json_group_array(t.name), '[]') AS tags_json
    FROM files f
    LEFT JOIN file_tags ft ON ft.file_id = f.id
    LEFT JOIN tags t ON t.id = ft.tag_id
    WHERE f.id = ?
    GROUP BY f.id
  `).get(req.params.id);

  if (!row) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  res.json({
    ...row,
    tags: JSON.parse(row.tags_json).filter(Boolean),
    waveform: row.waveform_json ? JSON.parse(row.waveform_json) : [],
  });
});

router.get('/:id/stream', (req, res) => {
  const row = db.prepare('SELECT absolute_path FROM files WHERE id = ?').get(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  res.sendFile(row.absolute_path);
});

router.post('/:id/reveal', (req, res, next) => {
  try {
    const row = db.prepare('SELECT absolute_path FROM files WHERE id = ?').get(req.params.id);
    if (!row) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const filePath = row.absolute_path;
    const hasFile = fs.existsSync(filePath);
    const folderPath = path.dirname(filePath);

    if (!hasFile && !fs.existsSync(folderPath)) {
      res.status(404).json({ error: 'File location not found on disk' });
      return;
    }

    openInFileExplorer(hasFile ? filePath : folderPath, hasFile);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = {
  filesRouter: router,
};
