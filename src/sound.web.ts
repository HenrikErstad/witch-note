// Web build: synthesize tones with the Web Audio API so pitch is correct.
// (HTMLAudioElement playbackRate preserves pitch in browsers, which would make
// the rate-shifting approach used on native sound wrong on the web.)

let ctx: any = null;
type ActiveTone = {
  master: any;
  oscillators: any[];
  cleanup: ReturnType<typeof setTimeout> | null;
};

let activeTone: ActiveTone | null = null;

function ensureCtx(): any {
  const w: any = globalThis;
  if (!ctx) {
    const AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume?.();
  return ctx;
}

export async function initSound(): Promise<void> {
  const w: any = globalThis;
  try {
    ensureCtx();
    // Browsers block audio until a user gesture — resume on the first one.
    const resume = () => ctx?.resume?.();
    w.addEventListener?.('pointerdown', resume, { once: true });
    w.addEventListener?.('keydown', resume, { once: true });
  } catch {
    // non-fatal
  }
}

// Same harmonic recipe as the native synthesized tone.
const HARMONICS = [
  { mult: 1, gain: 1 },
  { mult: 2, gain: 0.45 },
  { mult: 3, gain: 0.22 },
  { mult: 4, gain: 0.12 },
];
const TOTAL = HARMONICS.reduce((sum, h) => sum + h.gain, 0);

function disconnectTone(tone: ActiveTone): void {
  if (tone.cleanup) clearTimeout(tone.cleanup);
  for (const osc of tone.oscillators) {
    try {
      osc.disconnect();
    } catch {
      // ignore already-disconnected nodes
    }
  }
  try {
    tone.master.disconnect();
  } catch {
    // ignore already-disconnected nodes
  }
}

function stopActiveTone(ac: any): number {
  const now = ac.currentTime;
  if (!activeTone) return now;

  const tone = activeTone;
  activeTone = null;
  const stopAt = now + 0.012;
  try {
    tone.master.gain.cancelScheduledValues(now);
    tone.master.gain.setValueAtTime(
      Math.max(tone.master.gain.value || 0.0001, 0.0001),
      now
    );
    tone.master.gain.exponentialRampToValueAtTime(0.0001, stopAt);
  } catch {
    // ignore transient audio node errors
  }
  for (const osc of tone.oscillators) {
    try {
      osc.stop(stopAt + 0.01);
    } catch {
      // ignore already-stopped oscillators
    }
  }
  tone.cleanup = setTimeout(() => disconnectTone(tone), 80);
  return stopAt;
}

// Play a chromatic pitch (semitone, MIDI-like with C4 = 48, so A4 = 57 = 440 Hz).
export function playSemitone(st: number): void {
  const ac = ensureCtx();
  if (!ac) return;
  try {
    const startAt = stopActiveTone(ac);
    const freq = 440 * Math.pow(2, (st - 57) / 12);
    const dur = 1.1;

    const master = ac.createGain();
    master.connect(ac.destination);
    master.gain.setValueAtTime(0.0001, startAt);
    master.gain.linearRampToValueAtTime(0.85, startAt + 0.005); // short attack
    master.gain.exponentialRampToValueAtTime(0.0001, startAt + dur); // decay

    const tone: ActiveTone = { master, oscillators: [], cleanup: null };
    activeTone = tone;

    for (const h of HARMONICS) {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * h.mult;
      const g = ac.createGain();
      g.gain.value = h.gain / TOTAL;
      osc.connect(g);
      g.connect(master);
      tone.oscillators.push(osc);
      osc.start(startAt);
      osc.stop(startAt + dur + 0.05);
    }
    tone.cleanup = setTimeout(() => {
      if (activeTone === tone) activeTone = null;
      disconnectTone(tone);
    }, (dur + 0.1) * 1000);
  } catch {
    // ignore transient audio errors
  }
}
