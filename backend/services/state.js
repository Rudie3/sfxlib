const indexState = {
  indexing: false,
  indexedCount: 0,
  scannedCount: 0,
  startedAt: null,
  finishedAt: null,
  lastError: null,
};

function resetIndexState() {
  indexState.indexing = false;
  indexState.indexedCount = 0;
  indexState.scannedCount = 0;
  indexState.startedAt = null;
  indexState.finishedAt = null;
  indexState.lastError = null;
}

module.exports = {
  indexState,
  resetIndexState,
};
