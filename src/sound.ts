import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
} from 'expo-audio';
import { TONES, TONE_OCTAVES } from './tones';

// One persistent player per base-octave tone. To sound a given pitch we pick
// the nearest base and nudge the playback rate by at most ~6 semitones, which
// keeps the rate inside Android's 0.1-2.0 limit while shifting pitch.
const players: Record<number, AudioPlayer> = {};
let ready = false;
const MIN_OCT = Math.min(...TONE_OCTAVES);
const MAX_OCT = Math.max(...TONE_OCTAVES);

export async function initSound(): Promise<void> {
  if (ready) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // non-fatal
  }
  for (const o of TONE_OCTAVES) {
    const player = createAudioPlayer(TONES[o]);
    player.shouldCorrectPitch = false; // let rate changes shift the pitch
    players[o] = player;
  }
  ready = true;
}

// Play the given chromatic pitch (semitone, MIDI-like: C4 = 48).
export function playSemitone(st: number): void {
  if (!ready) return;
  let octave = Math.round(st / 12);
  if (octave < MIN_OCT) octave = MIN_OCT;
  if (octave > MAX_OCT) octave = MAX_OCT;
  const player = players[octave];
  if (!player) return;
  const rate = Math.pow(2, (st - 12 * octave) / 12);
  try {
    player.shouldCorrectPitch = false;
    player.setPlaybackRate(rate);
    player.seekTo(0);
    player.play();
  } catch {
    // ignore transient playback errors
  }
}
