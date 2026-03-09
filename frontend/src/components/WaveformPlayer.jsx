export default function WaveformPlayer({ peaks = [], progress = 0, onSeek }) {
  const safeProgress = Math.max(0, Math.min(progress, 1));
  const safePeaks = peaks.length > 0 ? peaks : Array.from({ length: 72 }, () => 0.08);

  return (
    <div className="waveform" onClick={onSeek} role="button" tabIndex={0}>
      {safePeaks.map((peak, index) => {
        const filled = index / safePeaks.length <= safeProgress;
        // Apply power curve to exaggerate differences and make waveform more visible
        const normalizedPeak = Math.max(0, Math.min(1, Number(peak) || 0));
        const enhancedPeak = Math.pow(normalizedPeak, 0.6);
        // Scale to percentage with minimum and maximum heights
        const heightPercent = Math.max(12, Math.min(100, enhancedPeak * 100));
        
        return (
          <span
            key={`${index}-${normalizedPeak}`}
            className={`waveform-bar ${filled ? 'filled' : ''}`}
            style={{ height: `${heightPercent}%` }}
          />
        );
      })}
    </div>
  );
}
