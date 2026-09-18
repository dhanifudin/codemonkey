<script lang="ts" module>
	export interface PhaserGameHandle {
		playCommands(
			commands: import('$lib/engine').Command[],
			speedMultiplier?: number,
			onCommand?: (cmd: import('$lib/engine').Command) => void
		): Promise<void>;
		reset(): void;
	}
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Phaser from 'phaser';
	import type { Challenge } from '$lib/engine';
	import type { Theme } from '$lib/content';
	import GridScene from './GridScene';
	import SideScene from './SideScene';
	import { EventBus } from './EventBus';
	import type { PlayableScene } from './PlayableScene';

	interface Props {
		challenge: Challenge;
		theme?: Theme;
		onReady?: (handle: PhaserGameHandle) => void;
	}

	let { challenge, theme, onReady }: Props = $props();

	let container: HTMLDivElement;
	let game: Phaser.Game | undefined;

	function handleSceneReady(readyScene: PlayableScene) {
		onReady?.({
			playCommands: (commands, speedMultiplier, onCommand) => readyScene.playCommands(commands, speedMultiplier, onCommand),
			reset: () => readyScene.resetScene()
		});
	}

	onMount(() => {
		EventBus.on('scene-ready', handleSceneReady);

		const sceneKey = challenge.view === 'side' ? 'SideScene' : 'GridScene';
		game = new Phaser.Game({
			type: Phaser.AUTO,
			width: 480,
			height: 360,
			parent: container,
			backgroundColor: '#ffffff',
			// Low-end Chromebook/tablet friendliness: no physics engine needed —
			// grid movement is hand-tweened rather than simulated.
			//
			// No `scene:` list here — Phaser auto-starts the first entry in
			// that array on boot, which would run GridScene with no
			// challenge data whenever a side-view level loads. Registering
			// both scenes with autoStart=false and starting only the one
			// this challenge needs avoids that.
			scene: []
		});
		game.scene.add('GridScene', GridScene, false);
		game.scene.add('SideScene', SideScene, false);
		game.scene.start(sceneKey, { challenge, theme });
	});

	onDestroy(() => {
		EventBus.off('scene-ready', handleSceneReady);
		game?.destroy(true);
	});
</script>

<div bind:this={container} class="phaser-container" role="presentation"></div>

<style>
	.phaser-container {
		width: 480px;
		max-width: 100%;
		aspect-ratio: 4 / 3;
		margin: 0 auto;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.phaser-container :global(canvas) {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
