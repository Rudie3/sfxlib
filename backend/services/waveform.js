const fs = require('fs/promises');

async function buildWaveformPeaks(filePath, points = 120) {
  const buffer = await fs.readFile(filePath);
  if (buffer.length === 0) {
    return Array.from({ length: points }, () => 0);
  }

  const chunkSize = Math.max(1, Math.floor(buffer.length / points));
  const peaks = [];

  for (let i = 0; i < points; i += 1) {
    const start = i * chunkSize;
    const end = Math.min(buffer.length, start + chunkSize);
    let max = 0;

    for (let j = start; j < end; j += 1) {
      const val = Math.abs(buffer[j] - 128) / 128;
      if (val > max) {
        max = val;
      }
    }

    peaks.push(Number(max.toFixed(4)));
  }

  return peaks;
}

module.exports = {
  buildWaveformPeaks,
};
