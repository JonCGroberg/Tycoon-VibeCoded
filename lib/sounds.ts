// Shared sound effects for the game

export function playAchievementChime() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const notes = [698.46, 880, 1046.5, 1174.66]; // F5, A5, C6, D6 (Fmaj7, higher and brighter)
  const now = ctx.currentTime;
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; // Brighter than sine
    o.frequency.value = freq;
    g.gain.value = 0.11;
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now + i * 0.03); // slightly faster arpeggio
    g.gain.setValueAtTime(0.11, now + i * 0.03);
    g.gain.linearRampToValueAtTime(0, now + i * 0.03 + 0.18);
    o.stop(now + i * 0.03 + 0.18);
    o.onended = () => ctx.close();
  });
}

// Future: move these here too
export function playSuccessChime() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const notes = [220, 261.63, 329.63]; // A3, C4, E4 (A major chord, two octaves lower)
  const now = ctx.currentTime;
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; // Sine is softer/pleasant
    o.frequency.value = freq;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start(now + i * 0.04); // slight stagger for arpeggio
    g.gain.setValueAtTime(0.08, now + i * 0.04);
    g.gain.linearRampToValueAtTime(0, now + i * 0.04 + 0.22);
    o.stop(now + i * 0.04 + 0.22);
    o.onended = () => ctx.close();
  });
}

export function playErrorBeep() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = 220; // A2, much lower
  g.gain.value = 0.2; // much quieter
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + 0.15);
  o.onended = () => ctx.close();
}