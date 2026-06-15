// Web build: synthesize tones with the Web Audio API so pitch is correct.
// (HTMLAudioElement playbackRate preserves pitch in browsers, which would make
// the rate-shifting approach used on native sound wrong on the web.)

let ctx: any = null;

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

// Play a chromatic pitch (semitone, MIDI-like with C4 = 48, so A4 = 57 = 440 Hz).
export function playSemitone(st: number): void {
  const ac = ensureCtx();
  if (!ac) return;
  try {
    const freq = 440 * Math.pow(2, (st - 57) / 12);
    const now = ac.currentTime;
    const dur = 1.1;

    const master = ac.createGain();
    master.connect(ac.destination);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.85, now + 0.005); // short attack
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur); // decay

    for (const h of HARMONICS) {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * h.mult;
      const g = ac.createGain();
      g.gain.value = h.gain / TOTAL;
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    }
  } catch {
    // ignore transient audio errors
  }
}
