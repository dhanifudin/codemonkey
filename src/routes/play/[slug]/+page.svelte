<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { asset } from '$app/paths';
	import { run, type BlockProgram, type Command, type Program, type RunResult, type Trigger } from '$lib/engine';
	import { courses, nextInCourse } from '$lib/content';
	import PhaserGame, { type PhaserGameHandle } from '$lib/game/PhaserGame.svelte';
	import BlockStrip from '$lib/icon-blocks/BlockStrip.svelte';
	import PlayHeader from '$lib/ui/PlayHeader.svelte';
	import ResultBanner from '$lib/ui/ResultBanner.svelte';
	import HintButton from '$lib/ui/HintButton.svelte';
	import IconButton from '$lib/ui/IconButton.svelte';
	import { saveProgress } from '$lib/supabase/progress';
	import * as sfx from '$lib/sound/sfx';
	import type { PageProps } from './$types';

	const LAST_PLAYED_KEY = 'codemonkey:last-played';

	let { data }: PageProps = $props();
	let challenge = $derived(data.challenge);
	let course = $derived(data.course);
	let movement = $derived<'turtle' | 'arrows'>(challenge.movement === 'arrows' ? 'arrows' : 'turtle');
	// Only courses 2/3 cap the strip and show dashed placeholders — course
	// 1's turtle levels keep their original uncapped programs even though
	// the schema fills in a default maxSlots for every challenge.
	let stripMaxSlots = $derived(movement === 'arrows' ? challenge.maxSlots : undefined);

	let mainProgram = $state<BlockProgram>([]);
	let procPrograms = $state<Partial<Record<Trigger, BlockProgram>>>({});
	let running = $state(false);
	let result = $state<RunResult | null>(null);
	let handle: PhaserGameHandle | undefined;

	const program = $derived<BlockProgram | Program>(
		(challenge.procedures?.length ?? 0) > 0 ? { main: mainProgram, procedures: procPrograms } : mainProgram
	);
	const programEmpty = $derived(mainProgram.length === 0);

	$effect(() => {
		// Reset per-challenge state whenever the level changes — otherwise
		// a stale win/lose banner or leftover program briefly reappears on
		// the next level (this route component is reused across
		// navigations, not remounted).
		void challenge.slug;
		mainProgram = [];
		procPrograms = {};
		result = null;
		running = false;
	});

	const next = $derived(nextInCourse(challenge.slug));
	const backHref = $derived(`/course/${course.id}`);
	const courseNumber = $derived(courses.findIndex((c) => c.id === course.id) + 1);
	const levelBadge = $derived(`${courseNumber}-${data.levelNumber}`);
	const instruction = $derived(
		challenge.goal.type === 'reachTile' ? 'Get the monkey to the goal! 🏁' : 'Help the monkey collect every banana! 🍌'
	);

	const SENSOR_ICON: Record<Trigger, string> = {
		'blue-triangle': '/assets/sensor-blue-triangle.svg',
		'green-circle': '/assets/sensor-green-circle.svg',
		'red-square': '/assets/sensor-red-square.svg'
	};
	const SENSOR_LABEL: Record<Trigger, string> = {
		'blue-triangle': 'Blue triangle sensor',
		'green-circle': 'Green circle sensor',
		'red-square': 'Red square sensor'
	};

	onMount(() => {
		try {
			localStorage.setItem(LAST_PLAYED_KEY, challenge.slug);
		} catch {
			// Private browsing / blocked storage — the dashboard just falls
			// back to its default course.
		}
	});

	function onGameReady(h: PhaserGameHandle) {
		handle = h;
	}

	function onProcChange(trigger: Trigger, p: BlockProgram) {
		procPrograms = { ...procPrograms, [trigger]: p };
	}

	function playCommandSound(cmd: Command) {
		switch (cmd.type) {
			case 'move':
				sfx.step();
				break;
			case 'jump':
			case 'jumpUp':
				sfx.climb();
				break;
			case 'collect':
				sfx.collect();
				break;
			case 'blocked':
				sfx.blocked();
				break;
			case 'fall':
				sfx.fall();
				break;
			case 'procEnter':
				sfx.sensor();
				break;
		}
	}

	async function handleRun() {
		if (running || programEmpty || !handle) return;
		sfx.run();
		running = true;
		result = null;
		const outcome = run(challenge, program);
		await handle.playCommands(outcome.commands, 1, playCommandSound);
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

	function goNext() {
		if (next) goto(`/play/${next}`);
		else goto(backHref);
	}
</script>

<svelte:head>
	<title>{challenge.title} · CodeMonkey Clone</title>
</svelte:head>

<div class="play-page">
	<PlayHeader {backHref} {levelBadge} title={challenge.title} {instruction} />

	<div class="stage">
		{#key challenge.slug}
			<PhaserGame {challenge} theme={course.theme} onReady={onGameReady} />
		{/key}
		{#if result}
			<ResultBanner {result} {movement} hasNext={!!next} onNext={goNext} onRetry={handleReset} />
		{/if}
	</div>

	<div class="hud">
		{#each challenge.procedures ?? [] as proc (proc.trigger)}
			<div class="proc-strip">
				<img class="proc-icon" src={asset(SENSOR_ICON[proc.trigger])} alt={SENSOR_LABEL[proc.trigger]} />
				{#key challenge.slug}
					<BlockStrip
						allowedBlocks={challenge.allowedBlocks}
						maxSlots={proc.maxSlots}
						disabled={running}
						onChange={(p) => onProcChange(proc.trigger, p)}
					/>
				{/key}
			</div>
		{/each}

		<div class="main-row">
			<div class="main-strip">
				{#key challenge.slug}
					<BlockStrip
						allowedBlocks={challenge.allowedBlocks}
						maxSlots={stripMaxSlots}
						disabled={running}
						onChange={(p) => (mainProgram = p)}
					/>
				{/key}
			</div>
			<div class="side-controls">
				<IconButton icon="/assets/icon-reset.svg" label="Reset" onclick={handleReset} disabled={running} />
				<button class="play-btn" disabled={running || programEmpty} onclick={handleRun} aria-label="Run program">▶</button>
				<HintButton hints={challenge.hints} disabled={running} />
			</div>
		</div>
	</div>
</div>

<style>
	.play-page {
		max-width: 640px;
		margin: 0 auto;
		padding-bottom: var(--space-6);
	}
	.stage {
		position: relative;
		margin-top: var(--space-2);
	}
	.stage :global(.phaser-container) {
		width: 100%;
		border-radius: 0;
	}
	.hud {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3);
		border-radius: 0 0 var(--radius-lg) var(--radius-lg);
		background: linear-gradient(180deg, rgba(20, 83, 45, 0.06), rgba(20, 83, 45, 0.14));
	}
	.proc-strip {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2);
		border-radius: var(--radius-md);
		background: rgba(255, 255, 255, 0.35);
	}
	.proc-icon {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}
	.main-row {
		display: flex;
		align-items: stretch;
		gap: var(--space-3);
	}
	.main-strip {
		flex: 1;
		min-width: 0;
	}
	.side-controls {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
	}
	.play-btn {
		width: 64px;
		height: 64px;
		border-radius: var(--radius-lg);
		border: none;
		background: var(--green-600);
		color: white;
		font-size: 1.6rem;
		box-shadow: var(--shadow-btn);
		cursor: pointer;
	}
	.play-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
