import React, { createContext, useContext } from 'react';
import * as Localization from 'expo-localization';

export type Lang = 'en' | 'nb';
export type LangSetting = 'system' | Lang;

type Dict = Record<string, string>;
type Params = Record<string, string | number>;

const en: Dict = {
  'app.name': 'Note Trainer',
  'header.back': 'Back',
  'header.settings': 'Settings',
  'title.practice': 'Practice mode',
  'title.challenge': 'Challenge',
  'title.battle': 'Multiplayer',
  'title.settings': 'Settings',

  'home.subtitle': 'Learn to read music at a glance.',
  'home.practice': 'Practice mode',
  'home.practiceSub': 'Identify notes at your own pace',
  'home.challenge': 'Challenge',
  'home.challengeSub': 'How many can you get before the time is up?',
  'home.battle': 'Multiplayer',
  'home.battleSub': 'Take turns against the clock',

  'challenge.intro': 'Name as many notes as you can in {s} seconds.',
  'challenge.difficultyHint': 'Difficulty is changed in Settings (top right corner).',
  'challenge.best': 'Best ({level}): {correct} notes · {accuracy}%',
  'challenge.noRecord': 'No record on {level} yet — set one!',
  'challenge.start': 'Start challenge',
  'challenge.thisRun': 'This run',
  'challenge.previousBest': 'Previous best',
  'challenge.newRecord': 'New record!',
  'challenge.none': '—',
  'challenge.history': 'Last {n} runs',

  'clef.trebleFull': 'Treble clef',
  'clef.bassFull': 'Bass clef',

  'practice.prompt': 'Which note is this?',
  'practice.correct': 'Correct — {note}',
  'practice.wrong': "That's {note} — try again",
  'practice.hear': '♪ Hear note',
  'practice.score': 'Score: {n}',
  'practice.streak': 'Streak: {n}',

  'battle.players': 'How many players?',
  'battle.setupNote':
    'Each player gets {s} seconds to name as many notes as they can. Scores are revealed at the end.',
  'battle.start': 'Start battle',
  'battle.player': 'Player {n}',
  'battle.getReady': 'Get ready!',
  'battle.readyNote':
    "Pass the device to player {n}. You'll have {s} seconds once you tap start.",
  'battle.startTurn': 'Start turn',
  'battle.results': 'Results',
  'battle.notesCorrect': 'notes correct',
  'battle.accuracy': 'accuracy',
  'battle.playAgain': 'Play again',

  'settings.enabled': 'Enabled',
  'settings.lowest': 'Lowest note',
  'settings.highest': 'Highest note',
  'settings.rangeHint':
    'Each clef draws notes within its own range (capped to two ledger lines beyond the staff). At least one clef must stay on.',
  'settings.difficulty': 'Difficulty',
  'settings.notes': 'Notes',
  'settings.hardcore': 'Hardcore mode',
  'settings.difficultyHint':
    'Easy: naturals only. Intermediate: adds sharps & flats. Expert: also adds B♯, C♭, E♯, F♭. Hardcore hides the note names on the keys.',
  'settings.sound': 'Sound',
  'settings.playSound': 'Play note sound',
  'settings.soundHint':
    'Plays the pitch when a new note appears, and shows a "Hear note" button.',
  'settings.orientation': 'Orientation',
  'settings.rotation': 'Screen rotation',
  'settings.rotationHint':
    'Portrait and Landscape lock the screen; Auto follows how you tilt the device.',
  'settings.language': 'Language',
  'settings.germanNotation': 'Use H instead of B',
  'settings.germanNotationHint':
    'Names the B-natural note "H" and B-flat "B", as in the Norwegian/German tradition.',

  'difficulty.easy': 'Easy',
  'difficulty.intermediate': 'Interm.',
  'difficulty.expert': 'Expert',

  'rotation.portrait': 'Portrait',
  'rotation.landscape': 'Landscape',
  'rotation.auto': 'Auto',

  'language.system': 'System',
  'language.en': 'English',
  'language.nb': 'Norsk',
};

