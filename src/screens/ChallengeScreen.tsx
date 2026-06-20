import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import ScoreGraph from '../components/ScoreGraph';
import Confetti from '../components/Confetti';
import { Settings, Note, Clef, samePitch, nextRound, pianoRange } from '../music';
import { useNotePlayback } from '../useNotePlayback';
import { useT } from '../i18n';
import { MAX_CONTENT_WIDTH, PHONE_CONTENT_WIDTH } from '../layout';
import { useTheme } from '../theme';
import {
  BestScore,
  ChallengeData,
  HISTORY_LIMIT,
  loadChallenge,
  saveChallenge,
  runScore,
} from '../storage';

interface Props {
  settings: Settings;
}

type Phase = 'ready' | 'playing' | 'results';
type RoundState = { id: number; clef: Clef; note: Note };

const TURN_SECONDS = 60;
const FLASH_MS = 350;

function accuracy(s: BestScore): number {
  return s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
}

// Higher score (correct weighted by accuracy) wins; raw correct count breaks ties.
function beats(run: BestScore, best: BestScore | null): boolean {
  if (!best) return run.total > 0;
  const runPts = runScore(run);
  const bestPts = runScore(best);
  return runPts > bestPts || (runPts === bestPts && run.correct > best.correct);
}


export default function ChallengeScreen({ settings }: Props) {
  const t = useT();
  const theme = useTheme();
  const c = theme.colors;
  const challengeColors = theme.homeButtons.challenge;
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const [phase, setPhase] = useState<Phase>('ready');
  const [data, setData] = useState<ChallengeData>({ best: {}, history: {} });
  const [prevBest, setPrevBest] = useState<BestScore | null>(null);
  const [result, setResult] = useState<BestScore | null>(null);
  const [isRecord, setIsRecord] = useState(false);

  // All-time best and last-30 history for the currently-selected difficulty.
  const best = data.best[settings.difficulty] ?? null;
  const runs = data.history[settings.difficulty] ?? [];

  const roundSeq = useRef(0);
  function makeRound(): RoundState {
    roundSeq.current += 1;
    return { id: roundSeq.current, ...nextRound(settings) };
  }

  const [round, setRound] = useState<RoundState>(() => makeRound());
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);

  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const endTimeRef = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadChallenge().then(setData);
  }, []);

  const endTurn = useCallback(() => {
    const run: BestScore = { correct: correctRef.current, total: totalRef.current };
    const diff = settings.difficulty;
    const prev = data.best[diff] ?? null;
    const record = beats(run, prev);
    const nextBest = record ? run : prev;
    const nextList = [...(data.history[diff] ?? []), run].slice(-HISTORY_LIMIT);
    const next: ChallengeData = {
      best: nextBest ? { ...data.best, [diff]: nextBest } : data.best,
      history: { ...data.history, [diff]: nextList },
    };
    setData(next);
    saveChallenge(next);
    setPrevBest(prev);
    setResult(run);
    setIsRecord(record);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setPhase('results');
  }, [data, settings.difficulty]);

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

  useNotePlayback(
    round.note,
    phase === 'playing' && settings.sound,
    round.id,
    true
  );

  function startTurn() {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    correctRef.current = 0;
    totalRef.current = 0;
    setRound(makeRound());
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
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setFeedback(null);
      setLocked(false);
      setRound(makeRound());
    }, FLASH_MS);
  }

  // --- views ---

  if (phase === 'ready') {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <Text style={styles.icon}>{'🎯'}</Text>
        <Text style={[styles.bestLine, { color: c.text }]}>
          {best
            ? t('challenge.best', {
                level: t(`difficulty.${settings.difficulty}`),
                score: runScore(best),
                correct: best.correct,
                accuracy: accuracy(best),
              })
            : t('challenge.noRecord', {
                level: t(`difficulty.${settings.difficulty}`),
              })}
        </Text>
        <Text style={[styles.note, { color: c.textMuted }]}>
          {t('challenge.intro', { s: TURN_SECONDS })}
        </Text>
        <Pressable
          onPress={startTurn}
          style={[
            styles.primaryBtn,
            { backgroundColor: challengeColors.background },
          ]}
        >
          <Text style={[styles.primaryBtnText, { color: challengeColors.title }]}>
            {t('challenge.start')}
          </Text>
        </Pressable>
        <Text style={[styles.difficultyHint, { color: c.textSubtle }]}>
          {t('challenge.difficultyHint')}
        </Text>
      </View>
    );
  }

  if (phase === 'results' && result) {
    // Confetti only when beating a previous best — not the very first record.
    const beatHighscore = isRecord && prevBest != null;
    return (
      <View style={[styles.resultsRoot, { backgroundColor: c.background }]}>
        <ScrollView contentContainerStyle={styles.centeredScroll}>
          {isRecord && (
            <Text style={[styles.recordBanner, { color: challengeColors.title }]}>
              {t('challenge.newRecord')}
            </Text>
          )}
        <View style={[styles.resultCard, { backgroundColor: c.surface }]}>
          <Text style={[styles.resultTitle, { color: c.textMuted }]}>
            {t('challenge.thisRun')}
          </Text>
          <Text style={[styles.scoreValue, { color: challengeColors.title }]}>
            {runScore(result)}
          </Text>
          <Text style={[styles.scoreLabel, { color: c.textMuted }]}>
            {t('battle.score')}
          </Text>
          <View style={styles.resultStats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: challengeColors.title }]}>
                {result.correct}
              </Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {t('battle.notesCorrect')}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: challengeColors.title }]}>
                {accuracy(result)}%
              </Text>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>
                {t('battle.accuracy')}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.prevBest, { color: c.textMuted }]}>
          {t('challenge.previousBest')}:{' '}
          {prevBest
            ? `${runScore(prevBest)} · ${prevBest.correct} · ${accuracy(prevBest)}%`
            : t('challenge.none')}
        </Text>

        <View style={styles.graphBlock}>
          <Text style={[styles.graphCaption, { color: c.textMuted }]}>
            {t('challenge.history', { n: runs.length })}
          </Text>
          <ScoreGraph
            scores={runs.map(runScore)}
            width={Math.min(width - 56, 360)}
            color={theme.dark ? c.primary : '#e0935a'}
          />
        </View>

          <Pressable
            onPress={() => setPhase('ready')}
            style={[
              styles.primaryBtn,
              { backgroundColor: challengeColors.background },
            ]}
          >
            <Text style={[styles.primaryBtnText, { color: challengeColors.title }]}>
              {t('battle.playAgain')}
            </Text>
          </Pressable>
        </ScrollView>
        {beatHighscore && <Confetti />}
      </View>
    );
  }

  // phase === 'playing'
  const staffWidth = Math.max(Math.min(width, PHONE_CONTENT_WIDTH) - 64, 220);
  const lineGap = landscape ? 9 : 14;
  const keyHeight = Math.max(96, Math.min(180, Math.round(height * 0.32)));

  return (
    <View style={[styles.playRoot, { backgroundColor: c.background }]}>
      <View style={styles.headerWrap}>
        <View style={styles.playHeader}>
          <Text style={[styles.playLabel, { color: challengeColors.title }]}>
            {t('title.challenge')}
          </Text>
          <Text
            style={[
              styles.timer,
              { color: c.text },
              timeLeft <= 10 && { color: c.danger },
            ]}
          >
            {timeLeft}s
          </Text>
        </View>
      </View>

      <View style={styles.topArea}>
        <View style={styles.noteBlock}>
          <Text style={[styles.clefLabel, { color: c.textMuted }]}>
            {t(round.clef === 'treble' ? 'clef.trebleFull' : 'clef.bassFull')}
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: c.staffCard, shadowColor: c.shadow },
            ]}
          >
            <Staff
              clef={round.clef}
              note={round.note}
              width={staffWidth}
              lineGap={lineGap}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  resultsRoot: {
    flex: 1,
  },
  centeredScroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
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
    color: '#c2691c',
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
  scoreValue: {
    fontSize: 52,
    fontWeight: '800',
    color: '#c2691c',
    lineHeight: 56,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 16,
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
    color: '#c2691c',
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
  graphBlock: {
    marginTop: 22,
    alignItems: 'center',
  },
  graphCaption: {
    fontSize: 13,
    color: '#8e8e93',
    marginBottom: 6,
  },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: '#ffd8b0',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7a3e0a',
  },
  playRoot: {
    flex: 1,
    paddingVertical: 8,
  },
  headerWrap: {
    width: '100%',
    alignItems: 'center',
  },
  topArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  noteBlock: {
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: PHONE_CONTENT_WIDTH,
  },
  playHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: PHONE_CONTENT_WIDTH,
    paddingHorizontal: 16,
  },
  playLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c2691c',
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
