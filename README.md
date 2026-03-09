# sfxlib

Local app for browsing, searching, tagging, and previewing a personal sound effects library.

## What it does

- First-run setup to configure a root SFX folder path.
- Recursive indexing of audio files into SQLite.
- Live updates when files are added, changed, or removed.
- File tree browsing with directory-first sorting.
- Search by file name, parent folder, tag, or all fields.
- Tag management and tag assignment per file.
- Inline playback with progress and seek.
- Lightweight waveform bar rendering from indexed data.

## Tech stack

- Backend: Node.js + Express + SQLite (`better-sqlite3`)
- Frontend: React + Vite + Zustand
- File watching: `chokidar`
- Audio metadata: `music-metadata`

## Project structure

```text
sfxlib/
	backend/
		server.js
		routes/
		services/
		db/
	frontend/
		src/
```

## Prerequisites

- Node.js 18+
- npm 9+
- Read access to your local SFX library directory

## Quick start

1. Install dependencies from the repository root:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

2. Start backend and frontend in development mode:

```bash
npm run dev
```

3. Open the app:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3131`

4. On first launch, enter your sound library root path (example: `C:\audio\sfx`) and submit.

## Scripts

From repo root:

- `npm run dev`: run backend + frontend together.
- `npm run dev:backend`: run backend only.
- `npm run dev:frontend`: run frontend only.
- `npm run start`: run backend in production mode.

Backend (`backend/package.json`):

- `npm run dev`: run backend with `nodemon`.
- `npm run start`: run backend with Node.

Frontend (`frontend/package.json`):

- `npm run dev`: start Vite dev server.
- `npm run build`: build production frontend.
- `npm run preview`: preview built frontend.

## Supported audio extensions

Current indexing includes:

- `.wav`, `.mp3`, `.flac`, `.ogg`, `.aiff`, `.aac`, `.m4a`

## API summary

- `GET /api/health`: service health check.
- `GET /api/setup`: get setup status and configured root path.
- `POST /api/setup`: save root path and run full reindex.
- `POST /api/setup/reindex`: rerun full reindex using saved root path.
- `GET /api/setup/status`: get indexing progress state.
- `GET /api/files/tree`: get indexed tree with file metadata and tags.
- `GET /api/files/:id`: get single file details.
- `GET /api/files/:id/stream`: stream audio file.
- `GET /api/search?q=...&mode=all|filename|folder|tag`: search indexed files.
- `GET /api/tags`: list tags.
- `POST /api/tags`: create/update tag by name.
- `PUT /api/tags/file/:fileId`: replace a file's assigned tags.
- `DELETE /api/tags/:id`: delete tag.

## Data and storage

- SQLite database file: `backend/data/sfxlib.db`.
- Root path is persisted in the `settings` table.
- Indexed file records include metadata and waveform JSON.

## Notes and current limitations

- This app is local-only; no authentication or multi-user model is included.
- Frontend API base URL is currently hardcoded to `http://localhost:3131/api`.
- Waveform values are derived from raw file bytes for fast visualization, not DSP-accurate waveform extraction.
