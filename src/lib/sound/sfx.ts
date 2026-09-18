import { soundState } from './mute.svelte';

/** Every sound effect in the app is a synthesized Web Audio tone rather
 * than a sourced audio file — no binary assets to author or license, and
 * the footprint stays tiny. A shared AudioContext is created lazily (and
 * resumed) on first use so the very first tap/click satisfies browsers'
 * autoplay-needs-a-gesture policy. */
let ctx: AudioContext | undefined;

function getCtx(): AudioContext | undefined {
	if (typeof window === 'undefined') return undefined;
	const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!Ctor) return undefined;
	if (!ctx) ctx = new Ctor();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

interface ToneOpts {
	type?: OscillatorType;
	peakGain?: number;
	delayMs?: number;
}

function tone(freq: number, durationMs: number, opts: ToneOpts = {}): void {
	if (soundState.muted) return;
	const audio = getCtx();
	if (!audio) return;

	const { type = 'sine', peakGain = 0.15, delayMs = 0 } = opts;
	const start = audio.currentTime + delayMs / 1000;
	const stop = start + durationMs / 1000;

	const osc = audio.createOscillator();
	const gain = audio.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, start);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, stop);

	osc.connect(gain).connect(audio.destination);
	osc.start(start);
	osc.stop(stop + 0.02);
}

type Note = { freq: number; durationMs: number; delayMs: number } & ToneOpts;

function sequence(notes: Note[]): void {
	for (const n of notes) tone(n.freq, n.durationMs, n);
}

/** Tapping a palette icon to add a block. */
export function place(): void {
	tone(660, 70, { type: 'square', peakGain: 0.1 });
}

/** Tapping a placed block/pill to remove it. */
export function deleteBlock(): void {
	tone(280, 90, { type: 'triangle', peakGain: 0.1 });
}

/** Pressing the play/Run button. */
export function run(): void {
	sequence([
		{ freq: 440, durationMs: 70, delayMs: 0, type: 'square', peakGain: 0.12 },
		{ freq: 660, durationMs: 90, delayMs: 60, type: 'square', peakGain: 0.12 }
	]);
}

/** Light tick fired per movement command during playback. */
export function step(): void {
	tone(520, 40, { type: 'sine', peakGain: 0.05 });
}

/** A climb (stepUpRight/stepUpLeft, or the turtle jump). */
export function climb(): void {
	sequence([
		{ freq: 500, durationMs: 50, delayMs: 0, peakGain: 0.08 },
		{ freq: 700, durationMs: 60, delayMs: 40, peakGain: 0.08 }
	]);
}

/** Picking up a banana. */
export function collect(): void {
	sequence([
		{ freq: 880, durationMs: 70, delayMs: 0, peakGain: 0.12 },
		{ freq: 1175, durationMs: 90, delayMs: 60, peakGain: 0.12 }
	]);
}

/** Walking into a wall/rock. */
export function blocked(): void {
	tone(160, 140, { type: 'square', peakGain: 0.1 });
}

/** Falling into a pit or off a gap. */
export function fall(): void {
	sequence([
		{ freq: 500, durationMs: 90, delayMs: 0, type: 'sawtooth', peakGain: 0.08 },
		{ freq: 200, durationMs: 160, delayMs: 70, type: 'sawtooth', peakGain: 0.08 }
	]);
}

/** A procedure sensor firing. */
export function sensor(): void {
	sequence([
		{ freq: 784, durationMs: 90, delayMs: 0, peakGain: 0.1 },
		{ freq: 1047, durationMs: 120, delayMs: 90, peakGain: 0.1 }
	]);
}

/** Winning a level — a short ascending major arpeggio. */
export function win(): void {
	sequence([
		{ freq: 523, durationMs: 110, delayMs: 0, peakGain: 0.14 },
		{ freq: 659, durationMs: 110, delayMs: 100, peakGain: 0.14 },
		{ freq: 784, durationMs: 110, delayMs: 200, peakGain: 0.14 },
		{ freq: 1047, durationMs: 220, delayMs: 300, peakGain: 0.16 }
	]);
}

/** Losing a run — a short descending phrase. */
export function lose(): void {
	sequence([
		{ freq: 392, durationMs: 140, delayMs: 0, type: 'triangle', peakGain: 0.12 },
		{ freq: 330, durationMs: 140, delayMs: 120, type: 'triangle', peakGain: 0.12 },
		{ freq: 262, durationMs: 220, delayMs: 240, type: 'triangle', peakGain: 0.12 }
	]);
}

/** A roadmap node unlocking. */
export function unlock(): void {
	sequence([
		{ freq: 988, durationMs: 60, delayMs: 0, peakGain: 0.1 },
		{ freq: 1319, durationMs: 90, delayMs: 50, peakGain: 0.1 }
	]);
}

/** General, quiet navigation click (cards, nodes, back buttons). */
export function nav(): void {
	tone(600, 35, { type: 'sine', peakGain: 0.05 });
}
