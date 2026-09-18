<script lang="ts">
	import { onMount } from 'svelte';
	import { asset } from '$app/paths';
	import { courses, findChallenge, type CourseMeta } from '$lib/content';
	import { loadProgress } from '$lib/supabase/progress';
	import { coursePercent, firstIncomplete, type ProgressMap } from '$lib/progress/unlock';
	import * as sfx from '$lib/sound/sfx';

	const LAST_PLAYED_KEY = 'codemonkey:last-played';
	const RIBBON_LABEL: Record<CourseMeta['ribbon'], string> = {
		'block-coding': 'Block Coding',
		'text-coding': 'Text Coding',
		creativity: 'Creativity'
	};
	const DIFFICULTY_LABEL: Record<CourseMeta['difficulty'], string> = { novice: 'Novice', beginner: 'Beginner' };

	let progress = $state<ProgressMap>({});
	let currentCourse = $state<CourseMeta>(courses[0]);

	onMount(async () => {
		progress = await loadProgress();
		try {
			const lastSlug = localStorage.getItem(LAST_PLAYED_KEY);
			const found = lastSlug ? findChallenge(lastSlug) : undefined;
			if (found) currentCourse = found.course;
		} catch {
			// Private browsing / blocked storage — stick with the default course.
		}
	});

	const overallPercent = $derived.by(() => {
		const playable = courses.filter((c) => !c.comingSoon);
		if (playable.length === 0) return 0;
		const total = playable.reduce((sum, c) => sum + coursePercent(c, progress), 0);
		return Math.round(total / playable.length);
	});
	const continueSlug = $derived(firstIncomplete(currentCourse, progress));
	const ringOffset = $derived(2 * Math.PI * 26 * (1 - overallPercent / 100));
</script>

<svelte:head>
	<title>CodeMonkey Clone</title>
</svelte:head>

