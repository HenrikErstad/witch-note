import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Letter, Note, noteFromIndex, noteEquals } from '../music';

export type Feedback = { note: Note; kind: 'correct' | 'wrong' } | null;

interface Props {
  minIndex: number;
  maxIndex: number;
  onPressKey: (note: Note) => void;
  feedback: Feedback;
  disabled: boolean;
  showLabels: boolean;
}

const WHITE_W = 48;
const WHITE_H = 180;
const BLACK_W = WHITE_W * 0.62;
const BLACK_H = WHITE_H * 0.62;

// White keys that have a black key (sharp) immediately to their right.
const HAS_SHARP_AFTER: Record<Letter, boolean> = {
  C: true,
  D: true,
  E: false,
  F: true,
  G: true,
  A: true,
  B: false,
};

const CORRECT = '#34c759';
const WRONG = '#ff3b30';

export default function Piano({
  minIndex,
  maxIndex,
  onPressKey,
  feedback,
  disabled,
  showLabels,
}: Props) {
  const whites: Note[] = [];
  for (let i = minIndex; i <= maxIndex; i++) whites.push(noteFromIndex(i));

  const totalWidth = whites.length * WHITE_W;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.board, { width: totalWidth }]}>
        {/* white keys */}
        {whites.map((note, idx) => {
          const fb =
            feedback && noteEquals(feedback.note, note) ? feedback.kind : null;
          const bg =
            fb === 'correct' ? CORRECT : fb === 'wrong' ? WRONG : '#ffffff';
          const labelColor = fb ? '#ffffff' : '#3a3a3c';
          return (
            <Pressable
              key={`w${idx}`}
              disabled={disabled}
              onPress={() => onPressKey(note)}
              style={[styles.whiteKey, { backgroundColor: bg }]}
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

        {/* black keys (decorative — quiz uses natural notes only) */}
        {whites.map((note, idx) => {
          if (idx === whites.length - 1 || !HAS_SHARP_AFTER[note.letter]) {
            return null;
          }
          const left = (idx + 1) * WHITE_W - BLACK_W / 2;
          return (
            <View
              key={`b${idx}`}
              pointerEvents="none"
              style={[styles.blackKey, { left }]}
            />
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
    height: WHITE_H,
    flexDirection: 'row',
    position: 'relative',
  },
  whiteKey: {
    width: WHITE_W,
    height: WHITE_H,
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
    height: BLACK_H,
    backgroundColor: '#1c1c1e',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 2,
  },
});
