// Core music-theory model for the note trainer.
// We work with natural (white-key) notes only: C D E F G A B.

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Clef = 'treble' | 'bass';

export const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Scale degree of each natural note within an octave (C = 0 ... B = 6).
const DEGREE: Record<Letter, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

export interface Note {
  letter: Letter;
  octave: number; // scientific pitch notation, e.g. middle C = C4
}

// A "diatonic index": counts natural notes from C0 upward, so every white key
// gets a unique strictly-increasing integer. One step = one line-or-space on a staff.
export function noteIndex(n: Note): number {
  return n.octave * 7 + DEGREE[n.letter];
}

export function noteFromIndex(i: number): Note {
  const octave = Math.floor(i / 7);
  const letter = LETTERS[((i % 7) + 7) % 7];
  return { letter, octave };
}

export function noteId(n: Note): string {
  return `${n.letter}${n.octave}`;
}

export function noteEquals(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.octave === b.octave;
}

export function noteLabel(n: Note): string {
  return `${n.letter}${n.octave}`;
}

// The note that sits on the *middle line* of each clef's staff.
export const MIDDLE_LINE_NOTE: Record<Clef, Note> = {
  treble: { letter: 'B', octave: 4 }, // treble middle line = B4
  bass: { letter: 'D', octave: 3 }, // bass middle line = D3
};

export const CLEF_NAME: Record<Clef, string> = {
  treble: 'Treble',
  bass: 'Bass',
};

// SMuFL codepoints in the Bravura font (built as chars to keep this file ASCII).
export const GLYPH = {
  trebleClef: String.fromCharCode(0xe050), // gClef
  bassClef: String.fromCharCode(0xe062), // fClef
};

// --- random selection ---

export function randomInt(n: number): number {
  return Math.floor(Math.random() * n);
}

export function pickNote(minIndex: number, maxIndex: number): Note {
  const span = maxIndex - minIndex + 1;
  return noteFromIndex(minIndex + randomInt(span));
}

// --- settings ---

export interface Settings {
  treble: boolean;
  bass: boolean;
  minIndex: number; // inclusive, diatonic index of lowest note
  maxIndex: number; // inclusive, diatonic index of highest note
}

// Reasonable absolute bounds for the range pickers.
export const RANGE_FLOOR = noteIndex({ letter: 'C', octave: 2 }); // C2
export const RANGE_CEIL = noteIndex({ letter: 'C', octave: 7 }); // C7

export const DEFAULT_SETTINGS: Settings = {
  treble: true,
  bass: false,
  minIndex: noteIndex({ letter: 'C', octave: 4 }), // middle C
  maxIndex: noteIndex({ letter: 'C', octave: 6 }), // C6
};

export function enabledClefs(s: Settings): Clef[] {
  const clefs: Clef[] = [];
  if (s.treble) clefs.push('treble');
  if (s.bass) clefs.push('bass');
  return clefs;
}

// Generate the next round: a clef from the enabled set plus a note in range.
export function nextRound(s: Settings): { clef: Clef; note: Note } {
  const clefs = enabledClefs(s);
  const clef = clefs[randomInt(clefs.length)] ?? 'treble';
  const note = pickNote(s.minIndex, s.maxIndex);
  return { clef, note };
}
