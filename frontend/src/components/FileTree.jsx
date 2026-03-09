import { useState } from 'react';
import FileRow from './FileRow';

function DirectoryNode({
  node,
  depth,
  fileDetails,
  onPlayPause,
  onRevealInExplorer,
  playingFileId,
  progress,
  onSeek,
  allTags,
  onCreateTag,
  onApplyTags,
}) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === 'file') {
    const details = fileDetails[node.id] || {
      ...node,
      waveform: node.waveform || [],
      relative_path: node.relative_path || node.name,
      tags: node.tags || [],
    };

    return (
      <div className="tree-file" style={{ marginLeft: `${depth * 16}px` }}>
        <FileRow
          file={details}
          expanded
          onPlayPause={() => onPlayPause(node.id)}
          onRevealInExplorer={() => onRevealInExplorer(node.id)}
          isPlaying={playingFileId === node.id}
          progress={playingFileId === node.id ? progress : 0}
          onSeek={(event) => onSeek(node.id, event)}
          allTags={allTags}
          onCreateTag={onCreateTag}
          onApplyTags={onApplyTags}
        />
      </div>
    );
  }

  return (
    <div className="tree-dir">
      <div className="tree-dir-line" style={{ marginLeft: `${depth * 16}px` }} onClick={() => setOpen((v) => !v)}>
        <strong>{open ? '[-]' : '[+]'}</strong> {node.name}
      </div>
      {open
        ? node.children?.map((child, idx) => (
            <DirectoryNode
              key={`${child.type}-${child.name}-${idx}`}
              node={child}
              depth={depth + 1}
              fileDetails={fileDetails}
              onPlayPause={onPlayPause}
              onRevealInExplorer={onRevealInExplorer}
              playingFileId={playingFileId}
              progress={progress}
              onSeek={onSeek}
              allTags={allTags}
              onCreateTag={onCreateTag}
              onApplyTags={onApplyTags}
            />
          ))
        : null}
    </div>
  );
}

export default function FileTree(props) {
  const { tree } = props;
  if (!tree) {
    return <p className="empty">No files indexed yet.</p>;
  }

  return <DirectoryNode node={tree} depth={-1} {...props} />;
}
