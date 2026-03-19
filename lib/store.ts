import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RssSource, BookmarkEntry } from "./types";

const STORAGE_KEY = "rss-dashboard-v1";

// Versioned localStorage storage with try-catch (client-localstorage-schema rule)
const safeStorage = createJSONStorage(() => ({
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Throws in incognito/private browsing, quota exceeded, or disabled
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
}));

export const DEFAULT_SOURCES: RssSource[] = [
  {
    id: "reuters",
    name: "Reuters",
    url: "https://feeds.reuters.com/reuters/businessNews",
    addedAt: 0,
  },
  {
    id: "cnbc",
    name: "CNBC",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    addedAt: 0,
  },
];

interface DashboardState {
  sources: RssSource[];
  bookmarks: Record<string, BookmarkEntry>; // keyed by articleId for O(1) lookup (js-set-map-lookups rule)
  activeTab: string;
  searchQuery: string;
  lastUpdatedAt: number | null;

  addSource: (source: RssSource) => void;
  removeSource: (id: string) => void;
  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  toggleBookmark: (articleId: string) => void;
  setMemo: (articleId: string, memo: string) => void;
  setLastUpdatedAt: (ts: number) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      sources: DEFAULT_SOURCES,
      bookmarks: {},
      activeTab: "All",
      searchQuery: "",
      lastUpdatedAt: null,

      addSource: (source) =>
        set((state) => ({ sources: [...state.sources, source] })),

      removeSource: (id) =>
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleBookmark: (articleId) =>
        set((state) => {
          const bookmarks = { ...state.bookmarks };
          if (bookmarks[articleId]) {
            delete bookmarks[articleId];
          } else {
            bookmarks[articleId] = {
              articleId,
              memo: "",
              bookmarkedAt: Date.now(),
            };
          }
          return { bookmarks };
        }),

      setMemo: (articleId, memo) =>
        set((state) => ({
          bookmarks: {
            ...state.bookmarks,
            [articleId]: {
              ...(state.bookmarks[articleId] ?? {
                articleId,
                bookmarkedAt: Date.now(),
              }),
              memo,
            },
          },
        })),

      setLastUpdatedAt: (ts) => set({ lastUpdatedAt: ts }),
    }),
    {
      name: STORAGE_KEY,
      storage: safeStorage,
      // Only persist user data, not UI state (rerender-derived-state rule: derive activeTab, searchQuery from props/events)
      partialize: (state) => ({
        sources: state.sources,
        bookmarks: state.bookmarks,
      }),
    },
  ),
);

// Derived boolean selectors (rerender-derived-state rule: subscribe to boolean, not full bookmarks record)
export const selectIsBookmarked = (articleId: string) => (state: DashboardState) =>
  Boolean(state.bookmarks[articleId]);

export const selectMemo = (articleId: string) => (state: DashboardState) =>
  state.bookmarks[articleId]?.memo ?? "";

// O(1) URL duplicate check using Set (js-set-map-lookups rule)
export const selectSourceUrlSet = (state: DashboardState): Set<string> =>
  new Set(state.sources.map((s) => s.url));
