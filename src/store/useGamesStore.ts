import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deviceStorage } from './storage';
import { todayKey } from '@/lib/dates';

export type GameId = 'memory' | 'maths' | 'slide' | 'sudoku' | 'schulte' | 'breathe';
export type Feel = 'tense' | 'okay' | 'calmer';

export interface GameRecord {
  id: string;
  game: GameId;
  date: string;
  seconds: number;
  won: boolean;
  score?: number; // maths: correct answers
  moves?: number; // memory / slide
  level?: string;
  feelAfter?: Feel;
}

export interface GameBest {
  bestScore?: number; // higher is better
  bestMoves?: number; // lower is better
  bestSeconds?: number; // lower is better
  plays: number;
}

interface GamesState {
  records: GameRecord[]; // newest first
  best: Partial<Record<string, GameBest>>; // key = game or game:level

  recordGame: (r: Omit<GameRecord, 'id' | 'date'>) => { id: string; newBest: boolean };
  setFeel: (id: string, feel: Feel) => void;
  reset: () => void;
}

export const bestKey = (game: GameId, level?: string) => (level ? `${game}:${level}` : game);

export const useGamesStore = create<GamesState>()(
  persist(
    (set, get) => ({
      records: [],
      best: {},

      recordGame: (r) => {
        const id = `g-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
        const key = bestKey(r.game, r.level);
        const prev: GameBest = get().best[key] ?? { plays: 0 };
        const next: GameBest = { ...prev, plays: prev.plays + 1 };
        let newBest = false;
        if (r.won || r.game === 'maths') {
          if (r.score != null && (prev.bestScore == null || r.score > prev.bestScore)) {
            next.bestScore = r.score;
            newBest = prev.bestScore != null || r.score > 0;
          }
          if (r.won && r.moves != null && (prev.bestMoves == null || r.moves < prev.bestMoves)) {
            next.bestMoves = r.moves;
            newBest = true;
          }
          if (r.won && r.game !== 'maths' && r.game !== 'breathe' && (prev.bestSeconds == null || r.seconds < prev.bestSeconds)) {
            next.bestSeconds = r.seconds;
            newBest = true;
          }
        }
        set((s) => ({
          records: [{ ...r, id, date: todayKey() }, ...s.records].slice(0, 400),
          best: { ...s.best, [key]: next },
        }));
        return { id, newBest: newBest && prev.plays > 0 };
      },

      setFeel: (id, feel) =>
        set((s) => ({ records: s.records.map((x) => (x.id === id ? { ...x, feelAfter: feel } : x)) })),

      reset: () => set({ records: [], best: {} }),
    }),
    {
      name: 'shesync.games',
      version: 1,
      storage: deviceStorage(),
      partialize: (s) => ({ records: s.records, best: s.best }),
    }
  )
);
