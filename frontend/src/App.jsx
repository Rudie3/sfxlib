import { useEffect, useMemo, useRef, useState } from 'react';
import { api, streamUrl } from './api/client';
import { useStore } from './state/store';
import SetupView from './components/SetupView';
import SearchBar from './components/SearchBar';
import FileTree from './components/FileTree';

export default function App() {
  const {
    setup,
    setSetup,
    tree,
    setTree,
    searchMode,
    setSearchMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    playingFileId,
    setPlayingFileId,
    playbackProgress,
    setPlaybackProgress,
    tags,
    setTags,
    indexingStatus,
    setIndexingStatus,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState('');
  const [fileDetails, setFileDetails] = useState({});
  const audioRef = useRef(new Audio());

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [setupInfo, treeInfo, tagInfo, status] = await Promise.all([
          api.getSetup(),
          api.getTree().catch(() => ({ tree: null })),
          api.listTags().catch(() => ({ tags: [] })),
          api.getStatus().catch(() => null),
        ]);

        setSetup(setupInfo);
        setTree(treeInfo.tree);
        setTags(tagInfo.tags || []);
        setIndexingStatus(status);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    const interval = setInterval(async () => {
      const status = await api.getStatus().catch(() => null);
      if (status) {
        setIndexingStatus(status);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [setSetup, setTree, setTags, setIndexingStatus]);

  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) {
        setPlaybackProgress(0);
        return;
      }
      setPlaybackProgress(audio.currentTime / audio.duration);
    };

    const onEnded = () => {
      setPlayingFileId(null);
      setPlaybackProgress(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [setPlaybackProgress, setPlayingFileId]);

  const handleSetup = async (rootPath) => {
    try {
      setSetupError('');
      await api.setupRoot(rootPath);
      const [setupInfo, treeInfo] = await Promise.all([api.getSetup(), api.getTree()]);
      setSetup(setupInfo);
      setTree(treeInfo.tree);
    } catch (err) {
      setSetupError(err.message);
    }
  };

  const handlePlayPause = async (fileId) => {
    const audio = audioRef.current;

    if (playingFileId === fileId) {
      audio.pause();
      setPlayingFileId(null);
      return;
    }

    if (!fileDetails[fileId]) {
      const details = await api.getFile(fileId);
      setFileDetails((prev) => ({ ...prev, [fileId]: details }));
    }

    audio.src = streamUrl(fileId);
    await audio.play();
    setPlayingFileId(fileId);
  };

  const handleSeek = (fileId, event) => {
    if (playingFileId !== fileId) {
      return;
    }

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * (audio.duration || 0);
  };

  const handleSearch = async (query, mode) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const res = await api.search(query, mode);
    setSearchResults(res.results);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery, searchMode);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMode]);

  const filterTreeByResults = (node, allowedIds) => {
    if (!node) {
      return null;
    }

    if (node.type === 'file') {
      return allowedIds.has(node.id) ? node : null;
    }

    const children = (node.children || [])
      .map((child) => filterTreeByResults(child, allowedIds))
      .filter(Boolean);

    if (node.name === '/' || children.length > 0) {
      return { ...node, children };
    }

    return null;
  };

  const visibleTree = useMemo(() => {
    if (!tree) {
      return null;
    }

    if (!searchResults) {
      return tree;
    }

    const allowedIds = new Set(searchResults.map((item) => item.id));
    return filterTreeByResults(tree, allowedIds);
  }, [tree, searchResults]);

  const refreshTagsAndTree = async () => {
    const [tagInfo, treeInfo] = await Promise.all([api.listTags(), api.getTree()]);
    setTags(tagInfo.tags || []);
    setTree(treeInfo.tree);
  };

  const handleCreateTag = async (name) => {
    await api.upsertTag({ name });
    await refreshTagsAndTree();
  };

  const handleApplyTags = async (fileId, tagIds) => {
    await api.setFileTags(fileId, tagIds);
    await refreshTagsAndTree();
    const details = await api.getFile(fileId);
    setFileDetails((prev) => ({ ...prev, [fileId]: details }));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!setup.isSetup) {
    return <SetupView onSubmit={handleSetup} loading={Boolean(indexingStatus?.indexing)} error={setupError} />;
  }

  return (
    <main className="app-wrap">
      <header>
        <h1>sfxlib</h1>
        <p>{setup.rootPath}</p>
        {indexingStatus?.indexing ? (
          <p className="indexing">Indexing {indexingStatus.indexedCount}/{indexingStatus.scannedCount}</p>
        ) : null}
      </header>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        mode={searchMode}
        onModeChange={setSearchMode}
        onClear={() => {
          setSearchQuery('');
          setSearchResults(null);
        }}
      />

      <FileTree
        tree={visibleTree}
        fileDetails={fileDetails}
        onPlayPause={handlePlayPause}
        playingFileId={playingFileId}
        progress={playbackProgress}
        onSeek={handleSeek}
        allTags={tags}
        onCreateTag={handleCreateTag}
        onApplyTags={handleApplyTags}
      />
    </main>
  );
}
