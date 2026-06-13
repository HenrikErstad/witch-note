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
  CLEF_NAME,
  samePitch,
  semitone,
  nextRound,
} from '../music';
import { playSemitone } from '../sound';

interface Props {
  settings: Settings;
}

type Phase = 'setup' | 'ready' | 'playing' | 'results';
type Result = { correct: number; total: number };

const TURN_SECONDS = 60;
const FLASH_MS = 350;
const PLAYER_OPTIONS = [2, 3, 4, 5, 6];

export default function BattleScreen({ settings }: Props) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;

  const [phase, setPhase] = useState<Phase>('setup');
  const [numPlayers, setNumPlayers] = useState(2);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<Result[]>([]);

  // Per-turn state.
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

  const endTurn = useCallback(() => {
    const res: Result = { correct: correctRef.current, total: totalRef.current };
    setResults((prev) => {
      const copy = prev.slice();
      copy[current] = res;
      return copy;
    });
    if (current + 1 < numPlayers) {
      setCurrent(current + 1);
      setPhase('ready');
    } else {
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

  // Play the note's pitch when it appears, if sound is enabled.
  useEffect(() => {
    if (phase === 'playing' && settings.sound) {
      playSemitone(semitone(round.note));
    }
  }, [round, phase, settings.sound]);

  function startBattle() {
    setResults(
      Array.from({ length: numPlayers }, () => ({ correct: 0, total: 0 }))
    );
    setCurrent(0);
    setPhase('ready');
  }

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

  if (phase === 'setup') {
    return (
      <View style={styles.centered}>
        <Text style={styles.heading}>How many players?</Text>
        <View style={styles.playerRow}>
          {PLAYER_OPTIONS.map((n) => {
            const active = n === numPlayers;
            return (
              <Pressable
                key={n}
                onPress={() => setNumPlayers(n)}
                style={[styles.playerChip, active && styles.playerChipActive]}
              >
                <Text
                  style={[
                    styles.playerChipText,
                    active && styles.playerChipTextActive,
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>
          Each player gets {TURN_SECONDS} seconds to name as many notes as they
          can. Scores are revealed at the end.
        </Text>
        <Pressable onPress={startBattle} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Start battle</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'ready') {
    return (
      <View style={styles.centered}>
        <Text style={styles.playerTag}>Player {current + 1}</Text>
        <Text style={styles.heading}>Get ready!</Text>
        <Text style={styles.note}>
          Pass the device to player {current + 1}. You'll have {TURN_SECONDS}{' '}
          seconds once you tap start.
        </Text>
        <Pressable onPress={startTurn} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Start turn</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'results') {
    const best = results.reduce(
      (b, r, i) =>
        r.correct > results[b].correct ||
        (r.correct === results[b].correct &&
          accuracy(r) > accuracy(results[b]))
          ? i
          : b,
      0
    );
    return (
      <ScrollView contentContainerStyle={styles.resultsContent}>
        <Text style={styles.heading}>Results</Text>
        {results.map((r, i) => {
          const isWinner = i === best && r.total > 0;
          return (
            <View
              key={i}
              style={[styles.resultCard, isWinner && styles.resultCardWin]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultPlayer}>Player {i + 1}</Text>
                {isWinner && <Text style={styles.crown}>{'👑'}</Text>}
              </View>
              <View style={styles.resultStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{r.correct}</Text>
                  <Text style={styles.statLabel}>notes correct</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{accuracy(r)}%</Text>
                  <Text style={styles.statLabel}>accuracy</Text>
                </View>
              </View>
            </View>
          );
        })}
        <Pressable onPress={() => setPhase('setup')} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Play again</Text>
        </Pressable>
      </ScrollView>
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
          <Text style={styles.playPlayer}>Player {current + 1}</Text>
          <Text
            style={[styles.timer, timeLeft <= 10 && styles.timerLow]}
          >
            {timeLeft}s
          </Text>
        </View>

        <Text style={styles.clefLabel}>{CLEF_NAME[round.clef]} clef</Text>

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
          minIndex={settings.minIndex}
          maxIndex={settings.maxIndex}
          onPressKey={handlePress}
          feedback={feedback}
          disabled={locked}
          showLabels={!settings.hardcore}
          blackKeysActive={settings.accidentals}
          accidentalStyle={round.note.accidental === 'flat' ? 'flat' : 'sharp'}
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
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
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
