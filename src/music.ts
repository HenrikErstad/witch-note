// Core music-theory model for the note trainer.
// Notes carry a letter, an octave, and an optional accidental (sharp/flat).
// The letter+octave fix the position on the staff; the accidental adds a glyph
// and shifts the sounding pitch (and which piano key it maps to).

import type { LangSetting } from './i18n';

export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Clef = 'treble' | 'bass';
export type Accidental = 'natural' | 'sharp' | 'flat';

export const LETTERS: Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Scale degree of each natural note within an octave (C = 0 ... B = 6).
const DEGREE: Record<Letter, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

// Semitone offset of each natural within an octave (C = 0 ... B = 11).
const SEMITONE: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// White keys that have a black key (sharp) immediately above them.
export const SHARP_AFTER: Record<Letter, boolean> = {
  C: true,
  D: true,
  E: false,
  F: true,
  G: true,
  A: true,
  B: false,
};

const ACC_SYMBOL: Record<Accidental, string> = {
  natural: '',
  sharp: String.fromCharCode(0x266f), // music sharp sign
  flat: String.fromCharCode(0x266d), // music flat sign
};

export interface Note {
  letter: Letter;
  octave: number; // scientific pitch notation, e.g. middle C = C4
  accidental?: Accidental; // defaults to natural
}

// Chromatic pitch (MIDI-like): identifies which physical piano key a note is.
// Enharmonics collapse here, e.g. C#4 and Db4 give the same value.
export function semitone(n: Note): number {
  const acc = n.accidental === 'sharp' ? 1 : n.accidental === 'flat' ? -1 : 0;
  return 12 * n.octave + SEMITONE[n.letter] + acc;
}

