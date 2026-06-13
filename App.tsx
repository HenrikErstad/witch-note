import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { Settings } from './src/music';
import { loadSettings, saveSettings } from './src/storage';
import PracticeScreen from './src/screens/PracticeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

type Screen = 'practice' | 'settings';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Bravura: require('./assets/Bravura.otf'),
  });
  const [settings, setSettings] = useState<Settings | null>(null);
  const [screen, setScreen] = useState<Screen>('practice');

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const ready = (fontsLoaded || fontError) && settings !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready || !settings) return null;

  function updateSettings(next: Settings) {
    setSettings(next);
    saveSettings(next);
  }

  const onSettings = screen === 'settings';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {onSettings && (
            <Pressable onPress={() => setScreen('practice')} hitSlop={12}>
              <Text style={styles.headerAction}>{'‹'} Back</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.title}>
          {onSettings ? 'Settings' : 'Note Trainer'}
        </Text>
        <View style={[styles.headerSide, styles.headerRight]}>
          {!onSettings && (
            <Pressable onPress={() => setScreen('settings')} hitSlop={12}>
              <Text style={styles.headerAction}>Settings</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {onSettings ? (
          <SettingsScreen settings={settings} onChange={updateSettings} />
        ) : (
          <PracticeScreen settings={settings} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0,
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
