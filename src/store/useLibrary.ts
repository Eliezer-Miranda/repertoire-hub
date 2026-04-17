import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Repertoire, Song } from "@/types/music";
import { mockRepertoires, mockSongs } from "@/data/mockLibrary";

type LibraryState = {
  songs: Song[];
  repertoires: Repertoire[];
  favorites: Set<string>;
  currentSongId: string | null;
  isPlaying: boolean;

  toggleFavorite: (id: string) => void;
  playSong: (id: string) => void;
  togglePlay: () => void;

  addRepertoire: (r: Omit<Repertoire, "id" | "createdAt">) => string;
  updateRepertoire: (id: string, patch: Partial<Repertoire>) => void;
  deleteRepertoire: (id: string) => void;
};

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      songs: mockSongs,
      repertoires: mockRepertoires,
      favorites: new Set(mockSongs.filter((s) => s.favorite).map((s) => s.id)),
      currentSongId: null,
      isPlaying: false,

      toggleFavorite: (id) =>
        set((state) => {
          const next = new Set(state.favorites);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { favorites: next };
        }),

      playSong: (id) => set({ currentSongId: id, isPlaying: true }),
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

      addRepertoire: (r) => {
        const id = `r-${Date.now()}`;
        const newRep: Repertoire = { ...r, id, createdAt: new Date().toISOString() };
        set((s) => ({ repertoires: [newRep, ...s.repertoires] }));
        return id;
      },
      updateRepertoire: (id, patch) =>
        set((s) => ({
          repertoires: s.repertoires.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRepertoire: (id) =>
        set((s) => ({ repertoires: s.repertoires.filter((r) => r.id !== id) })),
    }),
    {
      name: "musiclib-store",
      partialize: (s) => ({
        repertoires: s.repertoires,
        favorites: Array.from(s.favorites),
      }),
      // Custom hydration to convert favorites array back to Set
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favorites)) {
          (state as unknown as { favorites: Set<string> }).favorites = new Set(
            state.favorites as unknown as string[]
          );
        }
      },
    }
  )
);
