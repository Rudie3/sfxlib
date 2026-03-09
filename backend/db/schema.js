const { db } = require('./database');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      absolute_path TEXT NOT NULL UNIQUE,
      relative_path TEXT NOT NULL,
      parent_dir TEXT NOT NULL,
      extension TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      modified_ms INTEGER NOT NULL,
      duration_seconds REAL,
      sample_rate INTEGER,
      channels INTEGER,
      waveform_json TEXT,
      created_at TEXT NOT NULL,
      indexed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_tags (
      file_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (file_id, tag_id),
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_files_name ON files(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_files_parent_dir ON files(parent_dir COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_file_tags_file_id ON file_tags(file_id);
    CREATE INDEX IF NOT EXISTS idx_file_tags_tag_id ON file_tags(tag_id);
  `);
}

module.exports = {
  initSchema,
};
