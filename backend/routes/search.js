const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const mode = (req.query.mode || 'all').trim();

  if (!q) {
    res.json({ results: [] });
    return;
  }

  const like = `%${q}%`;

  const rows = db.prepare(`
    SELECT
      f.id,
      f.name,
      f.parent_dir,
      f.relative_path,
      COALESCE(json_group_array(t.name), '[]') AS tags_json
    FROM files f
    LEFT JOIN file_tags ft ON ft.file_id = f.id
    LEFT JOIN tags t ON t.id = ft.tag_id
    GROUP BY f.id
  `).all();

  const results = rows
    .map((row) => ({
      ...row,
      tags: JSON.parse(row.tags_json).filter(Boolean),
    }))
    .filter((row) => {
      const byFile = row.name.toLowerCase().includes(q.toLowerCase());
      const byFolder = row.parent_dir.toLowerCase().includes(q.toLowerCase());
      const byTag = row.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase()));

      if (mode === 'filename') {
        return byFile;
      }
      if (mode === 'folder') {
        return byFolder;
      }
      if (mode === 'tag') {
        return byTag;
      }

      return byFile || byFolder || byTag;
    });

  res.json({ results, mode, query: q, like });
});

module.exports = {
  searchRouter: router,
};
