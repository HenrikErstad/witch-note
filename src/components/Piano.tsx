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
  keyHeight?: number;
}

const WHITE_W = 48;
const BLACK_W = WHITE_W * 0.62;

const CORRECT = '#34c759';
const WRONG = '#ff3b30';

export default function Piano({
  minIndex,
  maxIndex,
  onPressKey,
  feedback,
  disabled,
  showLabels,
  blackKeysActive,
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
          return (
            <Pressable
              key={`w${idx}`}
              disabled={disabled}
              onPress={() => onPressKey(note)}
              style={[styles.whiteKey, { backgroundColor: bg, height: whiteH }]}
            >
              {showLabels && (
                <Text style={[styles.whiteLabel, { color: labelColor }]}>
                  {note.letter}
                  <Text style={styles.octave}>{note.octave}</Text>
                </Text>
              )}
            </Pressable>
          );
        })}

        {/* black keys (sharps) — tappable when accidentals are enabled */}
        {whites.map((note, idx) => {
          if (idx === whites.length - 1 || !SHARP_AFTER[note.letter]) {
            return null;
          }
          const blackNote: Note = { ...note, accidental: 'sharp' };
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
                  {pitchClassName(blackNote)}
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
  whiteLabel: {
    fontSize: 18,
    fontWeight: '600',
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
