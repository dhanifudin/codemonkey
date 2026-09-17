<script lang="ts" module>
	export interface PhaserGameHandle {
		playCommands(commands: import('$lib/engine').Command[], speedMultiplier?: number): Promise<void>;
		reset(): void;
	}
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Phaser from 'phaser';
	import type { Challenge } from '$lib/engine';
	import GridScene from './GridScene';
	import { EventBus } from './EventBus';

	interface Props {
		challenge: Challenge;
		onReady?: (handle: PhaserGameHandle) => void;
	}

	let { challenge, onReady }: Props = $props();

	let container: HTMLDivElement;
	let game: Phaser.Game | undefined;
	let scene: GridScene | undefined;

	function handleSceneReady(readyScene: GridScene) {
		scene = readyScene;
		onReady?.({
			playCommands: (commands, speedMultiplier) => readyScene.playCommands(commands, speedMultiplier),
			reset: () => readyScene.resetScene()
		});
	}

	onMount(() => {
		EventBus.on('scene-ready', handleSceneReady);

		game = new Phaser.Game({
			type: Phaser.AUTO,
			width: 480,
			height: 360,
			parent: container,
			backgroundColor: '#ffffff',
			// Low-end Chromebook/tablet friendliness: no physics engine needed —
			// grid movement is hand-tweened rather than simulated.
			scene: [GridScene]
		});
		game.scene.start('GridScene', { challenge });
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
