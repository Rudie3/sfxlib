import { useEffect, useMemo, useState } from 'react';
import WaveformPlayer from './WaveformPlayer';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '--:--';
  }

  const rounded = Math.floor(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export default function FileRow({
  file,
  expanded,
  onPlayPause,
  onRevealInExplorer,
  isPlaying,
  progress,
  onSeek,
  allTags,
  onCreateTag,
  onApplyTags,
}) {
  const [newTagName, setNewTagName] = useState('');
  const [showTags, setShowTags] = useState(false);

  const fileTagIds = useMemo(() => {
    return allTags.filter((tag) => file.tags?.includes(tag.name)).map((tag) => tag.id);
  }, [allTags, file.tags]);

  const [selectedTagIds, setSelectedTagIds] = useState(fileTagIds);
  const formattedDuration = useMemo(() => formatDuration(file.duration_seconds), [file.duration_seconds]);
  const currentPlayDuration = useMemo(() => {
    const totalDuration = Number(file.duration_seconds);
    const safeProgress = Math.max(0, Math.min(Number(progress) || 0, 1));
    return formatDuration(totalDuration * safeProgress);
  }, [file.duration_seconds, progress]);

  useEffect(() => {
    setSelectedTagIds(fileTagIds);
  }, [fileTagIds]);

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) => {
      const next = prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId];
      void onApplyTags(file.id, next);
      return next;
    });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      return;
    }

    await onCreateTag(newTagName.trim());
    setNewTagName('');
  };

  return (
    <div className="file-row">
      <div className="file-row-top">
        <button type="button" onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button type="button" onClick={onRevealInExplorer} title="Show in folder">
          📁
        </button>
        <button 
          type="button" 
          onClick={() => setShowTags(!showTags)} 
          title="Toggle tags"
          className={showTags ? 'active' : ''}
        >
          🏷️
        </button>
        <div className="file-meta">
          <div className="file-name">{file.name}</div>
          <div className="file-sub-row">
            <span className="file-sub">{file.relative_path}</span>
            <span className="file-duration" title="Duration">
              {formattedDuration}
            </span>
          </div>
        </div>
        {expanded && (
          <div className="waveform-inline">
            <WaveformPlayer peaks={file.waveform || []} progress={progress} onSeek={onSeek} />
          </div>
        )}
        <span
          className={`file-current-duration${expanded ? '' : ' file-current-duration-right'}`}
          title="Current play position"
        >
          {currentPlayDuration}
        </span>
      </div>
      {showTags ? (
        <>
          <div className="tag-list">
            {allTags.map((tag) => {
              const checked = selectedTagIds.includes(tag.id);
              return (
                <label key={tag.id}>
                  <input type="checkbox" checked={checked} onChange={() => toggleTag(tag.id)} />
                  {tag.name}
                </label>
              );
            })}
          </div>
          <div className="tag-actions">
            <input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="new tag"
            />
            <button type="button" onClick={handleCreateTag}>
              Add tag
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
