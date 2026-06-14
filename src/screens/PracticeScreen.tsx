import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Staff from '../components/Staff';
import Piano, { Feedback } from '../components/Piano';
import {
  Settings,
  Note,
  Clef,
  samePitch,
  semitone,
  noteName,
  pitchClassName,
  nextRound,
  pianoRange,
} from '../music';
import { playSemitone } from '../sound';
import { useT } from '../i18n';
import { PHONE_CONTENT_WIDTH } from '../layout';

interface Props {
  settings: Settings;
}

export default function PracticeScreen({ settings }: Props) {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const [round, setRound] = useState<{ clef: Clef; note: Note }>(() =>
    nextRound(settings)
  );
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMount = useRef(false);

  // Re-roll whenever the settings change (clefs toggled / range adjusted).
  // Skip the first run: the initial round is already set by useState above,
  // so re-rolling here would replace it and play the note twice.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setFeedback(null);
    setRound(nextRound(settings));
  }, [settings]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Play the note's pitch each time a new note appears.
  useEffect(() => {
    if (settings.sound) playSemitone(semitone(round.note));
  }, [round, settings.sound]);

  const locked = feedback?.kind === 'correct';

  function handlePress(note: Note) {
    if (locked) return;
    if (samePitch(note, round.note)) {
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

  const contentWidth = Math.min(width, PHONE_CONTENT_WIDTH);
  const staffWidth = Math.max(contentWidth - 64, 220);
  // Shrink the staff and keys when vertical space is tight (e.g. landscape).
  const lineGap = landscape ? 9 : 14;
  const keyHeight = Math.max(96, Math.min(180, Math.round(height * 0.32)));

  let banner = t('practice.prompt');
  let bannerColor = '#8e8e93';
  if (feedback?.kind === 'correct') {
    banner = t('practice.correct', {
      note: noteName(round.note, settings.germanNotation),
    });
    bannerColor = '#34c759';
  } else if (feedback?.kind === 'wrong') {
    banner = t('practice.wrong', {
      note: pitchClassName(feedback.note, settings.germanNotation),
    });
    bannerColor = '#ff3b30';
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.root}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topArea}>
      <View style={styles.top}>
        <Text style={styles.clefLabel}>
          {t(round.clef === 'treble' ? 'clef.trebleFull' : 'clef.bassFull')}
        </Text>

        <View style={styles.card}>
          <Staff
            clef={round.clef}
            note={round.note}
            width={staffWidth}
            lineGap={lineGap}
          />
        </View>

        <Text style={[styles.banner, { color: bannerColor }]}>{banner}</Text>

        {settings.sound && (
          <Pressable
            onPress={() => playSemitone(semitone(round.note))}
            style={styles.hearBtn}
            hitSlop={8}
          >
            <Text style={styles.hearBtnText}>{t('practice.hear')}</Text>
          </Pressable>
        )}

        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>{t('practice.score', { n: score })}</Text>
          <Text style={styles.scoreText}>{t('practice.streak', { n: streak })}</Text>
        </View>
      </View>
      </View>

      <View style={styles.pianoWrap}>
        <Piano
          minIndex={pianoRange(settings).min}
          maxIndex={pianoRange(settings).max}
          onPressKey={handlePress}
          feedback={feedback}
          disabled={locked}
          showLabels={!settings.hardcore}
          blackKeysActive={settings.difficulty !== 'easy'}
          enharmonicWhites={settings.difficulty === 'expert'}
          accidentalStyle={round.note.accidental === 'flat' ? 'flat' : 'sharp'}
          german={settings.germanNotation}
          keyHeight={keyHeight}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  root: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  topArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  top: {
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: PHONE_CONTENT_WIDTH,
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
  hearBtn: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
  },
  hearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007aff',
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
