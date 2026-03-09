const express = require('express');
const cors = require('cors');
const { initSchema } = require('./db/schema');
const { setupRouter, getSetting } = require('./routes/setup');
const { filesRouter } = require('./routes/files');
const { searchRouter } = require('./routes/search');
const { tagsRouter } = require('./routes/tags');
const { errorHandler } = require('./middleware/errorHandler');
const { startWatcher } = require('./services/watcher');

const app = express();
const port = process.env.PORT || 3131;

initSchema();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/setup', setupRouter);
app.use('/api/files', filesRouter);
app.use('/api/search', searchRouter);
app.use('/api/tags', tagsRouter);

app.use(errorHandler);

app.listen(port, () => {
  const rootPath = getSetting('rootPath');
  if (rootPath) {
    startWatcher(rootPath);
  }

  // eslint-disable-next-line no-console
  console.log(`sfxlib backend listening on http://localhost:${port}`);
});
