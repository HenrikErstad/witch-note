import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useT } from '../i18n';
import { MAX_CONTENT_WIDTH } from '../layout';

interface Props {
  onPractice: () => void;
  onChallenge: () => void;
  onBattle: () => void;
}

export default function HomeScreen({ onPractice, onChallenge, onBattle }: Props) {
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
          onPress={onChallenge}
          style={({ pressed }) => [
            styles.button,
            styles.challenge,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.buttonTitle}>{t('home.challenge')}</Text>
          <Text style={styles.buttonSub}>{t('home.challengeSub')}</Text>
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
    alignItems: 'center',
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
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
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
  challenge: {
    backgroundColor: '#ff9500',
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
