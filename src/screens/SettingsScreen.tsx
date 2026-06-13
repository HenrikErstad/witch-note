import React from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Settings,
  RotationMode,
  Difficulty,
  noteFromIndex,
  noteLabel,
  RANGE_FLOOR,
  RANGE_CEIL,
} from '../music';

const ROTATION_OPTIONS: { value: RotationMode; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'auto', label: 'Auto' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'intermediate', label: 'Interm.' },
  { value: 'expert', label: 'Expert' },
];

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
          >
            <Text
              style={[styles.segmentText, active && styles.segmentTextActive]}
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
  return (
    <View style={styles.stepper}>
      <Pressable
        disabled={!canDec}
        onPress={onDec}
        style={[styles.stepBtn, !canDec && styles.stepBtnOff]}
      >
        <Text style={styles.stepBtnText}>-</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        disabled={!canInc}
        onPress={onInc}
        style={[styles.stepBtn, !canInc && styles.stepBtnOff]}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export default function SettingsScreen({ settings, onChange }: Props) {
  function set(patch: Partial<Settings>) {
    onChange({ ...settings, ...patch });
  }

  // Don't allow turning off the last enabled clef.
  function toggleClef(clef: 'treble' | 'bass', value: boolean) {
    const next = { ...settings, [clef]: value };
    if (!next.treble && !next.bass) return;
    onChange(next);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Clefs</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Treble clef</Text>
          <Switch
            value={settings.treble}
            onValueChange={(v) => toggleClef('treble', v)}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Bass clef</Text>
          <Switch
            value={settings.bass}
            onValueChange={(v) => toggleClef('bass', v)}
          />
        </View>
      </View>
      <Text style={styles.hint}>At least one clef must stay on.</Text>

      <Text style={styles.sectionTitle}>Note range</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Lowest note</Text>
          <Stepper
            value={noteLabel(noteFromIndex(settings.minIndex))}
            canDec={settings.minIndex > RANGE_FLOOR}
            canInc={settings.minIndex < settings.maxIndex}
            onDec={() => set({ minIndex: settings.minIndex - 1 })}
            onInc={() => set({ minIndex: settings.minIndex + 1 })}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Highest note</Text>
          <Stepper
            value={noteLabel(noteFromIndex(settings.maxIndex))}
            canDec={settings.maxIndex > settings.minIndex}
            canInc={settings.maxIndex < RANGE_CEIL}
            onDec={() => set({ maxIndex: settings.maxIndex - 1 })}
            onInc={() => set({ maxIndex: settings.maxIndex + 1 })}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Notes are drawn at random between these two, inclusive. A wider range adds
        ledger-line notes.
      </Text>

      <Text style={styles.sectionTitle}>Difficulty</Text>
      <View style={styles.card}>
        <View style={styles.colRow}>
          <Text style={styles.rowLabel}>Notes</Text>
          <Segmented
            value={settings.difficulty}
            onChange={(v) => set({ difficulty: v })}
            options={DIFFICULTY_OPTIONS}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Hardcore mode</Text>
          <Switch
            value={settings.hardcore}
            onValueChange={(v) => set({ hardcore: v })}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Easy: naturals only. Intermediate: adds sharps & flats. Expert: also adds
        B♯, C♭, E♯, F♭. Hardcore hides the note names on the keys.
      </Text>

      <Text style={styles.sectionTitle}>Sound</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Play note sound</Text>
          <Switch
            value={settings.sound}
            onValueChange={(v) => set({ sound: v })}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Plays the pitch when a new note appears, and shows a "Hear note" button.
      </Text>

      <Text style={styles.sectionTitle}>Orientation</Text>
      <View style={styles.card}>
        <View style={styles.colRow}>
          <Text style={styles.rowLabel}>Screen rotation</Text>
          <Segmented
            value={settings.rotation}
            onChange={(v) => set({ rotation: v })}
            options={ROTATION_OPTIONS}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Portrait and Landscape lock the screen; Auto follows how you tilt the
        device.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
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
});
