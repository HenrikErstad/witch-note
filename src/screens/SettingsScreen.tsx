import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Constants from 'expo-constants';
import {
  Settings,
  RotationMode,
  Difficulty,
  Clef,
  noteFromIndex,
  noteLabel,
  clefScope,
} from '../music';
import { useT, LangSetting, resolveLang } from '../i18n';
import { MAX_CONTENT_WIDTH } from '../layout';
import { ColorModeSetting, useTheme } from '../theme';
import {
  ChallengeData,
  loadChallenge,
  clearChallenge,
  runScore,
} from '../storage';

// App version, shown in the footer. Tapping it repeatedly reveals the stats button.
const APP_VERSION = Constants.expoConfig?.version ?? '?';
// Number of taps on the version number that reveals the hidden stats button.
const UNLOCK_TAPS = 7;
const DIFFICULTIES: Difficulty[] = ['easy', 'intermediate', 'expert'];

// Smallest span (highest - lowest, in diatonic steps) a clef's range may shrink to.
const MIN_RANGE = 2;

const ROTATION_VALUES: RotationMode[] = ['portrait', 'landscape', 'auto'];
const DIFFICULTY_VALUES: Difficulty[] = ['easy', 'intermediate', 'expert'];
const LANGUAGE_VALUES: LangSetting[] = ['system', 'en', 'nb'];
const COLOR_MODE_VALUES: ColorModeSetting[] = ['system', 'light', 'dark'];

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.segment, { backgroundColor: c.surfaceMuted }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segmentBtn,
              active && [
                styles.segmentBtnActive,
                { backgroundColor: c.surfaceElevated, shadowColor: c.shadow },
              ],
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: c.textSecondary },
                active && [styles.segmentTextActive, { color: c.primary }],
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

function Stepper({
  value,
  onDec,
  onInc,
  canDec,
  canInc,
}: {
  value: string;
  onDec: () => void;
  onInc: () => void;
  canDec: boolean;
  canInc: boolean;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const activeText = theme.dark ? c.background : '#ffffff';
  return (
    <View style={styles.stepper}>
      <Pressable
        disabled={!canDec}
        onPress={onDec}
        style={[
          styles.stepBtn,
          { backgroundColor: c.primary },
          !canDec && [styles.stepBtnOff, { backgroundColor: c.surfaceMuted }],
        ]}
      >
        <Text
          style={[
            styles.stepBtnText,
            { color: canDec ? activeText : c.textSubtle },
          ]}
        >
          -
        </Text>
      </Pressable>
      <Text style={[styles.stepValue, { color: c.text }]}>{value}</Text>
      <Pressable
        disabled={!canInc}
        onPress={onInc}
        style={[
          styles.stepBtn,
          { backgroundColor: c.primary },
          !canInc && [styles.stepBtnOff, { backgroundColor: c.surfaceMuted }],
        ]}
      >
        <Text
          style={[
            styles.stepBtnText,
            { color: canInc ? activeText : c.textSubtle },
          ]}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}

function ClefCard({
  settings,
  clef,
  set,
  toggle,
}: {
  settings: Settings;
  clef: Clef;
  set: (patch: Partial<Settings>) => void;
  toggle: (clef: Clef, value: boolean) => void;
}) {
  const t = useT();
  const theme = useTheme();
  const c = theme.colors;
  const enabled = clef === 'treble' ? settings.treble : settings.bass;
  const scope = clefScope(clef);
  const min = clef === 'treble' ? settings.trebleMin : settings.bassMin;
  const max = clef === 'treble' ? settings.trebleMax : settings.bassMax;
  const setMin = (v: number) =>
    set(clef === 'treble' ? { trebleMin: v } : { bassMin: v });
  const setMax = (v: number) =>
    set(clef === 'treble' ? { trebleMax: v } : { bassMax: v });

  return (
    <>
      <Text style={[styles.sectionTitle, { color: c.textMuted }]}>
        {t(clef === 'treble' ? 'clef.trebleFull' : 'clef.bassFull')}
      </Text>
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: c.text }]}>
            {t('settings.enabled')}
          </Text>
          <Switch
            value={enabled}
            onValueChange={(v) => toggle(clef, v)}
            trackColor={{ false: c.surfaceMuted, true: c.primary }}
            thumbColor={theme.dark ? c.surfaceElevated : '#ffffff'}
          />
        </View>
        {enabled && (
          <>
            <View style={[styles.divider, { backgroundColor: c.divider }]} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: c.text }]}>
                {t('settings.lowest')}
              </Text>
              <Stepper
                value={noteLabel(noteFromIndex(min))}
                canDec={min > scope.lo}
                canInc={min < max - MIN_RANGE}
                onDec={() => setMin(min - 1)}
                onInc={() => setMin(min + 1)}
              />
            </View>
            <View style={[styles.divider, { backgroundColor: c.divider }]} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: c.text }]}>
                {t('settings.highest')}
              </Text>
              <Stepper
                value={noteLabel(noteFromIndex(max))}
                canDec={max > min + MIN_RANGE}
                canInc={max < scope.hi}
                onDec={() => setMax(max - 1)}
                onInc={() => setMax(max + 1)}
              />
            </View>
          </>
        )}
      </View>
    </>
  );
}