<div class="app">
	<nav class="sidebar" aria-label="Main navigation">
		<div class="brand">
			<img src={asset('/assets/monkey.svg')} alt="" />
			<span>CodeMonkey</span>
		</div>
		<a class="nav-item active" href="/" onclick={() => sfx.nav()}>Courses</a>
		<span class="nav-item disabled" aria-disabled="true">My Creations</span>
		<span class="nav-item disabled" aria-disabled="true">Discover</span>
		<span class="nav-item disabled help" aria-disabled="true">Help Center</span>
	</nav>

	<main>
		<header class="welcome-banner">
			<img class="welcome-monkey" src={asset('/assets/monkey.svg')} alt="" />
			<div class="welcome-text">
				<h1>Welcome!</h1>
				<p>Pick up where you left off, or start a new course.</p>
			</div>

			<div class="ring-wrap" aria-label="{overallPercent}% overall progress">
				<svg viewBox="0 0 60 60">
					<circle cx="30" cy="30" r="26" fill="none" stroke="#ffffff55" stroke-width="6" />
					<circle
						cx="30"
						cy="30"
						r="26"
						fill="none"
						stroke="var(--amber-400)"
						stroke-width="6"
						stroke-linecap="round"
						stroke-dasharray={2 * Math.PI * 26}
						stroke-dashoffset={ringOffset}
						transform="rotate(-90 30 30)"
					/>
				</svg>
				<span class="ring-label">{overallPercent}%</span>
			</div>

			<div class="continue-block">
				<span class="continue-label">Current course</span>
				<strong>{currentCourse.title}</strong>
				<a
					class="continue-btn"
					href="/play/{continueSlug ?? currentCourse.challenges[0]?.slug ?? ''}"
					onclick={() => sfx.nav()}
				>
					▶ Continue coding
				</a>
			</div>
		</header>

		<section class="filter-bar" aria-label="Filters">
			<span class="filter-label">Filter</span>
			<span class="filter-label muted">Search</span>
			<div class="filter-fields">
				<label>Level<select disabled><option>All</option></select></label>
				<label>Category<select disabled><option>Main Courses</option></select></label>
				<label>Topic<select disabled><option>All</option></select></label>
			</div>
		</section>

		<section aria-label="Courses">
			<h2 class="section-title">Courses</h2>
			<div class="card-grid">
				{#each courses as course (course.id)}
					{@const pct = coursePercent(course, progress)}
					<a
						class="card"
						class:locked={course.comingSoon}
						href={course.comingSoon ? undefined : `/course/${course.id}`}
						onclick={() => sfx.nav()}
						aria-disabled={course.comingSoon}
					>
						<div class="card-cover">
							<span class="ribbon">{RIBBON_LABEL[course.ribbon]}</span>
							<span class="difficulty">{DIFFICULTY_LABEL[course.difficulty]}</span>
							<img src={asset('/assets/monkey.svg')} alt="" class="cover-art" />
							{#if course.comingSoon}
								<div class="lock-overlay">
									<img src={asset('/assets/padlock.svg')} alt="" />
									<span>Coming soon</span>
								</div>
							{/if}
						</div>
						<div class="card-body">
							<h3>{course.title}</h3>
							<p>{course.subtitle}</p>
							<div class="progress-track"><div class="progress-fill" style="width:{pct}%"></div></div>
						</div>
					</a>
				{/each}
			</div>
		</section>
	</main>
</div>

<style>
	.app {
		display: grid;
		grid-template-columns: 220px 1fr;
		min-height: 100vh;
	}
	@media (max-width: 720px) {
		.app {
			grid-template-columns: 1fr;
		}
		.sidebar {
			display: none;
		}
	}
	.sidebar {
		background: var(--green-950);
		color: var(--green-100);
		padding: var(--space-4) var(--space-3);
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		margin-bottom: var(--space-3);
		font-weight: var(--fw-black);
		color: white;
	}
	.brand img {
		width: 32px;
		height: 32px;
	}
	.nav-item {
		padding: 0.65rem var(--space-3);
		border-radius: var(--radius-sm);
		color: var(--green-100);
		text-decoration: none;
		font-weight: var(--fw-bold);
		font-size: 0.95rem;
	}
	.nav-item.active {
		background: var(--green-800);
		color: white;
	}
	.nav-item.disabled {
		opacity: 0.5;
	}
	.nav-item.help {
		margin-top: auto;
	}

	main {
		padding: var(--space-5) var(--space-6) 3rem;
		max-width: 1200px;
	}

	.welcome-banner {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		flex-wrap: wrap;
		background: linear-gradient(120deg, var(--amber-100), #fef3c7);
		border-radius: var(--radius-xl);
		padding: var(--space-5) var(--space-6);
		margin-bottom: var(--space-6);
	}
	.welcome-monkey {
		width: 64px;
		height: 64px;
	}
	.welcome-text h1 {
		margin: 0;
		color: var(--green-900);
	}
	.welcome-text p {
		margin: 0.2rem 0 0;
		color: var(--amber-900);
	}
	.ring-wrap {
		position: relative;
		width: 60px;
		height: 60px;
	}
	.ring-wrap svg {
		width: 100%;
		height: 100%;
	}
	.ring-label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--fw-black);
		font-size: 0.8rem;
		color: var(--green-900);
	}
	.continue-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin-left: auto;
	}
	.continue-label {
		font-size: 0.8rem;
		color: var(--amber-900);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.continue-block strong {
		color: var(--green-900);
		font-size: 1.05rem;
	}
	.continue-btn {
		margin-top: var(--space-1);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 1.1rem;
		border-radius: var(--radius-md);
		background: var(--green-600);
		color: white;
		font-weight: var(--fw-bold);
		text-decoration: none;
		box-shadow: var(--shadow-btn);
	}

	.filter-bar {
		display: flex;
		align-items: center;
		gap: var(--space-5);
		flex-wrap: wrap;
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-lg);
		padding: 0.85rem var(--space-5);
		margin-bottom: var(--space-5);
	}
	.filter-label {
		font-weight: var(--fw-bold);
		color: var(--green-900);
	}
	.filter-label.muted {
		color: var(--gray-400);
		font-weight: 500;
	}
	.filter-fields {
		display: flex;
		gap: var(--space-4);
		margin-left: auto;
		flex-wrap: wrap;
	}
	.filter-fields label {
		display: flex;
		flex-direction: column;
		font-size: 0.75rem;
		color: var(--gray-500);
		gap: 0.15rem;
	}
	.filter-fields select {
		border: 1px solid var(--gray-300);
		border-radius: var(--radius-sm);
		padding: 0.25rem 0.5rem;
	}

	.section-title {
		color: var(--green-900);
		margin: 0 0 var(--space-3);
	}
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-4);
	}
	.card {
		display: flex;
		flex-direction: column;
		background: white;
		border: 1px solid var(--gray-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		box-shadow: var(--shadow-card);
	}
	.card.locked {
		cursor: default;
		opacity: 0.85;
	}
	.card-cover {
		position: relative;
		height: 110px;
		background: linear-gradient(135deg, #bae6c3, var(--green-50));
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.cover-art {
		width: 56px;
		height: 56px;
	}
	.ribbon,
	.difficulty {
		position: absolute;
		top: 0.5rem;
		font-size: 0.65rem;
		font-weight: var(--fw-bold);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-pill);
		background: rgba(255, 255, 255, 0.9);
		color: var(--green-900);
	}
	.ribbon {
		left: 0.5rem;
	}
	.difficulty {
		right: 0.5rem;
	}
	.lock-overlay {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 20, 0.65);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		color: white;
		font-size: 0.75rem;
		font-weight: var(--fw-bold);
	}
	.lock-overlay img {
		width: 28px;
		height: 28px;
	}
	.card-body {
		padding: 0.75rem 0.9rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.card-body h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--green-900);
	}
	.card-body p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--gray-500);
	}
	.progress-track {
		margin-top: 0.4rem;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--gray-200);
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--green-600);
	}
</style>
