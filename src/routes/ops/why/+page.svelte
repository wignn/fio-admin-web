<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Activity,
		BrainCircuit,
		DatabaseZap,
		FileSearch,
		RefreshCw,
		Search,
		TrendingUp
	} from 'lucide-svelte';
	import { fetchWhyDidItMove } from '$lib/admin/client';
	import type { WhyMoveResponse } from '$lib/admin/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	const symbols = ['XAUUSD', 'DXY', 'SPX', 'BTCUSDT', 'ETHUSDT', 'EURUSD', 'GBPUSD', 'USDJPY'];
	const windows = ['5m', '15m', '30m', '1h'];

	let symbol = $state('XAUUSD');
	let window = $state('5m');
	let data = $state<WhyMoveResponse | null>(null);
	let loading = $state(false);
	let error = $state('');
	let showRaw = $state(false);

	let narrative = $derived(data?.llm?.status === 'generated' ? data.llm.narrative : null);
	let confidenceLabel = $derived(typeof data?.confidence === 'string' ? data.confidence : data?.confidence?.label ?? 'low');
	let explanationText = $derived(data?.explanation ?? data?.summary ?? 'No explanation available.');
	let driverLabels = $derived((data?.drivers ?? []).map((driver) => (typeof driver === 'string' ? driver : driver.name)));

	function toneForStatus(status: string): 'green' | 'amber' | 'red' | 'neutral' {
		if (status === 'generated') return 'green';
		if (status === 'failed') return 'red';
		if (status === 'disabled') return 'neutral';
		return 'amber';
	}

	function toneForConfidence(confidence: string): 'green' | 'amber' | 'red' | 'neutral' {
		if (confidence === 'high') return 'green';
		if (confidence === 'medium') return 'amber';
		if (confidence === 'low') return 'neutral';
		return 'neutral';
	}

	function formatMove(value: number | undefined) {
		if (value == null) return '—';
		return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
	}

	function formatNumber(value: number | undefined) {
		if (value == null) return '—';
		return value.toLocaleString(undefined, { maximumFractionDigits: 5 });
	}

	function formatTime(value: string | null | undefined) {
		if (!value) return '—';
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(value)
		);
	}

	async function load() {
		const normalized = symbol.trim().toUpperCase();
		if (!normalized) return;
		loading = true;
		error = '';
		try {
			data = await fetchWhyDidItMove(normalized, window);
			symbol = normalized;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load explanation.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void load();
	});
</script>

