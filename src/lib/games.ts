// ============================================================
// Mind Games — pure game logic (no React, no imports), so every
// generator and rule can be unit-tested in isolation.
// ============================================================

export type Rng = () => number;
const defaultRng: Rng = Math.random;

export function shuffle<T>(items: T[], rng: Rng = defaultRng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Memory match ───────────────────────────────────────────
export const MEMORY_SYMBOLS = ['🌸', '🌙', '⭐', '🍓', '🦋', '🌈', '🍀', '🐚', '🌻', '🍑'];

export interface MemoryCard {
  id: number;
  symbol: string;
  matched: boolean;
}

export function createMemoryDeck(pairs: number, rng: Rng = defaultRng): MemoryCard[] {
  const symbols = shuffle(MEMORY_SYMBOLS, rng).slice(0, pairs);
  return shuffle(
    symbols.flatMap((symbol) => [symbol, symbol]),
    rng
  ).map((symbol, id) => ({ id, symbol, matched: false }));
}

// ─── Quick maths ────────────────────────────────────────────
export interface MathsQuestion {
  text: string;
  answer: number;
  options: number[];
}

const randInt = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1));

export function makeMathsQuestion(level: 1 | 2 | 3, rng: Rng = defaultRng): MathsQuestion {
  let text = '';
  let answer = 0;
  const kind = level === 1 ? randInt(0, 1, rng) : level === 2 ? randInt(0, 2, rng) : randInt(0, 4, rng);
  if (kind === 0) {
    const max = level === 1 ? 20 : level === 2 ? 99 : 199;
    const a = randInt(2, max, rng);
    const b = randInt(2, max, rng);
    text = `${a} + ${b}`;
    answer = a + b;
  } else if (kind === 1) {
    const max = level === 1 ? 20 : level === 2 ? 99 : 199;
    const a = randInt(5, max, rng);
    const b = randInt(1, a, rng);
    text = `${a} − ${b}`;
    answer = a - b;
  } else if (kind === 2) {
    const a = randInt(2, level === 3 ? 15 : 10, rng);
    const b = randInt(2, 10, rng);
    text = `${a} × ${b}`;
    answer = a * b;
  } else if (kind === 3) {
    const b = randInt(2, 12, rng);
    const q = randInt(2, 12, rng);
    text = `${b * q} ÷ ${b}`;
    answer = q;
  } else {
    const a = randInt(2, 12, rng);
    const b = randInt(2, 9, rng);
    const c = randInt(1, a * b - 1, rng);
    text = `${a} × ${b} − ${c}`;
    answer = a * b - c;
  }
  const options = new Set<number>([answer]);
  const spread = Math.max(3, Math.round(Math.abs(answer) * 0.15));
  let guard = 0;
  while (options.size < 4 && guard < 100) {
    guard++;
    const delta = randInt(1, spread, rng) * (rng() < 0.5 ? -1 : 1);
    const candidate = answer + (rng() < 0.3 ? (rng() < 0.5 ? 10 : -10) : delta);
    if (candidate >= 0) options.add(candidate);
  }
  for (let k = 1; options.size < 4; k++) options.add(answer + k);
  return { text, answer, options: shuffle([...options], rng) };
}

// ─── Sliding puzzle ─────────────────────────────────────────
/** Tiles 1..n²-1 with 0 as the gap, solved = [1, 2, …, 0]. */
export function solvedTiles(size: number): number[] {
  return [...Array.from({ length: size * size - 1 }, (_, i) => i + 1), 0];
}

export function slideNeighbors(index: number, size: number): number[] {
  const r = Math.floor(index / size);
  const c = index % size;
  const out: number[] = [];
  if (r > 0) out.push(index - size);
  if (r < size - 1) out.push(index + size);
  if (c > 0) out.push(index - 1);
  if (c < size - 1) out.push(index + 1);
  return out;
}

/** Shuffles by making random legal moves from the solved state, so it is always solvable. */
export function createSlidePuzzle(size: number, moves = 80, rng: Rng = defaultRng): number[] {
  let tiles = solvedTiles(size);
  let gap = tiles.length - 1;
  let prev = -1;
  for (let i = 0; i < moves; i++) {
    const options = slideNeighbors(gap, size).filter((n) => n !== prev);
    const pick = options[Math.floor(rng() * options.length)];
    tiles = [...tiles];
    [tiles[gap], tiles[pick]] = [tiles[pick], tiles[gap]];
    prev = gap;
    gap = pick;
  }
  if (isSlideSolved(tiles)) return createSlidePuzzle(size, moves + 10, rng);
  return tiles;
}

export function trySlide(tiles: number[], index: number, size: number): number[] | null {
  const gap = tiles.indexOf(0);
  if (!slideNeighbors(gap, size).includes(index)) return null;
  const next = [...tiles];
  [next[gap], next[index]] = [next[index], next[gap]];
  return next;
}

export function isSlideSolved(tiles: number[]): boolean {
  return tiles.every((t, i) => (i === tiles.length - 1 ? t === 0 : t === i + 1));
}

