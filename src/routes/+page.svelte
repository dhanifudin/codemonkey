<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { course } from '$lib/content';
	import { loadProgress } from '$lib/supabase/progress';

	let stars = $state<Record<string, number>>({});

	onMount(async () => {
		stars = await loadProgress();
	});

	function starsFor(slug: string): number {
		return stars[slug] ?? 0;
	}
</script>

<svelte:head>
	<title>CodeMonkey Clone</title>
</svelte:head>

<main>
	<div class="hero">
		<img src={asset('/assets/monkey.svg')} alt="" class="hero-monkey" />
		<div>
			<h1>Coding Adventure</h1>
			<p>Pick a challenge to start coding!</p>
		</div>
	</div>

	<ol class="course-map">
		{#each course as challenge, i (challenge.slug)}
			{@const stars = starsFor(challenge.slug)}
			<li>
				<a href="/play/{challenge.slug}">
					<span class="num">{i + 1}</span>
					<span class="title">{challenge.title}</span>
					<span class="stars" aria-label="{stars} of 3 stars">
						{#each [0, 1, 2] as slot (slot)}
							<span class:filled={slot < stars}>★</span>
						{/each}
					</span>
				</a>
			</li>
		{/each}
	</ol>
</main>

<style>
	main {
		max-width: 520px;
		margin: 0 auto;
		padding: 1.5rem 1rem 2.5rem;
	}
	.hero {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.hero-monkey {
		width: 64px;
		height: 64px;
	}
	h1 {
		margin: 0;
		color: #14532d;
	}
	.hero p {
		margin: 0.15rem 0 0;
		color: #3f6212;
	}
	.course-map {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.course-map a {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 14px;
		background: #dcfce7;
		border: 2px solid #16a34a;
		text-decoration: none;
		color: #14532d;
		font-weight: 700;
		font-size: 1.1rem;
		min-height: 56px;
		box-shadow: 0 2px 0 #a7e3b8;
	}
	.num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border-radius: 50%;
		background: #16a34a;
		color: white;
		font-size: 1rem;
	}
	.title {
		flex: 1;
	}
	.stars {
		display: flex;
		gap: 0.1rem;
		font-size: 1.1rem;
		color: #d1d5db;
	}
	.stars .filled {
		color: #facc15;
	}
</style>
