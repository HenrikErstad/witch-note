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
import {
  Settings,
  Note,
  Clef,
  samePitch,
  nextRound,
  pianoRange,
} from '../music';
import { useNotePlayback } from '../useNotePlayback';
import { useT } from '../i18n';
import { MAX_CONTENT_WIDTH, PHONE_CONTENT_WIDTH } from '../layout';
import { useTheme } from '../theme';
import { runScore } from '../storage';

interface Props {
  settings: Settings;
}

type Phase = 'setup' | 'ready' | 'playing' | 'results';
type Result = { correct: number; total: number };
type RoundState = { id: number; clef: Clef; note: Note };

const TURN_SECONDS = 60;
const FLASH_MS = 350;
const PLAYER_OPTIONS = [2, 3, 4, 5, 6];

export default function BattleScreen({ settings }: Props) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const t = useT();
  const theme = useTheme();
  const c = theme.colors;
  const battleColors = theme.homeButtons.battle;

  const [phase, setPhase] = useState<Phase>('setup');
  const [numPlayers, setNumPlayers] = useState(2);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Result[]>([]);

  // Per-turn state.
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

  const endTurn = useCallback(() => {
    const res: Result = { correct: correctRef.current, total: totalRef.current };
    setResults((prev) => {
      const copy = prev.slice();
      copy[current] = res;
      return copy;
    });
    if (current + 1 < numPlayers) {
      setCurrent(current + 1);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setPhase('ready');
    } else {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setPhase('results');
    }
  }, [current, numPlayers]);

  // Countdown timer while playing.
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

  function startBattle() {
    setResults(
      Array.from({ length: numPlayers }, () => ({ correct: 0, total: 0 }))
    );
    setCurrent(0);
    setPhase('ready');
  }

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

  if (phase === 'setup') {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <Text style={[styles.heading, { color: c.text }]}>
          {t('battle.players')}
        </Text>
        <View style={styles.playerRow}>
          {PLAYER_OPTIONS.map((n) => {
            const active = n === numPlayers;
            return (
              <Pressable
                key={n}
                onPress={() => setNumPlayers(n)}
                style={[
                  styles.playerChip,
                  { backgroundColor: c.surfaceMuted },
                  active && { backgroundColor: battleColors.background },
                ]}
              >
                <Text
                  style={[
                    styles.playerChipText,
                    { color: c.textSecondary },
                    active && { color: battleColors.title },
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.note, { color: c.textMuted }]}>
          {t('battle.setupNote', { s: TURN_SECONDS })}
        </Text>
        <Pressable
          onPress={startBattle}
          style={[styles.primaryBtn, { backgroundColor: battleColors.background }]}
        >
          <Text style={[styles.primaryBtnText, { color: battleColors.title }]}>
            {t('battle.start')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'ready') {
    return (
      <View style={[styles.centered, { backgroundColor: c.background }]}>
        <Text style={[styles.playerTag, { color: battleColors.title }]}>
          {t('battle.player', { n: current + 1 })}
        </Text>
        <Text style={[styles.heading, { color: c.text }]}>
          {t('battle.getReady')}
        </Text>
        <Text style={[styles.note, { color: c.textMuted }]}>
          {t('battle.readyNote', { n: current + 1, s: TURN_SECONDS })}
        </Text>
        <Pressable
          onPress={startTurn}
          style={[styles.primaryBtn, { backgroundColor: battleColors.background }]}
        >
          <Text style={[styles.primaryBtnText, { color: battleColors.title }]}>
            {t('battle.startTurn')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'results') {
    // Highest score (correct weighted by accuracy) wins; raw correct breaks ties.
    const best = results.reduce((b, r, i) => {
      const rPts = runScore(r);
      const bPts = runScore(results[b]);
      return rPts > bPts || (rPts === bPts && r.correct > results[b].correct)
        ? i
        : b;
    }, 0);
    return (
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={styles.resultsContent}
      >
        <Text style={[styles.heading, { color: c.text }]}>
          {t('battle.results')}
        </Text>
        {results.map((r, i) => {
          const isWinner = i === best && r.total > 0;
          return (
            <View
              key={i}
              style={[
                styles.resultCard,
                { backgroundColor: c.surface },
                isWinner && [
                  styles.resultCardWin,
                  { borderColor: battleColors.title },
                ],
              ]}
            >
              <View style={styles.resultHeader}>
                <Text style={[styles.resultPlayer, { color: c.text }]}>
                  {t('battle.player', { n: i + 1 })}
                </Text>
                {isWinner && <Text style={styles.crown}>{'👑'}</Text>}
              </View>
              <Text style={[styles.scoreValue, { color: battleColors.title }]}>
                {runScore(r)}
              </Text>
              <Text style={[styles.scoreLabel, { color: c.textMuted }]}>
                {t('battle.score')}
              </Text>
              <View style={styles.resultStats}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: battleColors.title }]}>
                    {r.correct}
                  </Text>
                  <Text style={[styles.statLabel, { color: c.textMuted }]}>
                    {t('battle.notesCorrect')}
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: battleColors.title }]}>
                    {accuracy(r)}%
                  </Text>
                  <Text style={[styles.statLabel, { color: c.textMuted }]}>
                    {t('battle.accuracy')}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
        <Pressable
          onPress={() => setPhase('setup')}
          style={[styles.primaryBtn, { backgroundColor: battleColors.background }]}
        >
          <Text style={[styles.primaryBtnText, { color: battleColors.title }]}>
            {t('battle.playAgain')}
          </Text>
        </Pressable>
      </ScrollView>
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
          <Text style={[styles.playPlayer, { color: battleColors.title }]}>
            {t('battle.player', { n: current + 1 })}
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

function accuracy(r: Result): number {
  return r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
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
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1c1c1e',
    marginBottom: 20,
    textAlign: 'center',
  },
  note: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 21,
  },
  playerTag: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5e5ce6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  playerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playerChip: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e9e9ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerChipActive: {
    backgroundColor: '#5e5ce6',
  },
  playerChipText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3a3a3c',
  },
  playerChipTextActive: {
    color: '#ffffff',
  },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: '#5e5ce6',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  // playing
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
  playPlayer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5e5ce6',
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
  // results
  resultsContent: {
    padding: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  resultCardWin: {
    borderColor: '#5e5ce6',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resultPlayer: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  crown: {
    fontSize: 18,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#5e5ce6',
    lineHeight: 44,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
    marginBottom: 12,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 32,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5e5ce6',
  },
  statLabel: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
});
