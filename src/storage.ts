import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, DEFAULT_SETTINGS, clefScope, Difficulty } from './music';
import { resolveLang } from './i18n';

const KEY = 'note-trainer:settings:v2';

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      // First launch: default H-naming on for Norwegian devices.
      return {
        ...DEFAULT_SETTINGS,
        germanNotation: resolveLang('system') === 'nb',
      };
    }
    const parsed = JSON.parse(raw);
    // Merge so missing/new fields fall back to defaults.
    const merged: Settings = { ...DEFAULT_SETTINGS, ...parsed };
    if (!merged.treble && !merged.bass) merged.treble = true; // never leave both off
    // If the stored data predates this field, default it from the language.
    if (parsed.germanNotation === undefined) {
      merged.germanNotation = resolveLang(merged.language) === 'nb';
    }

    // Keep each clef's range valid and within its scope.
    const t = clefScope('treble');
    if (
      merged.trebleMin > merged.trebleMax ||
      merged.trebleMin < t.lo ||
      merged.trebleMax > t.hi
    ) {
      merged.trebleMin = DEFAULT_SETTINGS.trebleMin;
      merged.trebleMax = DEFAULT_SETTINGS.trebleMax;
    }
    const b = clefScope('bass');
    if (
      merged.bassMin > merged.bassMax ||
      merged.bassMin < b.lo ||
      merged.bassMax > b.hi
    ) {
      merged.bassMin = DEFAULT_SETTINGS.bassMin;
      merged.bassMax = DEFAULT_SETTINGS.bassMax;
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // best-effort; ignore write failures
  }
}

// --- challenge-mode scores ---
// `best` is the all-time best per difficulty; `history` keeps only the last
// HISTORY_LIMIT runs per difficulty (for the results graph).

const CHALLENGE_KEY = 'note-trainer:challenge:v3';
export const HISTORY_LIMIT = 30;

export type BestScore = { correct: number; total: number };
export type BestByDifficulty = Partial<Record<Difficulty, BestScore>>;
export type HistoryByDifficulty = Partial<Record<Difficulty, BestScore[]>>;
export type ChallengeData = {
  best: BestByDifficulty;
  history: HistoryByDifficulty;
};

const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'expert'];

function isScore(v: unknown): v is BestScore {
  return (
    typeof (v as BestScore)?.correct === 'number' &&
    typeof (v as BestScore)?.total === 'number'
  );
}

export async function loadChallenge(): Promise<ChallengeData> {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGE_KEY);
    if (!raw) return { best: {}, history: {} };
    const p = JSON.parse(raw);
    const best: BestByDifficulty = {};
    const history: HistoryByDifficulty = {};
    for (const d of DIFFICULTIES) {
      if (isScore(p?.best?.[d])) best[d] = p.best[d];
      const list = p?.history?.[d];
      if (Array.isArray(list)) history[d] = list.filter(isScore).slice(-HISTORY_LIMIT);
    }
    return { best, history };
  } catch {
    return { best: {}, history: {} };
  }
}

export async function saveChallenge(data: ChallengeData): Promise<void> {
  try {
    await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify(data));
  } catch {
    // best-effort
  }
}
