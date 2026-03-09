## Plan: Build Local SFX Browser Web App

Build a local-first Node.js + React app (browser UI served by a local backend) that indexes an audio library into SQLite, renders a folder-tree browser with playback + waveform progress, and supports tagging + multi-mode search. Recommended approach: bootstrap a monorepo-style structure (`backend` + `frontend`), implement core indexing/playback/search/tag flows first, then add file watching and harden with tests.

**Steps**
1. Phase 1 - Scaffold project foundations
2. Create root workspace files (`.gitignore`, `README.md`, optional root scripts) and initialize `backend` and `frontend` packages with independent `package.json` files. This is the base dependency for all later steps.
3. Backend foundation: set up Express app, CORS, JSON parsing, central error middleware, health/status endpoint, and startup configuration (ports, DB path, persisted config path). *depends on 1*
4. Frontend foundation: set up React app shell, routing/layout for setup vs main view, API client wrapper, and global state store for setup/index/search/player/tag state. *depends on 1*

5. Phase 2 - Persistence and setup flow
6. Implement SQLite layer (`better-sqlite3` recommended) with schema init and migration guard; enable WAL and create indexes for filename, parent directory, and tags. *depends on 2*
7. Add persisted app config for first-run root path (e.g., small `settings` table or JSON config file), and backend endpoints to read/update setup state. *depends on 6*
8. Implement first-run UI: if no root path is configured, show setup screen with validated path input and “Start Indexing”; on success transition to main browser view. *depends on 4,7*

9. Phase 3 - Indexing and live sync
10. Build recursive indexer service for selected extensions (`wav`, `mp3`, `flac`, `ogg`, `aiff`, `aac`, `m4a`), writing directory + file records with stable IDs and timestamps. *depends on 6,7*
11. Implement waveform precomputation during indexing (downsampled peak array) and store compactly in DB for playback UI reuse. *depends on 10*
12. Add index progress reporting endpoint(s) and in-memory status tracking so UI can show indexing progress and completion. *parallel with 11; depends on 10*
13. Add file watcher (`chokidar`) to auto-sync add/change/delete events after initial index, with debounce + safe reindex/update/delete handling. *depends on 10*

14. Phase 4 - Retrieval, search, tags, and playback APIs
15. Implement tree data API returning directory/file hierarchy sorted predictably and optimized for UI expansion. *depends on 10*
16. Implement search API supporting:
17. Unified query across filename + parent directory + tags (default)
18. Optional mode-specific filtering (filename-only, folder-only, tag-only) per your “Both” requirement
19. *depends on 6,10*
20. Implement tag APIs: create/list/delete tags, assign/unassign tags on files, and query tags per file. *depends on 6*
21. Implement file detail API for playback metadata + waveform peaks payloads. *depends on 11*

22. Phase 5 - Frontend feature implementation
23. Build main split-pane UI: search controls + optional mode selector, tree browser, and now-playing area. *depends on 8,15,16*
24. Implement tree components with lazy expansion and file item rows containing:
25. Play/pause toggle button bound to a single active audio element
26. File metadata display
27. Tag display/edit controls
28. *depends on 23,20,21*
29. Implement waveform component using Canvas/SVG that fills horizontally with playback progress and supports click-to-seek. *depends on 21,24*
30. Wire search and tag filters into displayed file set with debounce and clear UX for “unified” vs “mode” search behavior. *depends on 23,16,20*
31. Handle live updates from watcher events by refetching/incrementally updating tree and search results without full reload when possible. *depends on 13,23*

32. Phase 6 - Validation, performance, and polish
33. Add backend tests for indexing, search correctness, tag CRUD/assignment, and watcher-driven sync behavior. *depends on 10,16,20,13*
34. Add frontend tests for setup flow, tree rendering, play/pause behavior, waveform progress fill, and search mode behavior. *depends on 23-30*
35. Run manual verification on a realistic library (including nested folders and thousands of files), tune query/index performance and render virtualization if needed. *depends on 33,34*
36. Document setup/run usage and limitations in README (supported formats, local-only assumptions, how first-run setup works). *depends on 35*

**Relevant files**
- `c:\Users\mfarq\dev\gits\sfxlib\backend\server.js` - Express bootstrap, middleware, route registration, app startup.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\db\schema.js` - SQLite schema creation and migration/version checks.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\db\queries.js` - Reusable file/tree/search/tag SQL accessors.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\services\indexer.js` - Recursive scan + metadata extraction + DB writes.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\services\waveform.js` - Precompute waveform peaks and normalization.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\services\watcher.js` - `chokidar` sync handling for add/change/delete.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\routes\setup.js` - First-run root path endpoints.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\routes\files.js` - Tree/list/file detail endpoints.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\routes\search.js` - Unified + mode-based search endpoints.
- `c:\Users\mfarq\dev\gits\sfxlib\backend\routes\tags.js` - Tag CRUD and file-tag assignment endpoints.
- `c:\Users\mfarq\dev\gits\sfxlib\frontend\src\App.jsx` - Setup gating and top-level layout.
- `c:\Users\mfarq\dev\gits\sfxlib\frontend\src\components\SetupView.jsx` - Root path input and index start UX.
- `c:\Users\mfarq\dev\gits\sfxlib\frontend\src\components\FileTree.jsx` - Directory/file tree rendering and expansion.
- `c:\Users\mfarq\dev\gits\sfxlib\frontend\src\components\FileRow.jsx` - File line item with controls + tag affordances.
- `c:\Users\mfarq\dev\gits\sfxlib\frontend\src\components\WaveformPlayer.jsx` - Audio play/pause + waveform fill/seek behavior.
- `c:\Users\mfarq\dev\gits\sfxlib\frontend\src\components\SearchBar.jsx` - Unified query + optional mode controls.
- `c:\Users\mfarq\dev\gits\sfxlib\frontend\src\state\store.js` - Centralized app/player/search/tag/indexing state.
- `c:\Users\mfarq\dev\gits\sfxlib\README.md` - Local runbook and user instructions.

**Verification**
1. Backend unit tests: index sample library and assert file count, supported extension filtering, metadata persistence, and waveform row creation.
2. Backend integration tests: verify search returns by filename, parent folder, and tag; verify mode-specific filtering narrows correctly.
3. Backend integration tests: tag create/list/delete and file-tag assign/unassign roundtrip.
4. Watcher tests/manual checks: add, rename, modify, and delete files in root path and verify DB/UI update without manual reindex.
5. Frontend tests: first-run setup gating; tree expand/collapse; file row play->pause toggle; waveform fill progression over time.
6. Manual QA on Windows: confirm path input handling for local drives and spaces, and that first-run choice persists across restarts.
7. Performance check: index at least 5k files and validate acceptable initial index duration, search latency, and UI responsiveness.

**Decisions**
- Runtime: browser app + local Node backend (no Electron/Tauri for v1).
- Formats in scope: `wav`, `mp3`, `flac`, `ogg`, `aiff`, `aac`, `m4a`.
- Search UX: provide both unified search and explicit mode filtering.
- Sync model: enable automatic file system watching after initial index.
- Waveform strategy: precompute during indexing, then read from cache for playback rendering.
- Included scope: local-only single-user app, SQLite persistence, tagging/search/playback/waveform/tree.
- Excluded scope: cloud sync, multi-user auth, remote hosting, advanced DAW-style editing.

**Further Considerations**
1. Metadata extraction engine recommendation: start with `music-metadata` for lightweight duration/sample-rate reads and only add `ffmpeg` if unsupported edge cases appear.
2. For very large libraries, be ready to add tree virtualization and folder-level lazy loading as a Phase 2 optimization if UI becomes heavy.