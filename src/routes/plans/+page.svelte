<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchPlans } from '$lib/admin/client';
	import type { Plan } from '$lib/admin/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import PlanBadge from '$lib/components/PlanBadge.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let plans = $state<Plan[]>([]);
	let loading = $state(true);
	let error = $state('');

	function formatIdr(value: number) {
		if (value === 0) return 'Custom / Free';
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
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
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-sm font-semibold text-accent">Pricing and limits</p>
			<h1 class="mt-1 text-3xl font-bold tracking-tight text-text">Plans</h1>
			<p class="mt-2 text-sm text-text-muted">Read-only view of plans configured in the control-plane database.</p>
		</div>
		<button class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={load}>Refresh</button>
	</div>

	{#if loading}
		<LoadingBlock label="Loading plans..." />
	{:else if error}
		<EmptyState title="Plans unavailable" description={error} />
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each plans as plan}
				<article class="rounded-xl border border-border bg-surface p-5 shadow-sm">
					<div class="flex items-start justify-between gap-3">
						<div>
							<PlanBadge plan={plan.id} />
							<h2 class="mt-3 text-xl font-bold text-text">{plan.name}</h2>
						</div>
						<StatusBadge tone={plan.is_active ? 'green' : 'red'} label={plan.is_active ? 'Active' : 'Inactive'} />
					</div>
					<p class="mt-4 text-2xl font-bold tracking-tight text-text">{formatIdr(plan.price_idr)}</p>
					<div class="mt-5 space-y-2 text-sm">
						<div class="flex justify-between gap-3"><span class="text-text-muted">Requests/day</span><span class="font-mono font-semibold">{plan.requests_per_day.toLocaleString()}</span></div>
						<div class="flex justify-between gap-3"><span class="text-text-muted">WS connections</span><span class="font-mono font-semibold">{plan.ws_connections}</span></div>
						<div class="flex justify-between gap-3"><span class="text-text-muted">X usernames</span><span class="font-mono font-semibold">{plan.x_usernames_max}</span></div>
						<div class="flex justify-between gap-3"><span class="text-text-muted">TV symbols</span><span class="font-mono font-semibold">{plan.tv_symbols_max}</span></div>
						<div class="flex justify-between gap-3"><span class="text-text-muted">History days</span><span class="font-mono font-semibold">{plan.news_history_days}</span></div>
						<div class="flex justify-between gap-3"><span class="text-text-muted">Rate/min</span><span class="font-mono font-semibold">{plan.rate_limit_per_min}</span></div>
					</div>
					<div class="mt-5 flex flex-wrap gap-2">
						<StatusBadge tone={plan.can_scrape ? 'green' : 'neutral'} label={plan.can_scrape ? 'Scrape enabled' : 'No scraping'} />
						<StatusBadge tone={plan.can_custom_rss ? 'green' : 'neutral'} label={plan.can_custom_rss ? 'Custom RSS' : 'No custom RSS'} />
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
