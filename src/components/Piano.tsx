import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Note,
  noteFromIndex,
  samePitch,
  pitchClassName,
  SHARP_AFTER,
} from '../music';

export type Feedback = { note: Note; kind: 'correct' | 'wrong' } | null;

interface Props {
  minIndex: number;
  maxIndex: number;
  onPressKey: (note: Note) => void;
  feedback: Feedback;
  disabled: boolean;
  showLabels: boolean;
  blackKeysActive: boolean; // are black keys part of the quiz?
  enharmonicWhites?: boolean; // also label white keys with B#/Cb/E#/Fb
  accidentalStyle?: 'sharp' | 'flat'; // how to spell/label black keys
  german?: boolean; // name B-natural "H" (German/Norwegian)
  keyHeight?: number;
}

const WHITE_W = 48;
const BLACK_W = WHITE_W * 0.62;

const CORRECT = '#34c759';
const WRONG = '#ff3b30';

// White keys reachable by an accidental from an adjacent white key (the B-C and
// E-F semitone pairs) get an enharmonic name in the matching sharp/flat mode.
function whiteEnharmonic(
  letter: Note['letter'],
  style: 'sharp' | 'flat',
  german: boolean
): string | null {
  if (style === 'sharp') {
    if (letter === 'C') return pitchClassName({ letter: 'B', octave: 0, accidental: 'sharp' }, german);
    if (letter === 'F') return pitchClassName({ letter: 'E', octave: 0, accidental: 'sharp' }, german);
  } else {
    if (letter === 'E') return pitchClassName({ letter: 'F', octave: 0, accidental: 'flat' }, german);
    if (letter === 'B') return pitchClassName({ letter: 'C', octave: 0, accidental: 'flat' }, german);
  }
  return null;
}

export default function Piano({
  minIndex,
  maxIndex,
  onPressKey,
  feedback,
  disabled,
  showLabels,
  blackKeysActive,
  enharmonicWhites = false,
  accidentalStyle = 'sharp',
  german = false,
  keyHeight = 180,
}: Props) {
  const whites: Note[] = [];
  for (let i = minIndex; i <= maxIndex; i++) whites.push(noteFromIndex(i));

  const totalWidth = whites.length * WHITE_W;
  const whiteH = keyHeight;
  const blackH = keyHeight * 0.62;

  const fbKind = (key: Note) =>
    feedback && samePitch(feedback.note, key) ? feedback.kind : null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.board, { width: totalWidth, height: whiteH }]}>
        {/* white keys */}
        {whites.map((note, idx) => {
          const fb = fbKind(note);
          const bg =
            fb === 'correct' ? CORRECT : fb === 'wrong' ? WRONG : '#ffffff';
          const labelColor = fb ? '#ffffff' : '#3a3a3c';
          const enh = enharmonicWhites
            ? whiteEnharmonic(note.letter, accidentalStyle, german)
            : null;
          const letterText = german && note.letter === 'B' ? 'H' : note.letter;
          return (
            <Pressable
              key={`w${idx}`}
              disabled={disabled}
              onPress={() => onPressKey(note)}
              style={[styles.whiteKey, { backgroundColor: bg, height: whiteH }]}
            >
              {showLabels && (
                <View style={styles.whiteLabelWrap}>
                  <Text style={[styles.whiteLabel, { color: labelColor }]}>
                    {letterText}
                    <Text style={styles.octave}>{note.octave}</Text>
                  </Text>
                  {enh && (
                    <Text
                      style={[
                        styles.enharmonic,
                        { color: fb ? '#ffffff' : '#8e8e93' },
                      ]}
                    >
                      {enh}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}

        {/* black keys (sharps) — tappable when accidentals are enabled */}
        {whites.map((note, idx) => {
          if (idx === whites.length - 1 || !SHARP_AFTER[note.letter]) {
            return null;
          }
          // Spell the black key as a sharp of the lower white or a flat of the
          // upper white, matching the accidental currently in play.
          const blackNote: Note =
            accidentalStyle === 'flat'
              ? { ...whites[idx + 1], accidental: 'flat' }
              : { ...note, accidental: 'sharp' };
          const fb = fbKind(blackNote);
          const bg =
            fb === 'correct' ? CORRECT : fb === 'wrong' ? WRONG : '#1c1c1e';
          const left = (idx + 1) * WHITE_W - BLACK_W / 2;
          return (
            <Pressable
              key={`b${idx}`}
              disabled={disabled || !blackKeysActive}
              onPress={() => onPressKey(blackNote)}
              style={[
                styles.blackKey,
                { left, height: blackH, backgroundColor: bg },
              ]}
            >
              {showLabels && blackKeysActive && (
                <Text style={styles.blackLabel}>
                  {pitchClassName(blackNote, german)}
                  <Text style={styles.blackOctave}>{blackNote.octave}</Text>
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 8,
    flexGrow: 1,
    justifyContent: 'center',
  },
  board: {
    flexDirection: 'row',
    position: 'relative',
  },
  whiteKey: {
    width: WHITE_W,
    borderWidth: 1,
    borderColor: '#c7c7cc',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  whiteLabelWrap: {
    alignItems: 'center',
  },
  whiteLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  enharmonic: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  octave: {
    fontSize: 11,
    fontWeight: '400',
  },
  blackKey: {
    position: 'absolute',
    top: 0,
    width: BLACK_W,
    backgroundColor: '#1c1c1e',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  blackLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  blackOctave: {
    fontSize: 9,
    fontWeight: '400',
    color: '#ffffff',
  },
});
