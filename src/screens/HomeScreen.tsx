import React from 'react';
import { Image, View, Text, Pressable, StyleSheet } from 'react-native';
import { useT } from '../i18n';
import { PHONE_CONTENT_WIDTH } from '../layout';
import { useTheme } from '../theme';

interface Props {
  onPractice: () => void;
  onChallenge: () => void;
  onBattle: () => void;
}

export default function HomeScreen({ onPractice, onChallenge, onBattle }: Props) {
  const t = useT();
  const theme = useTheme();
  const c = theme.colors;
  const buttons = theme.homeButtons;
  const logoSource = theme.dark
    ? require('../../assets/android-icon-monochrome.png')
    : require('../../assets/logo-monochrome-inverted.png');
  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <Image
          source={logoSource}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: c.text }]}>{t('app.name')}</Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          onPress={onPractice}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: buttons.practice.background },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonTitle, { color: buttons.practice.title }]}>
            {t('home.practice')}
          </Text>
          <Text style={[styles.buttonSub, { color: buttons.practice.subtitle }]}>
            {t('home.practiceSub')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onChallenge}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: buttons.challenge.background },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonTitle, { color: buttons.challenge.title }]}>
            {t('home.challenge')}
          </Text>
          <Text style={[styles.buttonSub, { color: buttons.challenge.subtitle }]}>
            {t('home.challengeSub')}
          </Text>
        </Pressable>

        <Pressable
          onPress={onBattle}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: buttons.battle.background },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.buttonTitle, { color: buttons.battle.title }]}>
            {t('home.battle')}
          </Text>
          <Text style={[styles.buttonSub, { color: buttons.battle.subtitle }]}>
            {t('home.battleSub')}
          </Text>
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
    width: 158,
    height: 158,
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1c1c1e',
  },
  buttons: {
    gap: 16,
    width: '100%',
    maxWidth: PHONE_CONTENT_WIDTH,
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
    backgroundColor: '#bdebc9',
  },
  practiceTitle: {
    color: '#14532d',
  },
  practiceSub: {
    color: '#2f6b48',
  },
  challenge: {
    backgroundColor: '#ffd8b0',
  },
  challengeTitle: {
    color: '#7a3e0a',
  },
  challengeSub: {
    color: '#9a5a22',
  },
  battle: {
    backgroundColor: '#f3e3a3',
  },
  battleTitle: {
    color: '#5c4708',
  },
  battleSub: {
    color: '#7a6418',
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
