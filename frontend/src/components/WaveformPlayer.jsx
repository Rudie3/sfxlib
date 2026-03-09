export default function WaveformPlayer({ peaks = [], progress = 0, onSeek }) {
  const safeProgress = Math.max(0, Math.min(progress, 1));

  return (
    <div className="waveform" onClick={onSeek} role="button" tabIndex={0}>
      {peaks.map((peak, index) => {
        const filled = index / peaks.length <= safeProgress;
        return (
          <span
            key={`${index}-${peak}`}
            className={`waveform-bar ${filled ? 'filled' : ''}`}
            style={{ height: `${Math.max(8, peak * 42)}px` }}
          />
        );
      })}
    </div>
  );
}
