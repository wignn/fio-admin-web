<script lang="ts">
	import { onMount } from 'svelte';
	import { Activity, KeyRound, Users, UserCheck } from 'lucide-svelte';
	import { fetchPlans, fetchStats } from '$lib/admin/client';
	import type { AdminStats, Plan } from '$lib/admin/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import PlanBadge from '$lib/components/PlanBadge.svelte';
	import StatCard from '$lib/components/StatCard.svelte';

	let stats = $state<AdminStats | null>(null);
	let plans = $state<Plan[]>([]);
	let loading = $state(true);
	let error = $state('');

	const inactiveUsers = $derived(stats ? Math.max(stats.total_users - stats.active_users, 0) : 0);

	function formatIdr(value: number) {
		if (value === 0) return 'Custom / Free';
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const [statsRes, plansRes] = await Promise.all([fetchStats(), fetchPlans()]);
			stats = statsRes;
			plans = plansRes.plans.sort((a, b) => a.sort_order - b.sort_order);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load dashboard.';
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
			<p class="text-sm font-semibold text-accent">Admin overview</p>
			<h1 class="mt-1 text-3xl font-bold tracking-tight text-text">Dashboard</h1>
			<p class="mt-2 text-sm text-text-muted">Monitor users, API keys, plans, and system state.</p>
		</div>
		<button class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={load}>
			Refresh
		</button>
	</div>

	{#if loading}
		<LoadingBlock />
	{:else if error}
		<EmptyState title="Dashboard unavailable" description={error} />
	{:else if stats}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<StatCard label="Total users" value={stats.total_users} help={`${inactiveUsers} inactive`} icon={Users} />
			<StatCard label="Active users" value={stats.active_users} help="Users allowed to authenticate" icon={UserCheck} />
			<StatCard label="Active API keys" value={stats.total_api_keys} help="Keys available across tenants" icon={KeyRound} />
			<StatCard label="Plans" value={Object.keys(stats.users_by_plan).length} help="Plans with assigned users" icon={Activity} />
		</div>

		<div class="grid gap-6 xl:grid-cols-[1fr_380px]">
			<section class="rounded-xl border border-border bg-surface p-5 shadow-sm">
				<h2 class="text-lg font-bold text-text">Plan distribution</h2>
				<p class="mt-1 text-sm text-text-muted">Current user allocation by plan.</p>
				<div class="mt-4 space-y-3">
					{#each Object.entries(stats.users_by_plan) as [plan, count]}
						{@const pct = stats.total_users > 0 ? Math.round((count / stats.total_users) * 100) : 0}
						<div>
							<div class="mb-1 flex items-center justify-between text-sm">
								<div class="flex items-center gap-2"><PlanBadge {plan} /><span class="text-text-muted">{count} users</span></div>
								<span class="font-mono text-xs text-text-dim">{pct}%</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-surface-2">
								<div class="h-full rounded-full bg-accent" style={`width: ${pct}%`}></div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="rounded-xl border border-border bg-surface p-5 shadow-sm">
				<h2 class="text-lg font-bold text-text">Plan catalog</h2>
				<p class="mt-1 text-sm text-text-muted">Pricing configured in control-plane.</p>
				<div class="mt-4 space-y-3">
					{#each plans as plan}
						<a href="/plans" class="block rounded-lg border border-border bg-surface-2/60 p-3 transition hover:border-accent/30 hover:bg-surface-2">
							<div class="flex items-center justify-between gap-3">
								<PlanBadge plan={plan.id} />
								<span class="text-sm font-bold text-text">{formatIdr(plan.price_idr)}</span>
							</div>
							<p class="mt-2 text-xs text-text-muted">{plan.requests_per_day.toLocaleString()} req/day · {plan.ws_connections} WS</p>
						</a>
					{/each}
				</div>
			</section>
		</div>
	{/if}
</div>