// ─── Mini sudoku (4×4 with 2×2 boxes, 6×6 with 2×3 boxes) ───
export interface SudokuSpec {
  size: 4 | 6;
  boxRows: number;
  boxCols: number;
}

export const SUDOKU_SPECS: Record<'easy' | 'hard', SudokuSpec> = {
  easy: { size: 4, boxRows: 2, boxCols: 2 },
  hard: { size: 6, boxRows: 2, boxCols: 3 },
};

export function sudokuCanPlace(grid: number[], idx: number, value: number, spec: SudokuSpec): boolean {
  const { size, boxRows, boxCols } = spec;
  const r = Math.floor(idx / size);
  const c = idx % size;
  for (let k = 0; k < size; k++) {
    if (k !== c && grid[r * size + k] === value) return false;
    if (k !== r && grid[k * size + c] === value) return false;
  }
  const br = Math.floor(r / boxRows) * boxRows;
  const bc = Math.floor(c / boxCols) * boxCols;
  for (let i = br; i < br + boxRows; i++) {
    for (let j = bc; j < bc + boxCols; j++) {
      const k = i * size + j;
      if (k !== idx && grid[k] === value) return false;
    }
  }
  return true;
}

function fillGrid(grid: number[], spec: SudokuSpec, rng: Rng): boolean {
  const idx = grid.indexOf(0);
  if (idx === -1) return true;
  for (const v of shuffle(
    Array.from({ length: spec.size }, (_, i) => i + 1),
    rng
  )) {
    if (sudokuCanPlace(grid, idx, v, spec)) {
      grid[idx] = v;
      if (fillGrid(grid, spec, rng)) return true;
      grid[idx] = 0;
    }
  }
  return false;
}

export function countSudokuSolutions(grid: number[], spec: SudokuSpec, limit = 2): number {
  const idx = grid.indexOf(0);
  if (idx === -1) return 1;
  let count = 0;
  for (let v = 1; v <= spec.size && count < limit; v++) {
    if (sudokuCanPlace(grid, idx, v, spec)) {
      grid[idx] = v;
      count += countSudokuSolutions(grid, spec, limit - count);
      grid[idx] = 0;
    }
  }
  return count;
}

export interface SudokuPuzzle {
  puzzle: number[]; // 0 = empty
  solution: number[];
}

/** Random puzzle with exactly one solution. */
export function createSudoku(spec: SudokuSpec, rng: Rng = defaultRng): SudokuPuzzle {
  const solution = new Array(spec.size * spec.size).fill(0);
  fillGrid(solution, spec, rng);
  const puzzle = [...solution];
  const minGivens = spec.size === 4 ? 6 : 14;
  for (const idx of shuffle(
    Array.from({ length: puzzle.length }, (_, i) => i),
    rng
  )) {
    if (puzzle.filter((v) => v !== 0).length <= minGivens) break;
    const keep = puzzle[idx];
    puzzle[idx] = 0;
    if (countSudokuSolutions([...puzzle], spec) !== 1) puzzle[idx] = keep;
  }
  return { puzzle, solution };
}

export function sudokuConflicts(grid: number[], spec: SudokuSpec): Set<number> {
  const bad = new Set<number>();
  grid.forEach((v, i) => {
    if (v !== 0 && !sudokuCanPlace(grid, i, v, spec)) bad.add(i);
  });
  return bad;
}

export function isSudokuSolved(grid: number[], spec: SudokuSpec): boolean {
  return grid.every((v) => v !== 0) && sudokuConflicts(grid, spec).size === 0;
}

// ─── Focus grid (Schulte table) ─────────────────────────────
export function createSchulte(n: number, rng: Rng = defaultRng): number[] {
  return shuffle(
    Array.from({ length: n * n }, (_, i) => i + 1),
    rng
  );
}

// ─── Breathing patterns ─────────────────────────────────────
export interface BreathStep {
  label: 'Breathe in' | 'Hold' | 'Breathe out';
  seconds: number;
  /** Target circle scale at the end of this step. */
  scale: number;
}

export const BREATH_PATTERNS: Record<string, { name: string; hint: string; steps: BreathStep[] }> = {
  box: {
    name: 'Box 4-4-4-4',
    hint: 'Steady and focusing — good before an exam',
    steps: [
      { label: 'Breathe in', seconds: 4, scale: 1 },
      { label: 'Hold', seconds: 4, scale: 1 },
      { label: 'Breathe out', seconds: 4, scale: 0.55 },
      { label: 'Hold', seconds: 4, scale: 0.55 },
    ],
  },
  relax: {
    name: 'Relax 4-7-8',
    hint: 'Long exhale to calm down and fall asleep',
    steps: [
      { label: 'Breathe in', seconds: 4, scale: 1 },
      { label: 'Hold', seconds: 7, scale: 1 },
      { label: 'Breathe out', seconds: 8, scale: 0.55 },
    ],
  },
  coherent: {
    name: 'Even 5-5',
    hint: 'Gentle and easy — any time you feel tense',
    steps: [
      { label: 'Breathe in', seconds: 5, scale: 1 },
      { label: 'Breathe out', seconds: 5, scale: 0.55 },
    ],
  },
};