export default function SettingsScreen({ settings, onChange }: Props) {
  const t = useT();
  const theme = useTheme();
  const c = theme.colors;
  const sectionTitleStyle = [styles.sectionTitle, { color: c.textMuted }];
  const cardStyle = [styles.card, { backgroundColor: c.surface }];
  const rowLabelStyle = [styles.rowLabel, { color: c.text }];
  const hintStyle = [styles.hint, { color: c.textMuted }];
  const dividerStyle = [styles.divider, { backgroundColor: c.divider }];
  const switchColors = {
    trackColor: { false: c.surfaceMuted, true: c.primary },
    thumbColor: theme.dark ? c.surfaceElevated : '#ffffff',
  };

  function set(patch: Partial<Settings>) {
    onChange({ ...settings, ...patch });
  }

  // Don't allow turning off the last enabled clef.
  function toggleClef(clef: 'treble' | 'bass', value: boolean) {
    const next = { ...settings, [clef]: value };
    if (!next.treble && !next.bass) return;
    onChange(next);
  }

  // Hidden stats: tap the version number UNLOCK_TAPS times, then confirm.
  const tapCount = useRef(0);
  function onVersionPress() {
    if (settings.statsUnlocked) return;
    tapCount.current += 1;
    if (tapCount.current < UNLOCK_TAPS) return;
    tapCount.current = 0;
    Alert.alert(t('settings.unlockTitle'), t('settings.unlockMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.unlockConfirm'), onPress: () => set({ statsUnlocked: true }) },
    ]);
  }

  // Once unlocked, load the challenge data to display inline.
  const [stats, setStats] = useState<ChallengeData | null>(null);
  useEffect(() => {
    if (settings.statsUnlocked) loadChallenge().then(setStats);
  }, [settings.statsUnlocked]);

  function resetStats() {
    Alert.alert(t('settings.resetTitle'), t('settings.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetConfirm'),
        style: 'destructive',
        onPress: async () => {
          await clearChallenge();
          setStats({ best: {}, history: {} });
        },
      },
    ]);
  }

  // Difficulties that have a recorded best or run history, plus the run total.
  const statsRows = (stats ? DIFFICULTIES : [])
    .map((d) => ({ d, best: stats!.best[d], runs: stats!.history[d] ?? [] }))
    .filter((r) => r.best || r.runs.length > 0);
  const totalRuns = stats
    ? DIFFICULTIES.reduce((n, d) => n + (stats.history[d]?.length ?? 0), 0)
    : 0;

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.inner}>
      <ClefCard settings={settings} clef="treble" set={set} toggle={toggleClef} />
      <ClefCard settings={settings} clef="bass" set={set} toggle={toggleClef} />
      <Text style={hintStyle}>{t('settings.rangeHint')}</Text>

      <Text style={sectionTitleStyle}>{t('settings.difficulty')}</Text>
      <View style={cardStyle}>
        <View style={styles.colRow}>
          <Text style={rowLabelStyle}>{t('settings.notes')}</Text>
          <Segmented
            value={settings.difficulty}
            onChange={(v) => set({ difficulty: v })}
            options={DIFFICULTY_VALUES.map((v) => ({
              value: v,
              label: t(`difficulty.${v}`),
            }))}
          />
        </View>
        <View style={dividerStyle} />
        <View style={styles.row}>
          <Text style={rowLabelStyle}>{t('settings.hardcore')}</Text>
          <Switch
            value={settings.hardcore}
            onValueChange={(v) => set({ hardcore: v })}
            {...switchColors}
          />
        </View>
      </View>
      <Text style={hintStyle}>{t('settings.difficultyHint')}</Text>

      <Text style={sectionTitleStyle}>{t('settings.sound')}</Text>
      <View style={cardStyle}>
        <View style={styles.row}>
          <Text style={rowLabelStyle}>{t('settings.playSound')}</Text>
          <Switch
            value={settings.sound}
            onValueChange={(v) => set({ sound: v })}
            {...switchColors}
          />
        </View>
      </View>
      <Text style={hintStyle}>{t('settings.soundHint')}</Text>

      <Text style={sectionTitleStyle}>{t('settings.language')}</Text>
      <View style={cardStyle}>
        <View style={styles.colRow}>
          <Text style={rowLabelStyle}>{t('settings.language')}</Text>
          <Segmented
            value={settings.language}
            onChange={(v) =>
              set({ language: v, germanNotation: resolveLang(v) === 'nb' })
            }
            options={LANGUAGE_VALUES.map((v) => ({
              value: v,
              label: t(`language.${v}`),
            }))}
          />
        </View>
        <View style={dividerStyle} />
        <View style={styles.row}>
          <Text style={rowLabelStyle}>{t('settings.germanNotation')}</Text>
          <Switch
            value={settings.germanNotation}
            onValueChange={(v) => set({ germanNotation: v })}
            {...switchColors}
          />
        </View>
      </View>
      <Text style={hintStyle}>{t('settings.germanNotationHint')}</Text>

      <Text style={sectionTitleStyle}>{t('settings.orientation')}</Text>
      <View style={cardStyle}>
        <View style={styles.colRow}>
          <Text style={rowLabelStyle}>{t('settings.rotation')}</Text>
          <Segmented
            value={settings.rotation}
            onChange={(v) => set({ rotation: v })}
            options={ROTATION_VALUES.map((v) => ({
              value: v,
              label: t(`rotation.${v}`),
            }))}
          />
        </View>
      </View>
      <Text style={hintStyle}>{t('settings.rotationHint')}</Text>

      <Text style={sectionTitleStyle}>{t('settings.appearance')}</Text>
      <View style={cardStyle}>
        <View style={styles.colRow}>
          <Text style={rowLabelStyle}>{t('settings.colorMode')}</Text>
          <Segmented
            value={settings.colorMode}
            onChange={(v) => set({ colorMode: v })}
            options={COLOR_MODE_VALUES.map((v) => ({
              value: v,
              label: t(`colorMode.${v}`),
            }))}
          />
        </View>
      </View>
      <Text style={hintStyle}>{t('settings.colorModeHint')}</Text>

      {settings.statsUnlocked && (
        <>
          <Text style={sectionTitleStyle}>{t('settings.stats')}</Text>
          <View style={cardStyle}>
            {statsRows.length === 0 ? (
              <View style={styles.row}>
                <Text style={[styles.statsEmpty, { color: c.textMuted }]}>
                  {t('settings.statsEmpty')}
                </Text>
              </View>
            ) : (
              <>
                {statsRows.map(({ d, best }, i) => {
                  const acc =
                    best && best.total > 0
                      ? Math.round((best.correct / best.total) * 100)
                      : 0;
                  return (
                    <View key={d}>
                      {i > 0 && <View style={dividerStyle} />}
                      <View style={styles.row}>
                        <Text style={rowLabelStyle}>{t(`difficulty.${d}`)}</Text>
                        <Text style={[styles.statsValue, { color: c.textSecondary }]}>
                          {best
                            ? `${runScore(best)} · ${best.correct}/${best.total} · ${acc}%`
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                <View style={dividerStyle} />
                <View style={styles.row}>
                  <Text style={rowLabelStyle}>{t('settings.statsTotal')}</Text>
                  <Text style={[styles.statsValue, { color: c.textSecondary }]}>
                    {totalRuns}
                  </Text>
                </View>
              </>
            )}
          </View>
          <Text style={hintStyle}>{t('settings.statsHint')}</Text>

          <View style={[cardStyle, { marginTop: 16 }]}>
            <Pressable style={styles.row} onPress={resetStats}>
              <Text style={[styles.rowLabel, { color: c.danger }]}>
                {t('settings.resetStats')}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <Pressable
        onPress={onVersionPress}
        style={styles.versionWrap}
        accessibilityRole="button"
      >
        <Text style={[styles.version, { color: c.textSubtle }]}>
          {t('settings.version', { v: APP_VERSION })}
        </Text>
      </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  colRow: {
    paddingVertical: 14,
    gap: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e9e9ec',
    borderRadius: 9,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 7,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontSize: 15,
    color: '#3a3a3c',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: '#007aff',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5ea',
  },
  rowLabel: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  hint: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 8,
    marginLeft: 4,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007aff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: {
    backgroundColor: '#c7c7cc',
  },
  stepBtnText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  stepValue: {
    width: 56,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  statsValue: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statsEmpty: {
    fontSize: 15,
  },
  versionWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  version: {
    fontSize: 13,
    fontWeight: '500',
  },
});
