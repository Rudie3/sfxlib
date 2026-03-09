const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const tags = db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
  res.json({ tags });
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO tags (name, color, created_at)
    VALUES (?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET color = excluded.color
  `);
  stmt.run(name.trim(), color || null, now);

  const tag = db.prepare('SELECT * FROM tags WHERE name = ?').get(name.trim());
  res.json({ tag });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/file/:fileId', (req, res) => {
  const { tagIds } = req.body;
  if (!Array.isArray(tagIds)) {
    res.status(400).json({ error: 'tagIds array is required' });
    return;
  }

  const fileId = Number(req.params.fileId);
  const now = new Date().toISOString();

  const trx = db.transaction(() => {
    db.prepare('DELETE FROM file_tags WHERE file_id = ?').run(fileId);
    const insertStmt = db.prepare('INSERT INTO file_tags (file_id, tag_id, created_at) VALUES (?, ?, ?)');
    for (const tagId of tagIds) {
      insertStmt.run(fileId, Number(tagId), now);
    }
  });

  trx();

  const tags = db.prepare(`
    SELECT t.*
    FROM tags t
    INNER JOIN file_tags ft ON ft.tag_id = t.id
    WHERE ft.file_id = ?
    ORDER BY t.name ASC
  `).all(fileId);

  res.json({ fileId, tags });
});

module.exports = {
  tagsRouter: router,
};
