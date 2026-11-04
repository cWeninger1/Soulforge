export const defaultSettings = {
  master: 0.45,
  music: 0.3,
  effects: 0.65,
  quality: "High" as "High" | "Low",
  sensitivity: 1,
};
export type Settings = typeof defaultSettings;
export type Cue = "strike" | "cast" | "hurt" | "loot" | "ui" | "boss";
export function soundscape(canvas: HTMLCanvasElement, settings: Settings) {
  let context: AudioContext | undefined;
  let step = 0;
  let beat = 0;
  function tone(
    frequency: number,
    duration: number,
    gain: number,
    type: OscillatorType = "sine",
  ) {
    if (!context || context.state !== "running" || gain <= 0) return;
    const oscillator = context.createOscillator(),
      volume = context.createGain();
    const now = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, gain * settings.master * 0.14),
      now + 0.02,
    );
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(volume).connect(context.destination);
    oscillator.onended = () => {
      oscillator.disconnect();
      volume.disconnect();
    };
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
  function unlock() {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
    if (!beat)
      beat = window.setInterval(() => {
        if (document.hidden) return;
        const note = [146.83, 220, 293.66, 174.61, 261.63, 196][step++ % 6];
        tone(note, 1.8, settings.music * 0.35);
        tone(note / 2, 2.1, settings.music * 0.3);
      }, 2200);
  }
  const click = (e: PointerEvent) => {
    if (e.target === canvas || (e.target as HTMLElement).closest("button")) {
      unlock();
      if (e.target !== canvas) cue("ui");
    }
  };
  function cue(c: Cue) {
    const freq = {
      strike: 125,
      cast: 660,
      hurt: 92,
      loot: 880,
      ui: 440,
      boss: 65,
    }[c];
    tone(
      freq,
      c === "boss" ? 0.55 : 0.16,
      settings.effects,
      c === "strike" || c === "hurt" ? "triangle" : "sine",
    );
  }
  window.addEventListener("pointerdown", click);
  return {
    cue,
    dispose() {
      window.removeEventListener("pointerdown", click);
      window.clearInterval(beat);
      if (context) void context.close().catch(() => {});
    },
  };
}
