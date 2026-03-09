import { useMemo, useState } from 'react';
import WaveformPlayer from './WaveformPlayer';

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
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const fileTagIds = useMemo(() => {
    return allTags.filter((tag) => file.tags?.includes(tag.name)).map((tag) => tag.id);
  }, [allTags, file.tags]);

  const effectiveTagIds = selectedTagIds.length > 0 ? selectedTagIds : fileTagIds;

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      return [...prev, tagId];
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
        <button type="button" onClick={onPlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={onRevealInExplorer}>
          Show in folder
        </button>
        <div className="file-meta">
          <div className="file-name">{file.name}</div>
          <div className="file-sub">{file.relative_path}</div>
        </div>
      </div>
      {expanded ? (
        <>
          <WaveformPlayer peaks={file.waveform || []} progress={progress} onSeek={onSeek} />
          <div className="tag-list">
            {allTags.map((tag) => {
              const checked = effectiveTagIds.includes(tag.id);
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
            <button type="button" onClick={() => onApplyTags(file.id, effectiveTagIds)}>
              Save tags
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