// Same physical key / sounding pitch (enharmonic-aware).
export function samePitch(a: Note, b: Note): boolean {
  return semitone(a) === semitone(b);
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

// Pitch-class string. With `german`, the B letter follows the German/Norwegian
// convention: B-natural is "H", B-flat is "B", B-sharp is "H#".
function pitchClassCore(
  letter: Letter,
  accidental: Accidental,
  german: boolean
): string {
  if (german && letter === 'B') {
    if (accidental === 'flat') return 'B';
    return `H${ACC_SYMBOL[accidental]}`;
  }
  return `${letter}${ACC_SYMBOL[accidental]}`;
}

// Short display name without the octave, e.g. "C#" (or "H" in German naming).
export function pitchClassName(n: Note, german = false): string {
  return pitchClassCore(n.letter, n.accidental ?? 'natural', german);
}

// Display name including the octave, e.g. "C#4" / "Db5" / "H4".
export function noteName(n: Note, german = false): string {
  return `${pitchClassName(n, german)}${n.octave}`;
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
  sharp: String.fromCharCode(0xe262), // accidentalSharp
  flat: String.fromCharCode(0xe260), // accidentalFlat
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

export type RotationMode = 'portrait' | 'landscape' | 'auto';

// easy = naturals only; intermediate = + standard black-key sharps/flats;
// expert = + enharmonic white-key notes (B#, Cb, E#, Fb).
export type Difficulty = 'easy' | 'intermediate' | 'expert';

export interface Settings {
  treble: boolean;
  bass: boolean;
  // Each clef has its own range, bounded by that clef's ledger scope.
  trebleMin: number;
  trebleMax: number;
  bassMin: number;
  bassMax: number;
  difficulty: Difficulty; // which accidentals to include
  sound: boolean; // play the pitch when a key is tapped
  hardcore: boolean; // hide the note names on the piano keys
  germanNotation: boolean; // name B-natural "H" (German/Norwegian convention)
  rotation: RotationMode; // lock to portrait/landscape, or follow the device
  language: LangSetting; // 'system' follows the device locale
}

export const DEFAULT_SETTINGS: Settings = {
  treble: true,
  bass: false,
  trebleMin: noteIndex({ letter: 'C', octave: 4 }), // middle C
  trebleMax: noteIndex({ letter: 'C', octave: 6 }), // C6
  bassMin: noteIndex({ letter: 'C', octave: 2 }), // C2
  bassMax: noteIndex({ letter: 'C', octave: 4 }), // middle C
  difficulty: 'easy',
  sound: true,
  hardcore: false,
  germanNotation: false,
  rotation: 'auto',
  language: 'system',
};

export function clefRangeBounds(s: Settings, clef: Clef): { min: number; max: number } {
  return clef === 'treble'
    ? { min: s.trebleMin, max: s.trebleMax }
    : { min: s.bassMin, max: s.bassMax };
}

// A clef's effective range: the user's range clamped to the clef's scope.
export function clefRange(s: Settings, clef: Clef): { lo: number; hi: number } {
  const scope = clefScope(clef);
  const { min, max } = clefRangeBounds(s, clef);
  return { lo: Math.max(min, scope.lo), hi: Math.min(max, scope.hi) };
}

// The span of keys the on-screen keyboard must cover: the union of the ranges
// of every enabled clef.
export function pianoRange(s: Settings): { min: number; max: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (const clef of enabledClefs(s)) {
    const r = clefRange(s, clef);
    lo = Math.min(lo, r.lo);
    hi = Math.max(hi, r.hi);
  }
  if (!isFinite(lo)) {
    const scope = clefScope('treble');
    return { min: scope.lo, max: scope.hi };
  }
  return { min: lo, max: hi };
}

export function enabledClefs(s: Settings): Clef[] {
  const clefs: Clef[] = [];
  if (s.treble) clefs.push('treble');
  if (s.bass) clefs.push('bass');
  return clefs;
}

// A clef's note scope: kept within two ledger lines above and below the staff.
// Two ledger lines reach +/- 9 diatonic steps from the middle line (the staff
// spans +/-4, the 1st/2nd ledger lines sit at 6/8, plus the space just beyond).
const LEDGER_SPAN = 9;

export function clefScope(clef: Clef): { lo: number; hi: number } {
  const mid = noteIndex(MIDDLE_LINE_NOTE[clef]);
  return { lo: mid - LEDGER_SPAN, hi: mid + LEDGER_SPAN };
}

// When both clefs are shown, notes from G3 down belong to the bass clef and
// everything above it to the treble clef.
const SPLIT_INDEX = noteIndex({ letter: 'G', octave: 3 });

// The index window a clef should draw notes from for the given settings:
// the clef's own range (already clamped to its ledger scope), and (when both
// clefs are active) the G3 treble/bass split.
function clefWindow(
  s: Settings,
  clef: Clef,
  bothClefs: boolean
): { lo: number; hi: number } {
  const { lo: rangeLo, hi: rangeHi } = clefRange(s, clef);
  let lo = rangeLo;
  let hi = rangeHi;
  if (bothClefs) {
    if (clef === 'bass') hi = Math.min(hi, SPLIT_INDEX);
    else lo = Math.max(lo, SPLIT_INDEX + 1);
  }
  return { lo, hi };
}

// White-key letters that can be spelled as an accidental from a neighbour, with
// the index offset to the white key the note actually sounds (expert only).
const ENHARMONIC_WHITES: {
  letter: Letter;
  accidental: Accidental;
  matchDelta: number;
}[] = [
  { letter: 'B', accidental: 'sharp', matchDelta: +1 }, // B# sounds as C
  { letter: 'C', accidental: 'flat', matchDelta: -1 }, // Cb sounds as B
  { letter: 'E', accidental: 'sharp', matchDelta: +1 }, // E# sounds as F
  { letter: 'F', accidental: 'flat', matchDelta: -1 }, // Fb sounds as E
];

// Candidate notes for a clef window, according to the difficulty:
//  - easy: naturals only
//  - intermediate: + standard black-key sharps/flats
//  - expert: + enharmonic white-key notes (B#, Cb, E#, Fb)
function notesInWindow(
  lo: number,
  hi: number,
  difficulty: Difficulty,
  keyboardMin: number,
  keyboardMax: number
): Note[] {
  const notes: Note[] = [];
  for (let i = lo; i <= hi; i++) notes.push(noteFromIndex(i)); // naturals
  if (difficulty === 'easy') return notes;

  // black-key accidentals (intermediate + expert)
  for (let i = lo; i < hi; i++) {
    const lower = noteFromIndex(i);
    if (!SHARP_AFTER[lower.letter]) continue; // no black key here
    if (randomInt(2) === 0) {
      notes.push({ ...lower, accidental: 'sharp' });
    } else {
      notes.push({ ...noteFromIndex(i + 1), accidental: 'flat' });
    }
  }

  if (difficulty === 'expert') {
    for (let i = lo; i <= hi; i++) {
      const pos = noteFromIndex(i);
      const e = ENHARMONIC_WHITES.find((x) => x.letter === pos.letter);
      if (!e) continue;
      // The key it sounds as must be on the keyboard so it's answerable.
      const matchIndex = i + e.matchDelta;
      if (matchIndex < keyboardMin || matchIndex > keyboardMax) continue;
      notes.push({ letter: pos.letter, octave: pos.octave, accidental: e.accidental });
    }
  }
  return notes;
}

// Generate the next round: a (clef, note) pair respecting each clef's ledger
// scope and the treble/bass split when both clefs are active.
export function nextRound(s: Settings): { clef: Clef; note: Note } {
  const clefs = enabledClefs(s);
  const bothClefs = clefs.length === 2;
  const kb = pianoRange(s);

  const candidates: { clef: Clef; note: Note }[] = [];
  for (const clef of clefs) {
    const { lo, hi } = clefWindow(s, clef, bothClefs);
    if (lo > hi) continue;
    for (const note of notesInWindow(lo, hi, s.difficulty, kb.min, kb.max)) {
      candidates.push({ clef, note });
    }
  }

  if (candidates.length === 0) {
    // Range doesn't intersect any clef's scope — clamp to the first clef.
    const clef = clefs[0] ?? 'treble';
    const r = clefRange(s, clef);
    const idx = r.lo <= r.hi ? r.lo : clefScope(clef).lo;
    return { clef, note: noteFromIndex(idx) };
  }

  return candidates[randomInt(candidates.length)];
}
