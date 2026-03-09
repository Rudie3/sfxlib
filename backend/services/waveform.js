const fs = require('fs/promises');

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function parseWavInfo(buffer) {
  if (buffer.length < 44) {
    return null;
  }

  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return null;
  }

  let fmt = null;
  let dataStart = -1;
  let dataSize = 0;
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;
    const chunkDataEnd = chunkDataStart + chunkSize;

    if (chunkDataEnd > buffer.length) {
      break;
    }

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      fmt = {
        audioFormat: buffer.readUInt16LE(chunkDataStart),
        numChannels: buffer.readUInt16LE(chunkDataStart + 2),
        sampleRate: buffer.readUInt32LE(chunkDataStart + 4),
        blockAlign: buffer.readUInt16LE(chunkDataStart + 12),
        bitsPerSample: buffer.readUInt16LE(chunkDataStart + 14),
      };
    }

    if (chunkId === 'data') {
      dataStart = chunkDataStart;
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataEnd + (chunkSize % 2);
  }

  if (!fmt || dataStart < 0 || dataSize <= 0 || fmt.numChannels <= 0 || fmt.blockAlign <= 0) {
    return null;
  }

  return {
    ...fmt,
    dataStart,
    dataSize,
  };
}

function decodePcmSample(buffer, offset, audioFormat, bitsPerSample) {
  if (audioFormat === 3) {
    if (bitsPerSample === 32) {
      return clamp(buffer.readFloatLE(offset), -1, 1);
    }
    if (bitsPerSample === 64) {
      return clamp(buffer.readDoubleLE(offset), -1, 1);
    }
    return 0;
  }

  if (bitsPerSample === 8) {
    return (buffer.readUInt8(offset) - 128) / 128;
  }

  if (bitsPerSample === 16) {
    return buffer.readInt16LE(offset) / 32768;
  }

  if (bitsPerSample === 24) {
    const byte0 = buffer.readUInt8(offset);
    const byte1 = buffer.readUInt8(offset + 1);
    const byte2 = buffer.readUInt8(offset + 2);
    let sample = byte0 | (byte1 << 8) | (byte2 << 16);
    if (sample & 0x800000) {
      sample |= ~0xffffff;
    }
    return sample / 8388608;
  }

  if (bitsPerSample === 32) {
    return buffer.readInt32LE(offset) / 2147483648;
  }

  return 0;
}

function normalizePeaks(peaks, points) {
  if (!peaks.length) {
    return Array.from({ length: points }, () => 0);
  }

  // Light smoothing avoids single-bin spikes and creates a more natural envelope.
  const smoothed = peaks.map((_, index) => {
    const prev = peaks[Math.max(0, index - 1)] * 0.25;
    const curr = peaks[index] * 0.5;
    const next = peaks[Math.min(peaks.length - 1, index + 1)] * 0.25;
    return prev + curr + next;
  });

  const sorted = [...smoothed].sort((a, b) => a - b);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] || 1;
  const scale = p95 > 0 ? p95 : 1;

  return smoothed.map((peak) => {
    const normalized = clamp(peak / scale, 0, 1);
    return Number(normalized.toFixed(4));
  });
}

function buildWaveformFromWavBuffer(buffer, points) {
  const wav = parseWavInfo(buffer);
  if (!wav) {
    return null;
  }

  const bytesPerSample = Math.max(1, Math.floor(wav.bitsPerSample / 8));
  const frameCount = Math.floor(wav.dataSize / wav.blockAlign);
  if (frameCount <= 0) {
    return Array.from({ length: points }, () => 0);
  }

  const framesPerBucket = Math.max(1, Math.floor(frameCount / points));
  const peaks = [];

  for (let i = 0; i < points; i += 1) {
    const frameStart = i * framesPerBucket;
    const frameEnd = i === points - 1 ? frameCount : Math.min(frameCount, frameStart + framesPerBucket);
    const frameSpan = Math.max(1, frameEnd - frameStart);
    const frameStep = Math.max(1, Math.floor(frameSpan / 384));

    let sumSquares = 0;
    let sampleCount = 0;

    for (let frame = frameStart; frame < frameEnd; frame += frameStep) {
      const baseOffset = wav.dataStart + frame * wav.blockAlign;
      for (let channel = 0; channel < wav.numChannels; channel += 1) {
        const sampleOffset = baseOffset + channel * bytesPerSample;
        const maxSampleOffset = sampleOffset + bytesPerSample;
        if (maxSampleOffset > buffer.length) {
          break;
        }

        const sample = decodePcmSample(buffer, sampleOffset, wav.audioFormat, wav.bitsPerSample);
        sumSquares += sample * sample;
        sampleCount += 1;
      }
    }

    const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
    peaks.push(rms);
  }

  return normalizePeaks(peaks, points);
}

function buildWaveformFromGenericBytes(buffer, points) {
  if (buffer.length === 0) {
    return Array.from({ length: points }, () => 0);
  }

  const chunkSize = Math.max(1, Math.floor(buffer.length / points));
  const peaks = [];

  for (let i = 0; i < points; i += 1) {
    const start = i * chunkSize;
    const end = i === points - 1 ? buffer.length : Math.min(buffer.length, start + chunkSize);
    const span = Math.max(1, end - start);
    const step = Math.max(1, Math.floor(span / 384));

    let sumSquares = 0;
    let count = 0;

    for (let j = start; j < end; j += step) {
      const centered = (buffer[j] - 128) / 128;
      sumSquares += centered * centered;
      count += 1;
    }

    peaks.push(count > 0 ? Math.sqrt(sumSquares / count) : 0);
  }

  return normalizePeaks(peaks, points);
}

async function buildWaveformPeaks(filePath, points = 120) {
  const buffer = await fs.readFile(filePath);
  if (buffer.length === 0) {
    return Array.from({ length: points }, () => 0);
  }

  const wavPeaks = buildWaveformFromWavBuffer(buffer, points);
  if (wavPeaks) {
    return wavPeaks;
  }

  return buildWaveformFromGenericBytes(buffer, points);
}

module.exports = {
  buildWaveformPeaks,
};
