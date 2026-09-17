<script lang="ts">
	import { goto } from '$app/navigation';
	import { run, type BlockProgram, type RunResult } from '$lib/engine';
	import { nextChallengeSlug } from '$lib/content';
	import PhaserGame, { type PhaserGameHandle } from '$lib/game/PhaserGame.svelte';
	import IconBlockStrip from '$lib/icon-blocks/IconBlockStrip.svelte';
	import { saveProgress } from '$lib/supabase/progress';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let challenge = $derived(data.challenge);

	let program = $state<BlockProgram>([]);
	let running = $state(false);
	let result = $state<RunResult | null>(null);
	let hintIndex = $state(0);
	let showHints = $state(false);
	let handle: PhaserGameHandle | undefined;

	const next = $derived(nextChallengeSlug(challenge.slug));
	const instruction = $derived(
		challenge.goal.type === 'reachTile' ? 'Get the monkey to the flag! 🚩' : 'Help the monkey collect every banana! 🍌'
	);

	function onGameReady(h: PhaserGameHandle) {
		handle = h;
	}

	function onProgramChange(p: BlockProgram) {
		program = p;
	}

	async function handleRun() {
		if (running || program.length === 0 || !handle) return;
		running = true;
		result = null;
		const outcome = run(challenge, program);
		await handle.playCommands(outcome.commands);
		result = outcome;
		running = false;
		if (outcome.outcome === 'win') {
			saveProgress(challenge.slug, outcome, program).catch((err) => console.error('saveProgress failed', err));
		}
	}

	function handleReset() {
		if (running) return;
		handle?.reset();
		result = null;
	}

	function revealHint() {
		showHints = true;
		hintIndex = Math.min(hintIndex + 1, challenge.hints.length - 1);
	}

	function goNext() {
		if (next) goto(`/play/${next}`);
		else goto('/');
	}
</script>

<svelte:head>
	<title>{challenge.title} · CodeMonkey Clone</title>
</svelte:head>

<div class="page">
	<header class="lesson-header">
		<a class="back-link" href="/">← Course map</a>
		<h1>{challenge.title}</h1>
		<p class="instruction">{instruction}</p>
	</header>

	<div class="lesson-body">
		<section class="game-panel" aria-label="Game">
			{#key challenge.slug}
				<PhaserGame {challenge} onReady={onGameReady} />
			{/key}

			<div class="controls">
				<button class="run" disabled={running || program.length === 0} onclick={handleRun}>
					{running ? 'Running…' : '▶ Run'}
				</button>
				<button class="reset" disabled={running} onclick={handleReset}>⟲ Reset</button>
				<button class="hint" disabled={running} onclick={revealHint}>💡 Hint</button>
			</div>

			{#if showHints}
				<p class="hint-text">{challenge.hints[hintIndex]}</p>
			{/if}

			{#if result}
				<div class="result-banner" class:win={result.outcome === 'win'} class:lose={result.outcome === 'lose'}>
					{#if result.outcome === 'win'}
						<p>You did it! {'⭐'.repeat(result.stars)}</p>
						<button onclick={goNext}>{next ? 'Next challenge →' : 'Back to course map'}</button>
					{:else}
						<p>
							{#if result.reason === 'blocked'}
								Oops, the monkey bumped into something. Try again!
							{:else if result.reason === 'fell'}
								Oh no, the monkey fell in a pit! Try jumping over it.
							{:else if result.reason === 'step-limit'}
								That program runs forever — check your repeat block.
							{:else}
								Almost! The monkey didn't reach the goal yet.
							{/if}
						</p>
					{/if}
				</div>
			{/if}
		</section>

		<section class="editor-panel" aria-label="Block editor">
			<h2>Build your program</h2>
			{#key challenge.slug}
				<IconBlockStrip allowedBlocks={challenge.allowedBlocks} disabled={running} onChange={onProgramChange} />
			{/key}
		</section>
	</div>
</div>

<style>
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 1rem 1rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.lesson-header {
		background: linear-gradient(135deg, #eafaf0, #fdf6e3);
		border: 2px solid #cdecd6;
		border-radius: 16px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.back-link {
		align-self: flex-start;
		color: #16a34a;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
	}
	h1 {
		margin: 0;
		color: #14532d;
	}
	.instruction {
		margin: 0;
		font-size: 1.1rem;
		color: #3f6212;
		font-weight: 600;
	}

	.lesson-body {
		display: grid;
		grid-template-columns: minmax(0, 480px) 1fr;
		gap: 1.5rem;
		align-items: start;
	}
	@media (max-width: 800px) {
		.lesson-body {
			grid-template-columns: 1fr;
		}
	}

	.game-panel,
	.editor-panel {
		background: #ffffff;
		border: 2px solid #e2e8f0;
		border-radius: 16px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		/* Grid items default to min-width:auto, which lets a fixed-width
		 * child (the Phaser canvas) force the track wider than the
		 * viewport. Overriding it lets max-width:100% below actually take
		 * effect on narrow screens. */
		min-width: 0;
	}
	.editor-panel h2 {
		margin: 0;
		font-size: 1.05rem;
		color: #14532d;
	}

	.controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.controls button {
		min-height: 52px;
		padding: 0 1.4rem;
		border-radius: 12px;
		border: none;
		font-size: 1.15rem;
		font-weight: 700;
		cursor: pointer;
	}
	.run {
		background: #16a34a;
		color: white;
		box-shadow: 0 3px 0 #14532d;
	}
	.reset {
		background: #e2e8f0;
	}
	.hint {
		background: #fde68a;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.hint-text {
		background: #fefce8;
		border: 2px solid #fde68a;
		border-radius: 10px;
		padding: 0.75rem 1rem;
		margin: 0;
	}
	.result-banner {
		padding: 1rem;
		border-radius: 12px;
		text-align: center;
		font-size: 1.2rem;
	}
	.result-banner.win {
		background: #dcfce7;
		border: 2px solid #16a34a;
	}
	.result-banner.lose {
		background: #fee2e2;
		border: 2px solid #dc2626;
	}
	.result-banner button {
		margin-top: 0.5rem;
		min-height: 48px;
		padding: 0 1.25rem;
		border-radius: 10px;
		border: none;
		background: #16a34a;
		color: white;
		font-weight: 700;
		cursor: pointer;
	}
</style>
