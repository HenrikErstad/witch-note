import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  onPractice: () => void;
  onBattle: () => void;
}

export default function HomeScreen({ onPractice, onBattle }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.logo}>{'♫'}</Text>
        <Text style={styles.title}>Note Trainer</Text>
        <Text style={styles.subtitle}>Learn to read music at a glance.</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          onPress={onPractice}
          style={({ pressed }) => [
            styles.button,
            styles.practice,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonTitle}>Practice mode</Text>
          <Text style={styles.buttonSub}>Identify notes at your own pace</Text>
        </Pressable>

        <Pressable
          onPress={onBattle}
          style={({ pressed }) => [
            styles.button,
            styles.battle,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.battleHeader}>
            <Text style={styles.buttonTitle}>Battle mode</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SOON</Text>
            </View>
          </View>
          <Text style={styles.buttonSub}>Race the clock for a high score</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 56,
    color: '#007aff',
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1c1c1e',
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 6,
  },
  buttons: {
    gap: 16,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 22,
  },
  pressed: {
    opacity: 0.85,
  },
  practice: {
    backgroundColor: '#007aff',
  },
  battle: {
    backgroundColor: '#5e5ce6',
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
