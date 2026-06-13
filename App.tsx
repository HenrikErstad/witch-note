import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';

import { Settings } from './src/music';
import { loadSettings, saveSettings } from './src/storage';
import { initSound } from './src/sound';
import { LangProvider, resolveLang, translate } from './src/i18n';
import HomeScreen from './src/screens/HomeScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import BattleScreen from './src/screens/BattleScreen';
import SettingsScreen from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = 'home' | 'practice' | 'battle' | 'settings';

const TITLE_KEY: Record<Screen, string> = {
  home: 'app.name',
  practice: 'title.practice',
  battle: 'title.battle',
  settings: 'title.settings',
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Bravura: require('./assets/Bravura.otf'),
  });
  const [settings, setSettings] = useState<Settings | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  // Where to return to when leaving Settings.
  const [settingsFrom, setSettingsFrom] = useState<Screen>('home');

  useEffect(() => {
    loadSettings().then(setSettings);
    initSound();
  }, []);

  const ready = (fontsLoaded || fontError) && settings !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Lock to portrait / landscape, or follow the device, per the setting.
  const rotation = settings?.rotation;
  useEffect(() => {
    if (rotation === undefined) return;
    if (rotation === 'portrait') {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      ).catch(() => {});
    } else if (rotation === 'landscape') {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).catch(() => {});
    } else {
      ScreenOrientation.unlockAsync().catch(() => {});
    }
  }, [rotation]);

  if (!ready || !settings) return null;

  function updateSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  function openSettings() {
    setSettingsFrom(screen);
    setScreen('settings');
  }

  // Back goes to where Settings was opened from; otherwise home.
  const backTarget: Screen | null =
    screen === 'settings' ? settingsFrom : screen === 'home' ? null : 'home';

  // Settings gear shows on home and practice.
  const showSettingsButton = screen === 'home' || screen === 'practice';

  const lang = resolveLang(settings.language);
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(lang, key, params);

  return (
    <LangProvider value={lang}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar style="dark" />
          <View style={styles.header}>
            <View style={styles.headerSide}>
              {backTarget && (
                <Pressable onPress={() => setScreen(backTarget)} hitSlop={12}>
                  <Text style={styles.headerAction}>{'‹'} {t('header.back')}</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.title}>{t(TITLE_KEY[screen])}</Text>
            <View style={[styles.headerSide, styles.headerRight]}>
              {showSettingsButton && (
                <Pressable onPress={openSettings} hitSlop={12}>
                  <Text style={styles.headerAction}>{t('header.settings')}</Text>
                </Pressable>
              )}
            </View>
          </View>

        <View style={styles.body}>
          {screen === 'home' && (
            <HomeScreen
              onPractice={() => setScreen('practice')}
              onBattle={() => setScreen('battle')}
            />
          )}
          {screen === 'practice' && <PracticeScreen settings={settings} />}
          {screen === 'battle' && <BattleScreen settings={settings} />}
          {screen === 'settings' && (
            <SettingsScreen settings={settings} onChange={updateSettings} />
          )}
        </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </LangProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSide: {
    width: 80,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  headerAction: {
    fontSize: 16,
    color: '#007aff',
    fontWeight: '500',
  },
  body: {
    flex: 1,
  },
});
