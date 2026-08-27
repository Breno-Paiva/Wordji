// Sound effects — synthesized via the Web Audio API, no audio files/network
// requests so the game stays self-contained. Mirrors Chordji's audio.js in
// spirit: the one place that touches AudioContext, behind a small interface.

let audioCtx = null;
let muted = false;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, startOffset, duration, type, peakVolume) {
  if (muted) return;
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const now = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakVolume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

export function playClick() {
  playTone(440, 0, 0.06, "sine", 0.12);
}

export function playBlip() {
  playTone(300, 0, 0.05, "sine", 0.08);
}

export function playTick() {
  playTone(880, 0, 0.05, "square", 0.06);
}

export function playCorrect() {
  playTone(523.25, 0, 0.12, "sine", 0.2);
  playTone(659.25, 0.08, 0.12, "sine", 0.2);
  playTone(783.99, 0.16, 0.18, "sine", 0.2);
}

export function playWrong() {
  playTone(200, 0, 0.16, "sawtooth", 0.15);
  playTone(150, 0.1, 0.2, "sawtooth", 0.13);
}

export function playReveal() {
  playTone(300, 0, 0.15, "triangle", 0.14);
  playTone(220, 0.13, 0.18, "triangle", 0.13);
  playTone(150, 0.28, 0.3, "triangle", 0.12);
}

export function playTimesUp() {
  playTone(400, 0, 0.15, "triangle", 0.16);
  playTone(300, 0.12, 0.15, "triangle", 0.16);
  playTone(200, 0.24, 0.25, "triangle", 0.16);
}

export function playSkip() {
  playTone(500, 0, 0.08, "sine", 0.14);
  playTone(350, 0.05, 0.1, "sine", 0.12);
}
