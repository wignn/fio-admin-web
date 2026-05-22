<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle2, Gauge, RefreshCw, Rocket, Shield, TrendingUp, Wifi } from 'lucide-svelte';
	import { fetchPlans } from '$lib/admin/client';
	import type { Plan } from '$lib/admin/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import PlanBadge from '$lib/components/PlanBadge.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let plans = $state<Plan[]>([]);
	let loading = $state(true);
	let error = $state('');

	const maxRequests = $derived(Math.max(...plans.map((plan) => plan.requests_per_day), 1));
	const maxRate = $derived(Math.max(...plans.map((plan) => plan.rate_limit_per_min), 1));

	function formatIdr(value: number) {
		if (value === 0) return 'Custom / Free';
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
	}

	function bestFor(plan: Plan) {
		if (plan.id === 'enterprise') return 'Scale teams and managed operations';
		if (plan.id === 'pro') return 'Growing products with heavier automation';
		if (plan.id === 'starter') return 'Early customers validating workflows';
		return 'Trials, demos, and internal testing';
	}

	function pct(value: number, max: number) {
		return Math.max(4, Math.round((value / max) * 100));
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const data = await fetchPlans();
			plans = data.plans.sort((a, b) => a.sort_order - b.sort_order);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load plans.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void load();
	});
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="text-sm font-bold text-accent">Pricing and limits</p>
			<h1 class="mt-1 text-4xl font-black tracking-tight text-text">Plans</h1>
			<p class="mt-2 text-sm text-text-muted">Production-ready view of plan capacity, monetization, and feature gates configured in control-plane.</p>
		</div>
		<button class="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60" onclick={load} disabled={loading}>
			<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" /> {loading ? 'Refreshing...' : 'Refresh'}
		</button>
	</div>

	{#if loading}
		<LoadingBlock label="Loading plans..." />
	{:else if error}
		<EmptyState title="Plans unavailable" description={error} />
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each plans as plan}
				<article class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-lg hover:shadow-accent/5">
					<div class="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/10 blur-2xl"></div>
					<div class="relative flex items-start justify-between gap-3">
						<div><PlanBadge plan={plan.id} /><h2 class="mt-4 text-2xl font-black text-text">{plan.name}</h2></div>
						<StatusBadge tone={plan.is_active ? 'green' : 'red'} label={plan.is_active ? 'Live' : 'Off'} />
					</div>
					<p class="relative mt-4 text-3xl font-black tracking-tight text-text">{formatIdr(plan.price_idr)}</p>
					<p class="relative mt-2 min-h-10 text-sm leading-relaxed text-text-muted">{bestFor(plan)}</p>
					<div class="relative mt-5 space-y-4">
						<div><div class="mb-1 flex justify-between text-xs font-bold text-text-muted"><span>Requests/day</span><span>{plan.requests_per_day.toLocaleString()}</span></div><div class="h-2 rounded-full bg-surface-2"><div class="h-full rounded-full bg-accent" style={`width: ${pct(plan.requests_per_day, maxRequests)}%`}></div></div></div>
						<div><div class="mb-1 flex justify-between text-xs font-bold text-text-muted"><span>Rate/min</span><span>{plan.rate_limit_per_min}</span></div><div class="h-2 rounded-full bg-surface-2"><div class="h-full rounded-full bg-green" style={`width: ${pct(plan.rate_limit_per_min, maxRate)}%`}></div></div></div>
					</div>
					<div class="relative mt-5 grid grid-cols-2 gap-2 text-xs">
						<div class="rounded-2xl bg-surface-2 p-3"><Wifi class="mb-2 h-4 w-4 text-accent" /><p class="font-bold text-text">{plan.ws_connections}</p><p class="text-text-dim">WS connections</p></div>
						<div class="rounded-2xl bg-surface-2 p-3"><TrendingUp class="mb-2 h-4 w-4 text-green" /><p class="font-bold text-text">{plan.news_history_days}d</p><p class="text-text-dim">History</p></div>
					</div>
				</article>
			{/each}
		</div>

		<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div><h2 class="text-xl font-black text-text">Capability matrix</h2><p class="mt-1 text-sm text-text-muted">Compare limits and feature gates before assigning customers.</p></div>
				<StatusBadge tone="blue" label="Read-only catalog" />
			</div>
			<div class="mt-5 overflow-x-auto rounded-2xl border border-border">
				<table class="min-w-full divide-y divide-border text-sm">
					<thead class="bg-surface-2 text-left text-xs font-black uppercase tracking-wide text-text-dim"><tr><th class="px-4 py-3">Plan</th><th class="px-4 py-3">Requests/day</th><th class="px-4 py-3">Rate/min</th><th class="px-4 py-3">X usernames</th><th class="px-4 py-3">TV symbols</th><th class="px-4 py-3">Features</th></tr></thead>
					<tbody class="divide-y divide-border">
						{#each plans as plan}
							<tr class="hover:bg-surface-2/50">
								<td class="px-4 py-4"><div class="flex items-center gap-2"><PlanBadge plan={plan.id} /><span class="font-bold text-text">{plan.name}</span></div></td>
								<td class="px-4 py-4 font-mono text-text-muted">{plan.requests_per_day.toLocaleString()}</td>
								<td class="px-4 py-4 font-mono text-text-muted">{plan.rate_limit_per_min}</td>
								<td class="px-4 py-4 font-mono text-text-muted">{plan.x_usernames_max}</td>
								<td class="px-4 py-4 font-mono text-text-muted">{plan.tv_symbols_max}</td>
								<td class="px-4 py-4"><div class="flex flex-wrap gap-1.5"><StatusBadge tone={plan.can_scrape ? 'green' : 'neutral'} label={plan.can_scrape ? 'Scraping' : 'No scraping'} /><StatusBadge tone={plan.can_custom_rss ? 'green' : 'neutral'} label={plan.can_custom_rss ? 'Custom RSS' : 'Standard RSS'} /></div></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<div class="grid gap-4 md:grid-cols-3">
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm"><Rocket class="h-5 w-5 text-accent" /><p class="mt-4 font-black text-text">Growth ready</p><p class="mt-1 text-sm text-text-muted">Clear upgrade path from free to enterprise.</p></div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm"><Gauge class="h-5 w-5 text-green" /><p class="mt-4 font-black text-text">Limit visibility</p><p class="mt-1 text-sm text-text-muted">Daily quotas and per-minute limits are visible before support changes.</p></div>
			<div class="rounded-3xl border border-border bg-surface p-5 shadow-sm"><Shield class="h-5 w-5 text-amber" /><p class="mt-4 font-black text-text">Safe operations</p><p class="mt-1 text-sm text-text-muted">This page stays read-only until backend plan mutations exist.</p></div>
		</div>
	{/if}
</div>
