import type { SettingsState } from "../types/messages";

export type GameSound =
  | "success"
  | "turn"
  | "play"
  | "pass"
  | "trick"
  | "roundEnd"
  | "moon"
  | "error";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioContext ||= new AC();
  return audioContext;
}

export function playTone(settings: SettingsState, freq = 520, duration = 0.08, type: OscillatorType = "sine", gainValue = 0.035): void {
  if (!settings.soundEnabled || settings.soundVolume <= 0) return;
  try {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
      return;
    }

    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, Math.min(1, gainValue * settings.soundVolume * 2)), context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + duration + 0.02);
  } catch {
    // Browsers may block audio before user interaction; gameplay continues silently.
  }
}

export function playGameSound(kind: GameSound, settings: SettingsState): void {
  if (!settings.soundEnabled) return;
  if (kind === "play") playTone(settings, 560, 0.075, "triangle", 0.035);
  else if (kind === "pass") {
    playTone(settings, 430, 0.07, "sine", 0.026);
    window.setTimeout(() => playTone(settings, 620, 0.08, "sine", 0.026), 75);
  } else if (kind === "turn") {
    playTone(settings, 760, 0.08, "sine", 0.025);
    window.setTimeout(() => playTone(settings, 980, 0.09, "sine", 0.022), 90);
  } else if (kind === "trick") {
    playTone(settings, 330, 0.11, "triangle", 0.032);
    window.setTimeout(() => playTone(settings, 494, 0.12, "triangle", 0.03), 110);
  } else if (kind === "roundEnd" || kind === "success") {
    playTone(settings, 622, 0.09, "sine", 0.032);
    window.setTimeout(() => playTone(settings, 830, 0.1, "sine", 0.028), 90);
  } else if (kind === "moon") {
    playTone(settings, 523, 0.14, "sine", 0.04);
    window.setTimeout(() => playTone(settings, 659, 0.14, "sine", 0.04), 150);
    window.setTimeout(() => playTone(settings, 784, 0.22, "sine", 0.04), 310);
  } else if (kind === "error") {
    playTone(settings, 220, 0.12, "sawtooth", 0.02);
  }
}

export function playInteractionSound(kind: string, settings: SettingsState): void {
  if (!settings.soundEnabled || !settings.interactionSoundEnabled) return;
  if (kind === "flower") {
    playTone(settings, 660, 0.07, "sine", 0.024);
    window.setTimeout(() => playTone(settings, 880, 0.09, "sine", 0.022), 70);
  } else if (kind === "tomato") {
    playTone(settings, 180, 0.08, "triangle", 0.03);
    window.setTimeout(() => playTone(settings, 120, 0.08, "sawtooth", 0.018), 75);
  } else if (kind === "applause") {
    playTone(settings, 520, 0.045, "triangle", 0.02);
    window.setTimeout(() => playTone(settings, 560, 0.045, "triangle", 0.018), 70);
  } else {
    playTone(settings, 720, 0.06, "sine", 0.018);
  }
}
