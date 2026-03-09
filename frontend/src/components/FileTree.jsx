import { useEffect, useMemo, useState } from 'react';
import FileRow from './FileRow';

function collectDirectories(node, depth = -1, path = 'root') {
  if (!node || node.type === 'file') {
    return [];
  }

  const entries = [{ depth, path }];
  const childEntries = (node.children || []).flatMap((child, index) =>
    collectDirectories(child, depth + 1, `${path}/${index}:${child.name}`),
  );

  return [...entries, ...childEntries];
}

function buildDefaultOpenState(directories) {
  return directories.reduce((acc, dir) => {
    acc[dir.path] = dir.depth < 1;
    return acc;
  }, {});
}

function DirectoryNode({
  node,
  depth,
  fileDetails,
  onPlayPause,
  onRevealInExplorer,
  playingFileId,
  activePlaybackFileId,
  progress,
  onSeek,
  allTags,
  onCreateTag,
  onApplyTags,
  openMap,
  setOpenMap,
  nodePath,
}) {
  const open = openMap[nodePath] ?? depth < 1;

  const toggleOpen = () => {
    setOpenMap((prev) => ({ ...prev, [nodePath]: !(prev[nodePath] ?? depth < 1) }));
  };

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
          progress={activePlaybackFileId === node.id ? progress : 0}
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
      <div className="tree-dir-line" style={{ marginLeft: `${depth * 16}px` }} onClick={toggleOpen}>
        <strong>{open ? '[-]' : '[+]'}</strong> {node.name}
      </div>
      {open
        ? node.children?.map((child, idx) => (
            <DirectoryNode
              key={`${nodePath}-${child.type}-${child.name}-${idx}`}
              node={child}
              depth={depth + 1}
              fileDetails={fileDetails}
              onPlayPause={onPlayPause}
              onRevealInExplorer={onRevealInExplorer}
              playingFileId={playingFileId}
              activePlaybackFileId={activePlaybackFileId}
              progress={progress}
              onSeek={onSeek}
              allTags={allTags}
              onCreateTag={onCreateTag}
              onApplyTags={onApplyTags}
              openMap={openMap}
              setOpenMap={setOpenMap}
              nodePath={`${nodePath}/${idx}:${child.name}`}
            />
          ))
        : null}
    </div>
  );
}

export default function FileTree(props) {
  const { tree } = props;
  const directories = useMemo(() => collectDirectories(tree), [tree]);
  const [openMap, setOpenMap] = useState({});

  useEffect(() => {
    setOpenMap((prev) => {
      const defaults = buildDefaultOpenState(directories);
      const merged = { ...defaults };

      for (const dir of directories) {
        if (Object.prototype.hasOwnProperty.call(prev, dir.path)) {
          merged[dir.path] = prev[dir.path];
        }
      }

      return merged;
    });
  }, [directories]);

  if (!tree) {
    return <p className="empty">No files indexed yet.</p>;
  }

  const toggleAll = () => {
    const allOpen = directories.every((dir) => openMap[dir.path]);
    setOpenMap(
      directories.reduce((acc, dir) => {
        acc[dir.path] = dir.depth < 0 ? true : !allOpen;
        return acc;
      }, {}),
    );
  };

  const allOpen = directories.every((dir) => openMap[dir.path]);

  return (
    <section className="tree-wrap">
      <div className="tree-actions">
        <button type="button" onClick={toggleAll}>
          {allOpen ? 'Collapse all directories' : 'Expand all directories'}
        </button>
      </div>
      <DirectoryNode node={tree} depth={-1} nodePath="root" openMap={openMap} setOpenMap={setOpenMap} {...props} />
    </section>
  );
}