const nb: Dict = {
  'app.name': 'Note Trainer',
  'header.back': 'Tilbake',
  'header.settings': 'Innstillinger',
  'title.practice': 'Øvingsmodus',
  'title.challenge': 'Utfordring',
  'title.battle': 'Flerspiller',
  'title.settings': 'Innstillinger',

  'home.subtitle': 'Lær å lese noter på et blikk.',
  'home.practice': 'Øvingsmodus',
  'home.practiceSub': 'Gjenkjenn noter i ditt eget tempo',
  'home.challenge': 'Utfordring',
  'home.challengeSub': 'Hvor mange klarer du før tiden er ute?',
  'home.battle': 'Flerspiller',
  'home.battleSub': 'Kjemp mot hverandre på tid',

  'challenge.intro': 'Navngi så mange noter som mulig på {s} sekunder.',
  'challenge.difficultyHint': 'Vanskelighetsgrad endres i Innstillinger (øverst til høyre).',
  'challenge.best': 'Rekord ({level}): {correct} noter · {accuracy}%',
  'challenge.noRecord': 'Ingen rekord på {level} ennå — sett en!',
  'challenge.start': 'Start utfordring',
  'challenge.thisRun': 'Denne runden',
  'challenge.previousBest': 'Forrige rekord',
  'challenge.newRecord': 'Ny rekord!',
  'challenge.none': '—',
  'challenge.history': 'Siste {n} runder',

  'clef.trebleFull': 'G-nøkkel',
  'clef.bassFull': 'F-nøkkel',

  'practice.prompt': 'Hvilken note er dette?',
  'practice.correct': 'Riktig — {note}',
  'practice.wrong': 'Det er {note} — prøv igjen',
  'practice.hear': '♪ Hør note',
  'practice.score': 'Poeng: {n}',
  'practice.streak': 'Rekke: {n}',

  'battle.players': 'Hvor mange spillere?',
  'battle.setupNote':
    'Hver spiller får {s} sekunder på å navngi så mange noter som mulig. Resultatene vises til slutt.',
  'battle.start': 'Start kamp',
  'battle.player': 'Spiller {n}',
  'battle.getReady': 'Gjør deg klar!',
  'battle.readyNote':
    'Gi enheten til spiller {n}. Du får {s} sekunder når du trykker start.',
  'battle.startTurn': 'Start tur',
  'battle.results': 'Resultater',
  'battle.notesCorrect': 'riktige noter',
  'battle.accuracy': 'treffsikkerhet',
  'battle.playAgain': 'Spill igjen',

  'settings.enabled': 'På',
  'settings.lowest': 'Laveste note',
  'settings.highest': 'Høyeste note',
  'settings.rangeHint':
    'Hver nøkkel henter noter innenfor sitt eget område (begrenset til to hjelpelinjer utenfor notesystemet). Minst én nøkkel må være på.',
  'settings.difficulty': 'Vanskelighetsgrad',
  'settings.notes': 'Noter',
  'settings.hardcore': 'Hardcore-modus',
  'settings.difficultyHint':
    'Lett: kun stamtoner. Middels: legger til kryss og b. Ekspert: legger også til B♯, C♭, E♯, F♭. Hardcore skjuler notenavnene på tangentene.',
  'settings.sound': 'Lyd',
  'settings.playSound': 'Spill notelyd',
  'settings.soundHint':
    'Spiller tonen når en ny note vises, og viser en «Hør note»-knapp.',
  'settings.orientation': 'Skjermretning',
  'settings.rotation': 'Skjermrotasjon',
  'settings.rotationHint':
    'Stående og Liggende låser skjermen; Auto følger hvordan du vrir enheten.',
  'settings.language': 'Språk',
  'settings.germanNotation': 'Bruk H i stedet for B',
  'settings.germanNotationHint':
    'Kaller noten B for «H» og B-en (bb) for «B», slik som i norsk/tysk tradisjon.',

  'difficulty.easy': 'Lett',
  'difficulty.intermediate': 'Middels',
  'difficulty.expert': 'Ekspert',

  'rotation.portrait': 'Stående',
  'rotation.landscape': 'Liggende',
  'rotation.auto': 'Auto',

  'language.system': 'System',
  'language.en': 'English',
  'language.nb': 'Norsk',
};

const DICTS: Record<Lang, Dict> = { en, nb };

// Resolve the effective language from the setting, falling back to the device.
export function resolveLang(setting: LangSetting): Lang {
  if (setting === 'en' || setting === 'nb') return setting;
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return code === 'nb' || code === 'nn' || code === 'no' ? 'nb' : 'en';
}

export function translate(lang: Lang, key: string, params?: Params): string {
  let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(`{${k}}`, String(v));
    }
  }
  return s;
}

export type T = (key: string, params?: Params) => string;

const LangContext = createContext<Lang>('en');
export const LangProvider = LangContext.Provider;

export function useT(): T {
  const lang = useContext(LangContext);
  return (key, params) => translate(lang, key, params);
}
