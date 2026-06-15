import React from 'react';
import Svg, { Line, Ellipse, G, Text as SvgText } from 'react-native-svg';
import {
  Clef,
  Note,
  GLYPH,
  MIDDLE_LINE_NOTE,
  noteIndex,
} from '../music';
import { useTheme } from '../theme';

interface Props {
  clef: Clef;
  note: Note;
  width: number;
  lineGap?: number; // distance between adjacent staff lines (one staff space)
}

export default function Staff({ clef, note, width, lineGap = 14 }: Props) {
  const theme = useTheme();
  const ink = theme.colors.staffInk;
  const LINE_GAP = lineGap;
  const HEIGHT = LINE_GAP * 15; // room for the staff plus ledger lines / clef overflow
  const MIDDLE_LINE_Y = HEIGHT / 2;

  // Pixel y for a note, given its diatonic step offset from the clef's middle line.
  const yForOffset = (offset: number) => MIDDLE_LINE_Y - offset * (LINE_GAP / 2);

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

  // Accidental glyph (sharp/flat) sits just left of the notehead, vertically
  // centred on it (SMuFL accidentals are registered on the baseline centre).
  const accidental = note.accidental ?? 'natural';
  const accGlyph =
    accidental === 'sharp'
      ? GLYPH.sharp
      : accidental === 'flat'
        ? GLYPH.flat
        : null;

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
          stroke={ink}
          strokeWidth={1.4}
        />
      ))}

      {/* clef */}
      <SvgText
        x={18}
        y={clefBaselineY}
        fill={ink}
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
          stroke={ink}
          strokeWidth={1.6}
        />
      ))}

      {/* accidental (sharp / flat) */}
      {accGlyph && (
        <SvgText
          x={noteX - noteRx - LINE_GAP * 0.5}
          y={noteY}
          fill={ink}
          fontSize={4 * LINE_GAP}
          fontFamily="Bravura"
          textAnchor="end"
        >
          {accGlyph}
        </SvgText>
      )}

      {/* notehead (slightly tilted oval) */}
      <G transform={`rotate(-18 ${noteX} ${noteY})`}>
        <Ellipse cx={noteX} cy={noteY} rx={noteRx} ry={noteRy} fill={ink} />
      </G>
    </Svg>
  );
}
