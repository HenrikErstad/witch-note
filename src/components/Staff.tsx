import React from 'react';
import Svg, { Line, Ellipse, G, Text as SvgText } from 'react-native-svg';
import {
  Clef,
  Note,
  GLYPH,
  MIDDLE_LINE_NOTE,
  noteIndex,
} from '../music';

interface Props {
  clef: Clef;
  note: Note;
  width: number;
}

const LINE_GAP = 14; // distance between two adjacent staff lines = one staff space
const HEIGHT = 220;
const MIDDLE_LINE_Y = HEIGHT / 2;
const INK = '#1c1c1e';

// Pixel y for a note, given its diatonic step offset from the clef's middle line.
function yForOffset(offset: number): number {
  return MIDDLE_LINE_Y - offset * (LINE_GAP / 2);
}

export default function Staff({ clef, note, width }: Props) {
  const offset = noteIndex(note) - noteIndex(MIDDLE_LINE_NOTE[clef]);
  const noteX = Math.max(width * 0.58, 160);
  const noteY = yForOffset(offset);

  // The five staff lines (k = -2 .. 2, with 0 = middle line).
  const staffLines = [-2, -1, 0, 1, 2].map((k) => MIDDLE_LINE_Y + k * LINE_GAP);

  // Ledger lines above (offset >= 6) and below (offset <= -6) the staff.
  const ledgers: number[] = [];
  for (let o = 6; o <= offset; o += 2) ledgers.push(yForOffset(o));
  for (let o = -6; o >= offset; o -= 2) ledgers.push(yForOffset(o));

  // SMuFL clef glyph: 1 staff space = 0.25 em, so the em (font size) = 4 spaces.
  const clefFontSize = 4 * LINE_GAP;
  // Glyph baseline sits on a specific staff line.
  const clefBaselineY =
    clef === 'treble' ? MIDDLE_LINE_Y + LINE_GAP : MIDDLE_LINE_Y - LINE_GAP;
  const clefGlyph = clef === 'treble' ? GLYPH.trebleClef : GLYPH.bassClef;

  const noteRx = LINE_GAP * 0.66;
  const noteRy = LINE_GAP * 0.52;
  const ledgerHalf = noteRx + 6;

  return (
    <Svg width={width} height={HEIGHT}>
      {/* staff lines */}
      {staffLines.map((y, i) => (
        <Line
          key={`s${i}`}
          x1={12}
          y1={y}
          x2={width - 12}
          y2={y}
          stroke={INK}
          strokeWidth={1.4}
        />
      ))}

      {/* clef */}
      <SvgText
        x={18}
        y={clefBaselineY}
        fill={INK}
        fontSize={clefFontSize}
        fontFamily="Bravura"
      >
        {clefGlyph}
      </SvgText>

      {/* ledger lines through / around the note */}
      {ledgers.map((y, i) => (
        <Line
          key={`l${i}`}
          x1={noteX - ledgerHalf}
          y1={y}
          x2={noteX + ledgerHalf}
          y2={y}
          stroke={INK}
          strokeWidth={1.6}
        />
      ))}

      {/* notehead (slightly tilted oval) */}
      <G transform={`rotate(-18 ${noteX} ${noteY})`}>
        <Ellipse cx={noteX} cy={noteY} rx={noteRx} ry={noteRy} fill={INK} />
      </G>
    </Svg>
  );
}
