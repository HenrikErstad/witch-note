import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Staff from '../components/Staff';
import Piano, { Feedback } from '../components/Piano';
import { Settings, Note, Clef, samePitch, semitone, nextRound, pianoRange } from '../music';
import { playSemitone } from '../sound';
import { useT } from '../i18n';
import { BestScore, BestByDifficulty, loadBests, saveBests } from '../storage';

interface Props {
  settings: Settings;
}

type Phase = 'ready' | 'playing' | 'results';

const TURN_SECONDS = 60;
const FLASH_MS = 350;

function accuracy(s: BestScore): number {
  return s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
}

// Higher correct count wins; accuracy breaks ties.
function beats(run: BestScore, best: BestScore | null): boolean {
  if (!best) return run.total > 0;
  return (
    run.correct > best.correct ||
    (run.correct === best.correct && accuracy(run) > accuracy(best))
  );
}

export default function ChallengeScreen({ settings }: Props) {
  const t = useT();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const [phase, setPhase] = useState<Phase>('ready');
  const [bests, setBests] = useState<BestByDifficulty>({});
  const [prevBest, setPrevBest] = useState<BestScore | null>(null);
  const [result, setResult] = useState<BestScore | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  // Best score for the currently-selected difficulty.
  const best = bests[settings.difficulty] ?? null;

  const [round, setRound] = useState<{ clef: Clef; note: Note }>(() =>
    nextRound(settings)
  );
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);

  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const endTimeRef = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadBests().then(setBests);
  }, []);

  const endTurn = useCallback(() => {
    const run: BestScore = { correct: correctRef.current, total: totalRef.current };
    setResult(run);
    setPrevBest(best);
    const record = beats(run, best);
    setIsRecord(record);
    if (record) {
      const next: BestByDifficulty = { ...bests, [settings.difficulty]: run };
      setBests(next);
      saveBests(next);
    }
    setPhase('results');
  }, [best, bests, settings.difficulty]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        endTurn();
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase, endTurn]);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  // Play the note's pitch when it appears, if sound is enabled.
  useEffect(() => {
    if (phase === 'playing' && settings.sound) {
      playSemitone(semitone(round.note));
    }
  }, [round, phase, settings.sound]);

  function startTurn() {
    correctRef.current = 0;
    totalRef.current = 0;
    setRound(nextRound(settings));
    setFeedback(null);
    setLocked(false);
    setTimeLeft(TURN_SECONDS);
    endTimeRef.current = Date.now() + TURN_SECONDS * 1000;
    setPhase('playing');
  }

  function handlePress(note: Note) {
    if (locked || phase !== 'playing') return;
    const ok = samePitch(note, round.note);
    totalRef.current += 1;
    if (ok) correctRef.current += 1;
    setFeedback({ note, kind: ok ? 'correct' : 'wrong' });
    setLocked(true);
    flashTimer.current = setTimeout(() => {
      setFeedback(null);
      setLocked(false);
      setRound(nextRound(settings));
    }, FLASH_MS);
  }

  // --- views ---

  if (phase === 'ready') {
    return (
      <View style={styles.centered}>
        <Text style={styles.icon}>{'🎯'}</Text>
        <Text style={styles.bestLine}>
          {best
            ? t('challenge.best', {
                level: t(`difficulty.${settings.difficulty}`),
                correct: best.correct,
                accuracy: accuracy(best),
              })
            : t('challenge.noRecord', {
                level: t(`difficulty.${settings.difficulty}`),
              })}
        </Text>
        <Text style={styles.note}>{t('challenge.intro', { s: TURN_SECONDS })}</Text>
        <Pressable onPress={startTurn} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>{t('challenge.start')}</Text>
        </Pressable>
        <Text style={styles.difficultyHint}>
          {t('challenge.difficultyHint')}
        </Text>
      </View>
    );
  }

  if (phase === 'results' && result) {
    return (
      <View style={styles.centered}>
        {isRecord && <Text style={styles.recordBanner}>{t('challenge.newRecord')}</Text>}
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{t('challenge.thisRun')}</Text>
          <View style={styles.resultStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{result.correct}</Text>
              <Text style={styles.statLabel}>{t('battle.notesCorrect')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{accuracy(result)}%</Text>
              <Text style={styles.statLabel}>{t('battle.accuracy')}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.prevBest}>
          {t('challenge.previousBest')}:{' '}
          {prevBest
            ? `${prevBest.correct} · ${accuracy(prevBest)}%`
            : t('challenge.none')}
        </Text>
        <Pressable onPress={() => setPhase('ready')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>{t('battle.playAgain')}</Text>
        </Pressable>
      </View>
    );
  }

  // phase === 'playing'
  const staffWidth = Math.max(width - 64, 220);
  const lineGap = landscape ? 9 : 14;
  const keyHeight = Math.max(96, Math.min(180, Math.round(height * 0.32)));

  return (
    <View style={styles.playRoot}>
      <View style={styles.top}>
        <View style={styles.playHeader}>
          <Text style={styles.playLabel}>{t('title.challenge')}</Text>
          <Text style={[styles.timer, timeLeft <= 10 && styles.timerLow]}>
            {timeLeft}s
          </Text>
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  bestLine: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  note: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 21,
  },
  difficultyHint: {
    fontSize: 13,
    color: '#aeaeb2',
    textAlign: 'center',
    marginTop: 20,
  },
  recordBanner: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ff9500',
    marginBottom: 18,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 40,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ff9500',
  },
  statLabel: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  prevBest: {
    fontSize: 15,
    color: '#8e8e93',
    marginTop: 18,
  },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: '#ff9500',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  playRoot: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  top: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  playLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff9500',
  },
  timer: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1c1e',
    fontVariant: ['tabular-nums'],
  },
  timerLow: {
    color: '#ff3b30',
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
  pianoWrap: {
    paddingBottom: 24,
  },
});
