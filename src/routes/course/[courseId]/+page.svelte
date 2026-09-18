<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { loadProgress } from '$lib/supabase/progress';
	import { firstIncomplete, isUnlocked, type ProgressMap } from '$lib/progress/unlock';
	import IconButton from '$lib/ui/IconButton.svelte';
	import * as sfx from '$lib/sound/sfx';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let course = $derived(data.course);

	let progress = $state<ProgressMap>({});
	let loaded = $state(false);

	onMount(async () => {
		progress = await loadProgress();
		loaded = true;
	});

	const THEME_GRADIENT: Record<string, string> = {
		'jungle-night': 'linear-gradient(180deg, #1b1140 0%, #3d2b66 60%, #241a42 100%)',
		'beach-day': 'linear-gradient(180deg, #7ec8f2 0%, #cfeffb 70%, #e8f8ff 100%)',
		'jungle-day': 'linear-gradient(180deg, #bfe6c8 0%, #eafaf0 70%, #f4fbf0 100%)'
	};

	/** A gentle winding S-curve through however many nodes a course has —
	 * simpler than hand-placing percentages per level and still reads as a
	 * path rather than a straight list. */
	function nodePos(i: number, total: number): { x: number; y: number } {
		const t = total <= 1 ? 0 : i / (total - 1);
		const x = 50 + 32 * Math.sin(i * 1.35);
		const y = 12 + t * 76;
		return { x, y };
	}

	const nodes = $derived(course.challenges.map((c, i) => ({ challenge: c, index: i, pos: nodePos(i, course.challenges.length) })));
	const pathD = $derived(
		nodes.length > 0
			? 'M ' + nodes.map((n) => `${n.pos.x} ${n.pos.y}`).join(' L ')
			: ''
	);
	const currentSlug = $derived(loaded ? firstIncomplete(course, progress) : undefined);
	const endPos = $derived(nodes.length > 0 ? { x: nodes[nodes.length - 1].pos.x, y: nodes[nodes.length - 1].pos.y - 8 } : { x: 50, y: 5 });

</script>

<svelte:head>
	<title>{course.title} · CodeMonkey Clone</title>
</svelte:head>

<div class="panorama" style="background:{THEME_GRADIENT[course.theme] ?? THEME_GRADIENT['jungle-day']}">
	<div class="home-btn">
		<IconButton icon="/assets/icon-home.svg" label="Back to courses" href="/" onclick={() => sfx.nav()} />
	</div>
	<h1>{course.subtitle || course.title}</h1>

	<img class="deco palm" src={asset('/assets/palm.svg')} alt="" style="left:4%; top:8%; width:60px;" />
	<img class="deco palm" src={asset('/assets/palm.svg')} alt="" style="right:6%; top:14%; width:80px;" />

	<svg class="path-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
		{#if pathD}
			<path d={pathD} fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 2" vector-effect="non-scaling-stroke" />
		{/if}
	</svg>

	<div class="end-star" style="left:{endPos.x}%; top:{endPos.y}%">⭐</div>

	{#each nodes as node (node.challenge.slug)}
		{@const stars = progress[node.challenge.slug] ?? 0}
		{@const unlocked = !loaded || isUnlocked(course, node.index, progress)}
		{@const isCurrent = loaded && node.challenge.slug === currentSlug && stars === 0}
		<div class="node-wrap" style="left:{node.pos.x}%; top:{node.pos.y}%">
			{#if stars > 0}
				<div class="star-fan" aria-hidden="true">
					{#each { length: 3 } as _, i (i)}
						<span class:filled={i < stars}>★</span>
					{/each}
				</div>
			{/if}
			{#if unlocked}
				<a
					class="node"
					class:current={isCurrent}
					href="/play/{node.challenge.slug}"
					onclick={() => sfx.nav()}
					aria-label="{node.challenge.title} — {stars} of 3 stars"
				>
					{#if isCurrent}
						<img class="node-avatar" src={asset('/assets/monkey.svg')} alt="" />
					{:else}
						{node.index + 1}
					{/if}
				</a>
			{:else}
				<div class="node locked" aria-label="{node.challenge.title} — locked">
					<img src={asset('/assets/padlock.svg')} alt="" />
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.panorama {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		padding: 1rem;
		color: white;
	}
	h1 {
		text-align: center;
		margin: 0.25rem 0 0;
		font-size: 1.3rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
	}
	.home-btn {
		position: absolute;
		top: 1rem;
		left: 1rem;
		z-index: 5;
	}
	.deco {
		position: absolute;
		opacity: 0.85;
		pointer-events: none;
	}
	.path-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.end-star {
		position: absolute;
		transform: translate(-50%, -50%);
		font-size: 2.2rem;
		filter: drop-shadow(0 0 6px rgba(255, 220, 100, 0.9));
	}
	.node-wrap {
		position: absolute;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}
	.star-fan {
		display: flex;
		gap: 0.05rem;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.35);
	}
	.star-fan .filled {
		color: var(--amber-400);
	}
	.node {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: #ffffff;
		color: var(--green-900);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--fw-black);
		font-size: 1.2rem;
		text-decoration: none;
		border: 3px solid var(--green-600);
		box-shadow: 0 3px 0 rgba(0, 0, 0, 0.25);
	}
	.node.current {
		border-color: var(--amber-300);
		border-width: 4px;
		box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.4);
	}
	.node-avatar {
		width: 70%;
		height: 70%;
		object-fit: contain;
	}
	.node.locked {
		background: rgba(20, 20, 30, 0.75);
		border-color: rgba(255, 255, 255, 0.25);
		cursor: default;
	}
	.node.locked img {
		width: 55%;
		height: 55%;
	}
</style>
