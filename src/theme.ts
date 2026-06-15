import React, { createContext, useContext } from 'react';
import type { ColorSchemeName } from 'react-native';

export type ColorMode = 'light' | 'dark';
export type ColorModeSetting = 'system' | ColorMode;

type ModeButtonColors = {
  background: string;
  title: string;
  subtitle: string;
};

export type AppTheme = {
  mode: ColorMode;
  dark: boolean;
  statusBarStyle: 'dark' | 'light';
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    surfaceMuted: string;
    divider: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    textSubtle: string;
    primary: string;
    primaryMuted: string;
    success: string;
    danger: string;
    shadow: string;
    staffCard: string;
    staffInk: string;
  };
  homeButtons: {
    practice: ModeButtonColors;
    challenge: ModeButtonColors;
    battle: ModeButtonColors;
  };
  piano: {
    white: string;
    whiteBorder: string;
    whiteLabel: string;
    whiteMuted: string;
    black: string;
    blackLabel: string;
  };
  chart: {
    axis: string;
    label: string;
    mutedBar: string;
  };
};

export function resolveColorMode(
  setting: ColorModeSetting,
  systemScheme: ColorSchemeName
): ColorMode {
  if (setting === 'light' || setting === 'dark') return setting;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export const THEMES: Record<ColorMode, AppTheme> = {
  light: {
    mode: 'light',
    dark: false,
    statusBarStyle: 'dark',
    colors: {
      background: '#f2f2f7',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      surfaceMuted: '#e9e9ec',
      divider: '#e5e5ea',
      text: '#1c1c1e',
      textSecondary: '#3a3a3c',
      textMuted: '#8e8e93',
      textSubtle: '#aeaeb2',
      primary: '#007aff',
      primaryMuted: '#eef2ff',
      success: '#34c759',
      danger: '#ff3b30',
      shadow: '#000000',
      staffCard: '#ffffff',
      staffInk: '#1c1c1e',
    },
    homeButtons: {
      practice: {
        background: '#bdebc9',
        title: '#14532d',
        subtitle: '#2f6b48',
      },
      challenge: {
        background: '#ffd8b0',
        title: '#7a3e0a',
        subtitle: '#9a5a22',
      },
      battle: {
        background: '#f3e3a3',
        title: '#5c4708',
        subtitle: '#7a6418',
      },
    },
    piano: {
      white: '#ffffff',
      whiteBorder: '#c7c7cc',
      whiteLabel: '#3a3a3c',
      whiteMuted: '#8e8e93',
      black: '#1c1c1e',
      blackLabel: '#ffffff',
    },
    chart: {
      axis: '#e5e5ea',
      label: '#8e8e93',
      mutedBar: '#ffd8a8',
    },
  },
  dark: {
    mode: 'dark',
    dark: true,
    statusBarStyle: 'light',
    colors: {
      background: '#12051f',
      surface: '#211032',
      surfaceElevated: '#2c1242',
      surfaceMuted: '#321c49',
      divider: '#44275f',
      text: '#f3ecff',
      textSecondary: '#ded0f7',
      textMuted: '#c9bfe0',
      textSubtle: '#9d8bb9',
      primary: '#d7a7ff',
      primaryMuted: '#2b1640',
      success: '#77d88f',
      danger: '#ff6b6b',
      shadow: '#000000',
      staffCard: '#f8f4ff',
      staffInk: '#17072d',
    },
    homeButtons: {
      practice: {
        background: '#223d31',
        title: '#d7f8df',
        subtitle: '#a9dcb9',
      },
      challenge: {
        background: '#4a2a1a',
        title: '#ffe4ca',
        subtitle: '#ffc18a',
      },
      battle: {
        background: '#443818',
        title: '#fff0b0',
        subtitle: '#dfc86f',
      },
    },
    piano: {
      white: '#f8f4ff',
      whiteBorder: '#6b5680',
      whiteLabel: '#2c1242',
      whiteMuted: '#7c688f',
      black: '#12051f',
      blackLabel: '#f3ecff',
    },
    chart: {
      axis: '#44275f',
      label: '#c9bfe0',
      mutedBar: '#6f477f',
    },
  },
};

const ThemeContext = createContext<AppTheme>(THEMES.light);
export const ThemeProvider = ThemeContext.Provider;

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
