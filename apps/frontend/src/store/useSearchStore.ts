import { create } from 'zustand';

interface SearchState {
  searchQuery: string;
  isSearching: boolean;
  searchOffset: number;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  resetSearchOffset: () => void;
  incrementSearchOffset: (amount: number) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchQuery: '',
  isSearching: false,
  searchOffset: 0,
  setSearchQuery: (query) =>
    set({
      searchQuery: query,
      isSearching: query.trim().length > 0,
      searchOffset: 0,
    }),
  clearSearch: () => set({ searchQuery: '', isSearching: false, searchOffset: 0 }),
  resetSearchOffset: () => set({ searchOffset: 0 }),
  incrementSearchOffset: (amount) =>
    set((state) => ({ searchOffset: state.searchOffset + amount })),
}));
