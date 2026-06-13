import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useT } from '../i18n';

interface Props {
  onPractice: () => void;
  onBattle: () => void;
}

export default function HomeScreen({ onPractice, onBattle }: Props) {
  const t = useT();
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Text style={styles.logo}>{'♫'}</Text>
        <Text style={styles.title}>{t('app.name')}</Text>
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
          <Text style={styles.buttonTitle}>{t('home.practice')}</Text>
          <Text style={styles.buttonSub}>{t('home.practiceSub')}</Text>
        </Pressable>

        <Pressable
          onPress={onBattle}
          style={({ pressed }) => [
            styles.button,
            styles.battle,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonTitle}>{t('home.battle')}</Text>
          <Text style={styles.buttonSub}>{t('home.battleSub')}</Text>
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
});
