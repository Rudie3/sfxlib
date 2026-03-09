import { create } from 'zustand';

export const useStore = create((set) => ({
  setup: { isSetup: false, rootPath: '' },
  indexingStatus: null,
  tree: null,
  searchMode: 'all',
  searchQuery: '',
  searchResults: null,
  playingFileId: null,
  playbackProgress: 0,
  tags: [],

  setSetup: (setup) => set({ setup }),
  setIndexingStatus: (indexingStatus) => set({ indexingStatus }),
  setTree: (tree) => set({ tree }),
  setSearchMode: (searchMode) => set({ searchMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setPlayingFileId: (playingFileId) => set({ playingFileId }),
  setPlaybackProgress: (playbackProgress) => set({ playbackProgress }),
  setTags: (tags) => set({ tags }),
}));
