const fs = require('fs/promises');
const path = require('path');
const mm = require('music-metadata');
const { db } = require('../db/database');
const { buildWaveformPeaks } = require('./waveform');
const { indexState } = require('./state');

const SUPPORTED_EXTENSIONS = new Set(['.wav', '.mp3', '.flac', '.ogg', '.aiff', '.aac', '.m4a']);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const all = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walk(absolutePath);
      all.push(...nested);
      continue;
    }

    all.push(absolutePath);
  }

  return all;
}

function upsertFileRecord(record) {
  const stmt = db.prepare(`
    INSERT INTO files (
      name, absolute_path, relative_path, parent_dir, extension, size_bytes,
      modified_ms, duration_seconds, sample_rate, channels, waveform_json,
      created_at, indexed_at
    )
    VALUES (
      @name, @absolute_path, @relative_path, @parent_dir, @extension, @size_bytes,
      @modified_ms, @duration_seconds, @sample_rate, @channels, @waveform_json,
      @created_at, @indexed_at
    )
    ON CONFLICT(absolute_path) DO UPDATE SET
      name = excluded.name,
      relative_path = excluded.relative_path,
      parent_dir = excluded.parent_dir,
      extension = excluded.extension,
      size_bytes = excluded.size_bytes,
      modified_ms = excluded.modified_ms,
      duration_seconds = excluded.duration_seconds,
      sample_rate = excluded.sample_rate,
      channels = excluded.channels,
      waveform_json = excluded.waveform_json,
      indexed_at = excluded.indexed_at
  `);

  stmt.run(record);
}

async function indexSingleFile(rootPath, absolutePath) {
  const stat = await fs.stat(absolutePath);
  const extension = path.extname(absolutePath).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return null;
  }

  let metadata = null;
  try {
    metadata = await mm.parseFile(absolutePath);
  } catch (err) {
    metadata = null;
  }

  let waveform = [];
  try {
    waveform = await buildWaveformPeaks(absolutePath);
  } catch (err) {
    waveform = [];
  }

  const now = new Date().toISOString();
  const relativePath = path.relative(rootPath, absolutePath);

  const record = {
    name: path.basename(absolutePath),
    absolute_path: absolutePath,
    relative_path: relativePath,
    parent_dir: path.dirname(relativePath),
    extension,
    size_bytes: stat.size,
    modified_ms: stat.mtimeMs,
    duration_seconds: metadata?.format?.duration ?? null,
    sample_rate: metadata?.format?.sampleRate ?? null,
    channels: metadata?.format?.numberOfChannels ?? null,
    waveform_json: JSON.stringify(waveform),
    created_at: now,
    indexed_at: now,
  };

  upsertFileRecord(record);
  indexState.indexedCount += 1;
  return record;
}

async function indexLibrary(rootPath) {
  indexState.indexing = true;
  indexState.startedAt = new Date().toISOString();
  indexState.finishedAt = null;
  indexState.indexedCount = 0;
  indexState.scannedCount = 0;
  indexState.lastError = null;

  try {
    const paths = await walk(rootPath);
    indexState.scannedCount = paths.length;

    // Track all indexed paths
    const indexedPaths = new Set();

    for (const absolutePath of paths) {
      await indexSingleFile(rootPath, absolutePath);
      indexedPaths.add(absolutePath);
    }

    // Delete files that no longer exist on disk
    const existingFiles = db.prepare('SELECT id, absolute_path FROM files').all();
    const deleteStmt = db.prepare('DELETE FROM files WHERE id = ?');
    
    for (const file of existingFiles) {
      if (!indexedPaths.has(file.absolute_path)) {
        deleteStmt.run(file.id);
      }
    }

    indexState.indexing = false;
    indexState.finishedAt = new Date().toISOString();
    return { indexedCount: indexState.indexedCount, scannedCount: indexState.scannedCount };
  } catch (err) {
    indexState.indexing = false;
    indexState.finishedAt = new Date().toISOString();
    indexState.lastError = err.message;
    throw err;
  }
}

function deleteMissingFiles(rootPath) {
  const rows = db.prepare('SELECT id, absolute_path FROM files').all();
  const deleteStmt = db.prepare('DELETE FROM files WHERE id = ?');

  for (const row of rows) {
    if (!row.absolute_path.startsWith(rootPath)) {
      continue;
    }

    deleteStmt.run(row.id);
  }
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  indexLibrary,
  indexSingleFile,
  deleteMissingFiles,
};
