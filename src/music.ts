// Core music-theory model for the note trainer.
// Notes carry a letter, an octave, and an optional accidental (sharp/flat).
// The letter+octave fix the position on the staff; the accidental adds a glyph
// and shifts the sounding pitch (and which piano key it maps to).

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

// Display name including any accidental, e.g. "C#4" / "Db5".
export function noteName(n: Note): string {
  return `${n.letter}${ACC_SYMBOL[n.accidental ?? 'natural']}${n.octave}`;
}

// Short display name without the octave, e.g. "C#".
export function pitchClassName(n: Note): string {
  return `${n.letter}${ACC_SYMBOL[n.accidental ?? 'natural']}`;
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

export interface Settings {
  treble: boolean;
  bass: boolean;
  minIndex: number; // inclusive, diatonic index of lowest note
  maxIndex: number; // inclusive, diatonic index of highest note
  accidentals: boolean; // include black-key notes (sharps & flats)
  sound: boolean; // play the pitch when a key is tapped
  rotation: RotationMode; // lock to portrait/landscape, or follow the device
}

// Reasonable absolute bounds for the range pickers.
export const RANGE_FLOOR = noteIndex({ letter: 'C', octave: 2 }); // C2
export const RANGE_CEIL = noteIndex({ letter: 'C', octave: 7 }); // C7

export const DEFAULT_SETTINGS: Settings = {
  treble: true,
  bass: false,
  minIndex: noteIndex({ letter: 'C', octave: 4 }), // middle C
  maxIndex: noteIndex({ letter: 'C', octave: 6 }), // C6
  accidentals: false,
  sound: true,
  rotation: 'auto',
};

export function enabledClefs(s: Settings): Clef[] {
  const clefs: Clef[] = [];
  if (s.treble) clefs.push('treble');
  if (s.bass) clefs.push('bass');
  return clefs;
}

// Build the set of candidate target notes that actually appear on the
// on-screen keyboard for the given range: every white key, plus (when enabled)
// every black key with a randomly chosen sharp/flat spelling.
function candidateNotes(s: Settings): Note[] {
  const notes: Note[] = [];
  for (let i = s.minIndex; i <= s.maxIndex; i++) {
    notes.push(noteFromIndex(i)); // natural (white key)
  }
  if (s.accidentals) {
    for (let i = s.minIndex; i < s.maxIndex; i++) {
      const lower = noteFromIndex(i);
      if (!SHARP_AFTER[lower.letter]) continue; // no black key here
      if (randomInt(2) === 0) {
        notes.push({ ...lower, accidental: 'sharp' });
      } else {
        const upper = noteFromIndex(i + 1);
        notes.push({ ...upper, accidental: 'flat' });
      }
    }
  }
  return notes;
}

// Generate the next round: a clef from the enabled set plus a note in range.
export function nextRound(s: Settings): { clef: Clef; note: Note } {
  const clefs = enabledClefs(s);
  const clef = clefs[randomInt(clefs.length)] ?? 'treble';
  const candidates = candidateNotes(s);
  const note = candidates[randomInt(candidates.length)] ?? pickNote(s.minIndex, s.maxIndex);
  return { clef, note };
}
