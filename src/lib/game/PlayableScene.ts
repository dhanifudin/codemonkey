import type { Command } from '$lib/engine';

/** Contract both GridScene (top-down) and SideScene (side-view) implement,
 * so the Svelte layer can drive either one identically. `onCommand`, when
 * given, fires once per command as it's about to animate — callers use it
 * to fire sound effects in sync with the actual playback rather than
 * guessing at timing from outside. */
export interface PlayableScene {
	resetScene(): void;
	playCommands(commands: Command[], speedMultiplier?: number, onCommand?: (cmd: Command) => void): Promise<void>;
}
