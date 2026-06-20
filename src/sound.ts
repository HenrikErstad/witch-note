import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
} from 'expo-audio';
import { TONES, TONE_SEMITONES } from './tones';

// One persistent player per playable pitch. Using exact-pitch files avoids
// playback-rate timing races where a note can briefly start at the wrong pitch.
const players: Record<number, AudioPlayer> = {};
let ready = false;
let playbackChain: Promise<void> = Promise.resolve();
let playbackRequest = 0;
const MIN_ST = Math.min(...TONE_SEMITONES);
const MAX_ST = Math.max(...TONE_SEMITONES);

export async function initSound(): Promise<void> {
  if (ready) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // non-fatal
  }
  for (const st of TONE_SEMITONES) {
    const player = createAudioPlayer(TONES[st]);
    player.shouldCorrectPitch = false;
    players[st] = player;
  }
  ready = true;
}

async function resetPlayersToStart(): Promise<void> {
  await Promise.all(
    Object.values(players).map(async (player) => {
      try {
        player.pause();
        await player.seekTo(0, 0, 0);
      } catch {
        // ignore transient playback errors
      }
    })
  );
}

async function playSemitoneQueued(st: number, request: number): Promise<void> {
  if (!ready || playbackRequest !== request) return;

  const pitch = Math.max(MIN_ST, Math.min(MAX_ST, st));
  const player = players[pitch];
  if (!player) return;

  await resetPlayersToStart();
  if (playbackRequest !== request) return;

  try {
    player.shouldCorrectPitch = false;
    player.play();
  } catch {
    // ignore transient playback errors
  }
}

function enqueuePlayback(st: number): void {
  const request = ++playbackRequest;
  playbackChain = playbackChain
    .catch(() => {
      // Keep later playback requests from being blocked by a rejected seek.
    })
    .then(() => playSemitoneQueued(st, request));
}

// Play the given chromatic pitch (semitone, MIDI-like: C4 = 48).
export function playSemitone(st: number): void {
  if (!ready) return;
  enqueuePlayback(st);
}