<div class="animate-fade-in space-y-6">
	<div
		class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-8"
	>
		<div class="bg-grid absolute inset-0 opacity-40"></div>
		<div class="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"></div>
		<div class="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<div
					class="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent"
				>
					<BrainCircuit class="h-3.5 w-3.5" /> Why Did It Move
				</div>
				<h1 class="mt-4 text-4xl font-black tracking-tight text-text md:text-5xl">
					Catalyst Investigator
				</h1>
				<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
					Inspect deterministic scoring, Gemini narrative status, matched news, and same-window
					cross-asset context for any market symbol.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<input
					class="rounded-2xl border border-border bg-surface px-4 py-2 font-mono text-sm font-bold text-text transition outline-none focus:border-accent"
					bind:value={symbol}
					placeholder="XAUUSD"
				/>
				<select
					class="rounded-2xl border border-border bg-surface px-4 py-2 text-sm font-bold text-text transition outline-none focus:border-accent"
					bind:value={window}
				>
					{#each windows as item (item)}
						<option value={item}>{item}</option>
					{/each}
				</select>
				<button
					class="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60"
					onclick={load}
					disabled={loading}
				>
					{#if loading}<RefreshCw class="h-4 w-4 animate-spin" />{:else}<Search
							class="h-4 w-4"
						/>{/if}
					Explain
				</button>
			</div>
		</div>
		<div class="relative mt-5 flex flex-wrap gap-2">
			{#each symbols as item (item)}
				<button
					class="rounded-full border border-border px-3 py-1 text-xs font-bold transition hover:border-accent hover:text-accent {symbol ===
					item
						? 'border-accent bg-accent text-white'
						: 'text-text-muted'}"
					onclick={() => {
						symbol = item;
						void load();
					}}>{item}</button
				>
			{/each}
		</div>
	</div>

	{#if loading}
		<LoadingBlock />
	{:else if error}
		<EmptyState title="Explanation unavailable" description={error} />
	{:else if data}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<TrendingUp class="h-5 w-5 text-accent" />
				<p class="mt-4 text-xs font-bold text-text-dim uppercase">Move</p>
				<p
					class="mt-1 font-mono text-2xl font-black {data.move?.direction === 'up'
						? 'text-green'
						: 'text-red'}"
				>
					{formatMove(data.move?.move_pct)}
				</p>
				<p class="mt-1 text-xs text-text-muted">
					{data.window} · ticks {data.move?.tick_count ?? 0}
				</p>
			</div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<Activity class="h-5 w-5 text-accent" />
				<p class="mt-4 text-xs font-bold text-text-dim uppercase">Confidence</p>
				<div class="mt-2">
					<StatusBadge tone={toneForConfidence(confidenceLabel)} label={confidenceLabel} />
				</div>
				<p class="mt-2 text-xs text-text-muted">{data.causes.news.length} ranked news causes</p>
			</div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<BrainCircuit class="h-5 w-5 text-accent" />
				<p class="mt-4 text-xs font-bold text-text-dim uppercase">Gemini</p>
				<div class="mt-2">
					<StatusBadge tone={toneForStatus(data.llm.status)} label={data.llm.status} />
				</div>
				<p class="mt-2 text-xs text-text-muted">{data.llm.model}</p>
			</div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<DatabaseZap class="h-5 w-5 text-accent" />
				<p class="mt-4 text-xs font-bold text-text-dim uppercase">Latest</p>
				<p class="mt-1 font-mono text-xl font-black text-text">
					{formatNumber(data.move?.latest_price)}
				</p>
				<p class="mt-1 text-xs text-text-muted">
					baseline {formatNumber(data.move?.baseline_price)}
				</p>
			</div>
		</div>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h2 class="text-xl font-black text-text">Analyst Narrative</h2>
					<p class="mt-1 text-sm text-text-muted">
						Gemini output when configured, deterministic summary otherwise.
					</p>
				</div>
				<StatusBadge tone={toneForStatus(data.llm.status)} label={data.llm.status} />
			</div>
			{#if narrative}
				<div class="mt-5 rounded-2xl border border-accent/20 bg-accent/5 p-4">
					<p class="text-lg font-black text-text">{narrative.headline}</p>
					<p class="mt-3 text-sm leading-relaxed text-text-muted">{narrative.explanation}</p>
					<div class="mt-4 flex flex-wrap gap-2">
						{#each narrative.drivers as driver (driver)}<span
								class="rounded-full border border-green/20 bg-green/10 px-2 py-1 text-xs font-bold text-green"
								>{driver}</span
							>{/each}
					</div>
				</div>
			{:else}
				<p
					class="mt-5 rounded-2xl border border-border bg-surface-2/50 p-4 text-sm leading-relaxed text-text-muted"
				>
					{explanationText}
				</p>
			{/if}
		</section>

		<div class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<h2 class="text-xl font-black text-text">Ranked News Causes</h2>
				<div class="mt-5 space-y-3">
					{#each data.causes.news as cause (`${cause.kind}-${cause.title}`)}
						<div class="rounded-2xl border border-border bg-surface-2/45 p-4">
							<div class="flex flex-wrap items-center gap-2">
								<StatusBadge
									tone={cause.sentiment === 'positive'
										? 'green'
										: cause.sentiment === 'negative'
											? 'red'
											: 'neutral'}
									label={cause.sentiment ?? 'neutral'}
								/><span class="font-mono text-xs font-bold text-text-muted"
									>score {cause.score}</span
								><span class="text-xs text-text-dim"
									>{formatTime(cause.processed_at ?? cause.published_at)}</span
								>
							</div>
							<p class="mt-2 text-sm font-bold text-text">{cause.title}</p>
							<p class="mt-1 text-xs text-text-muted">{cause.source_name ?? cause.kind}</p>
							<div class="mt-3 flex flex-wrap gap-1.5">
								{#each cause.matched_terms as term (term)}<span
										class="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent"
										>{term}</span
									>{/each}
							</div>
						</div>
					{/each}
					{#if data.causes.news.length === 0}<div
							class="rounded-2xl border border-border bg-surface-2/50 p-6 text-center text-sm font-semibold text-text-muted"
						>
							No matching news causes found.
						</div>{/if}
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<h2 class="text-xl font-black text-text">Cross Assets & Raw Evidence</h2>
				<div class="mt-5 space-y-3">
					{#each data.cross_assets as asset (asset.symbol)}
						<div class="rounded-2xl border border-border bg-surface-2/45 p-4">
							<div class="flex items-center justify-between">
								<p class="font-mono text-sm font-black text-text">{asset.symbol}</p>
								<p
									class="font-mono text-sm font-black {asset.direction === 'up'
										? 'text-green'
										: 'text-red'}"
								>
									{formatMove(asset.move_pct)}
								</p>
							</div>
							<p class="mt-2 text-xs text-text-muted">{asset.relationship}</p>
						</div>
					{/each}
				</div>
				<button
					class="mt-5 inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-bold text-text-muted transition hover:bg-surface-2 hover:text-text"
					onclick={() => (showRaw = !showRaw)}
					><FileSearch class="h-4 w-4" />{showRaw ? 'Hide raw JSON' : 'Show raw JSON'}</button
				>
				{#if showRaw}<pre
						class="mt-4 max-h-96 overflow-auto rounded-2xl border border-border bg-surface-2 p-4 text-xs text-text-muted">{JSON.stringify(
							data.evidence,
							null,
							2
						)}</pre>{/if}
			</section>
		</div>
	{/if}
</div>
