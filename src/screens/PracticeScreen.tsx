import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Staff from '../components/Staff';
import Piano, { Feedback } from '../components/Piano';
import {
  Settings,
  Note,
  Clef,
  CLEF_NAME,
  noteEquals,
  noteLabel,
  nextRound,
} from '../music';

interface Props {
  settings: Settings;
}

export default function PracticeScreen({ settings }: Props) {
  const { width } = useWindowDimensions();
  const [round, setRound] = useState<{ clef: Clef; note: Note }>(() =>
    nextRound(settings)
  );
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-roll whenever the settings change (clefs toggled / range adjusted).
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    setFeedback(null);
    setRound(nextRound(settings));
  }, [settings]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const locked = feedback?.kind === 'correct';

  function handlePress(note: Note) {
    if (locked) return;
    if (noteEquals(note, round.note)) {
      setFeedback({ note, kind: 'correct' });
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      timer.current = setTimeout(() => {
        setFeedback(null);
        setRound(nextRound(settings));
      }, 850);
    } else {
      setFeedback({ note, kind: 'wrong' });
      setStreak(0);
      timer.current = setTimeout(() => setFeedback(null), 650);
    }
  }

  const staffWidth = Math.max(width - 64, 220);

  let banner = 'Which note is this?';
  let bannerColor = '#8e8e93';
  if (feedback?.kind === 'correct') {
    banner = `Correct — ${noteLabel(round.note)}`;
    bannerColor = '#34c759';
  } else if (feedback?.kind === 'wrong') {
    banner = `That's ${feedback.note.letter} — try again`;
    bannerColor = '#ff3b30';
  }

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.clefLabel}>{CLEF_NAME[round.clef]} clef</Text>

        <View style={styles.card}>
          <Staff clef={round.clef} note={round.note} width={staffWidth} />
        </View>

        <Text style={[styles.banner, { color: bannerColor }]}>{banner}</Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <Text style={styles.scoreText}>Streak: {streak}</Text>
        </View>
      </View>

      <View style={styles.pianoWrap}>
        <Piano
          minIndex={settings.minIndex}
          maxIndex={settings.maxIndex}
          onPressKey={handlePress}
          feedback={feedback}
          disabled={locked}
          showLabels
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  clefLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  banner: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    height: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 12,
  },
  scoreText: {
    fontSize: 15,
    color: '#3a3a3c',
    fontWeight: '500',
  },
  pianoWrap: {
    paddingBottom: 24,
  },
});
