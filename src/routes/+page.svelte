<script lang="ts">
	import { onMount } from 'svelte';
	import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock, KeyRound, Server, ShieldCheck, Users, UserCheck, WalletCards } from 'lucide-svelte';
	import { CORE_REST_URL, CONTROL_PLANE_URL } from '$lib/config';
	import { fetchPlans, fetchStats, fetchUsers } from '$lib/admin/client';
	import type { AdminStats, AdminUser, HealthStatus, Plan } from '$lib/admin/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import PlanBadge from '$lib/components/PlanBadge.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let stats = $state<AdminStats | null>(null);
	let plans = $state<Plan[]>([]);
	let users = $state<AdminUser[]>([]);
	let checks = $state<HealthStatus[]>([]);
	let loading = $state(true);
	let error = $state('');
	let lastLoaded = $state<Date | null>(null);

	const inactiveUsers = $derived(stats ? Math.max(stats.total_users - stats.active_users, 0) : 0);
	const verifiedUsers = $derived(users.filter((user) => user.email_verified).length);
	const noKeyUsers = $derived(users.filter((user) => user.active_keys === 0).length);
	const activationRate = $derived(stats && stats.total_users > 0 ? Math.round((stats.active_users / stats.total_users) * 100) : 0);
	const verificationRate = $derived(users.length > 0 ? Math.round((verifiedUsers / users.length) * 100) : 0);
	const keysPerActiveUser = $derived(stats && stats.active_users > 0 ? (stats.total_api_keys / stats.active_users).toFixed(1) : '0.0');
	const monthlyRevenue = $derived(
		stats
			? Object.entries(stats.users_by_plan).reduce((total, [planId, count]) => {
					const plan = plans.find((item) => item.id === planId);
					return total + (plan?.price_idr ?? 0) * count;
				}, 0)
			: 0
	);
	const recentUsers = $derived([...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
	const attentionUsers = $derived(users.filter((user) => !user.is_active || !user.email_verified || user.active_keys === 0).slice(0, 6));
	const healthyServices = $derived(checks.filter((check) => check.status === 'healthy').length);

	function formatIdr(value: number) {
		if (value === 0) return 'Rp0';
		return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
	}

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
	}

	function planCount(plan: string) {
		return stats?.users_by_plan[plan] ?? 0;
	}

	function planPct(count: number) {
		return stats && stats.total_users > 0 ? Math.round((count / stats.total_users) * 100) : 0;
	}

	async function checkService(name: string, baseUrl: string): Promise<HealthStatus> {
		const started = performance.now();
		try {
			const res = await fetch(`${baseUrl}/health`);
			const latency = Math.round(performance.now() - started);
			if (!res.ok) return { service: name, status: 'unhealthy', latency_ms: latency, error: `${res.status} ${res.statusText}` };
			const body = await res.json();
			return { service: body.service ?? name, status: body.status === 'healthy' ? 'healthy' : 'unhealthy', latency_ms: latency };
		} catch {
			return { service: name, status: 'unhealthy', error: 'Cannot reach service' };
		}
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const [statsRes, plansRes, usersRes, healthRes] = await Promise.all([
				fetchStats(),
				fetchPlans(),
				fetchUsers(),
				Promise.all([checkService('control-plane', CONTROL_PLANE_URL), checkService('core-rest', CORE_REST_URL)])
			]);
			stats = statsRes;
			plans = plansRes.plans.sort((a, b) => a.sort_order - b.sort_order);
			users = usersRes.users;
			checks = healthRes;
			lastLoaded = new Date();
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

<div class="animate-fade-in space-y-5">
	<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-6">
		<div class="absolute inset-0 bg-grid opacity-40"></div>
		<div class="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl"></div>
		<div class="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<div class="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
					<ShieldCheck class="h-3.5 w-3.5" /> Production command center
				</div>
				<h1 class="mt-4 text-3xl font-black tracking-tight text-text md:text-4xl">Admin Dashboard</h1>
				<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">Monitor revenue, users, access risk, plan adoption, and service readiness from one clean operational view.</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				{#if lastLoaded}
					<span class="rounded-full border border-border bg-surface/80 px-3 py-2 text-xs font-semibold text-text-muted">Updated {lastLoaded.toLocaleTimeString('id-ID')}</span>
				{/if}
				<button class="rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60" onclick={load} disabled={loading}>
					{loading ? 'Refreshing...' : 'Refresh data'}
				</button>
			</div>
		</div>
	</div>

	{#if loading}
		<LoadingBlock />
	{:else if error}
		<EmptyState title="Dashboard unavailable" description={error} />
	{:else if stats}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<StatCard label="Monthly run-rate" value={formatIdr(monthlyRevenue)} help="Estimated from assigned plans" trend="MRR" icon={WalletCards} tone="green" />
			<StatCard label="Total users" value={stats.total_users} help={`${inactiveUsers} inactive accounts`} trend={`${activationRate}% active`} icon={Users} />
			<StatCard label="Active API keys" value={stats.total_api_keys} help={`${keysPerActiveUser} keys / active user`} icon={KeyRound} tone="amber" />
			<StatCard label="Service health" value={`${healthyServices}/${checks.length}`} help="Control-plane and core REST" trend={healthyServices === checks.length ? 'Healthy' : 'Attention'} icon={Server} tone={healthyServices === checks.length ? 'green' : 'red'} />
		</div>

		<div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h2 class="text-xl font-black text-text">Plan distribution</h2>
						<p class="mt-1 text-sm text-text-muted">Revenue and adoption by current subscriptions.</p>
					</div>
					<a href="/plans" class="inline-flex items-center gap-1 text-sm font-bold text-accent hover:text-accent-glow">Manage catalog <ArrowRight class="h-4 w-4" /></a>
				</div>
				<div class="mt-5 space-y-4">
					{#each plans as plan}
						{@const count = planCount(plan.id)}
						{@const pct = planPct(count)}
						<div class="rounded-2xl border border-border bg-surface-2/50 p-4">
							<div class="flex items-center justify-between gap-3">
								<div class="flex flex-wrap items-center gap-2"><PlanBadge plan={plan.id} /><span class="text-sm font-semibold text-text">{count} users</span></div>
								<span class="font-mono text-xs font-bold text-text-dim">{pct}% · {formatIdr(plan.price_idr * count)}</span>
							</div>
							<div class="mt-3 h-2 overflow-hidden rounded-full bg-surface">
								<div class="h-full rounded-full bg-accent" style={`width: ${pct}%`}></div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<h2 class="text-xl font-black text-text">Operational readiness</h2>
				<p class="mt-1 text-sm text-text-muted">Important signals before scaling usage.</p>
				<div class="mt-5 space-y-3">
					<div class="flex items-center justify-between rounded-2xl border border-border bg-surface-2/50 p-4"><span class="flex items-center gap-2 text-sm font-semibold"><UserCheck class="h-4 w-4 text-green" /> Activation rate</span><StatusBadge tone={activationRate >= 80 ? 'green' : 'amber'} label={`${activationRate}%`} /></div>
					<div class="flex items-center justify-between rounded-2xl border border-border bg-surface-2/50 p-4"><span class="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 class="h-4 w-4 text-green" /> Email verification</span><StatusBadge tone={verificationRate >= 80 ? 'green' : 'amber'} label={`${verificationRate}%`} /></div>
					<div class="flex items-center justify-between rounded-2xl border border-border bg-surface-2/50 p-4"><span class="flex items-center gap-2 text-sm font-semibold"><AlertTriangle class="h-4 w-4 text-amber" /> Users without keys</span><StatusBadge tone={noKeyUsers === 0 ? 'green' : 'amber'} label={`${noKeyUsers}`} /></div>
					<div class="flex items-center justify-between rounded-2xl border border-border bg-surface-2/50 p-4"><span class="flex items-center gap-2 text-sm font-semibold"><Activity class="h-4 w-4 text-accent" /> API coverage</span><StatusBadge tone={Number(keysPerActiveUser) > 0 ? 'green' : 'neutral'} label={`${keysPerActiveUser}x`} /></div>
				</div>
			</section>
		</div>

		<div class="grid gap-6 xl:grid-cols-2">
			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<div class="flex items-center justify-between gap-3">
					<div>
						<h2 class="text-xl font-black text-text">Recent users</h2>
						<p class="mt-1 text-sm text-text-muted">Newest accounts entering the platform.</p>
					</div>
					<a href="/users" class="text-sm font-bold text-accent">View all</a>
				</div>
				<div class="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border">
					{#each recentUsers as user}
						<div class="flex items-center justify-between gap-3 bg-surface-2/35 p-4">
							<div class="min-w-0">
								<p class="truncate text-sm font-bold text-text">{user.name}</p>
								<p class="truncate text-xs text-text-muted">{user.email}</p>
							</div>
							<div class="flex shrink-0 items-center gap-2"><PlanBadge plan={user.plan} /><span class="hidden text-xs text-text-dim sm:inline">{formatDate(user.created_at)}</span></div>
						</div>
					{/each}
				</div>
			</section>

			<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
				<h2 class="text-xl font-black text-text">Attention queue</h2>
				<p class="mt-1 text-sm text-text-muted">Accounts that may need admin follow-up.</p>
				<div class="mt-5 space-y-3">
					{#if attentionUsers.length === 0}
						<div class="rounded-2xl border border-green/20 bg-green/10 p-4 text-sm font-semibold text-green">No obvious account risks right now.</div>
					{:else}
						{#each attentionUsers as user}
							<div class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2/50 p-4">
								<div class="min-w-0">
									<p class="truncate text-sm font-bold text-text">{user.email}</p>
									<p class="mt-1 flex flex-wrap gap-1 text-xs text-text-dim">
										{#if !user.is_active}<span>inactive</span>{/if}
										{#if !user.email_verified}<span>unverified</span>{/if}
										{#if user.active_keys === 0}<span>no API keys</span>{/if}
									</p>
								</div>
								<StatusBadge tone={user.is_active ? 'amber' : 'red'} label={user.is_active ? 'Review' : 'Inactive'} />
							</div>
						{/each}
					{/if}
				</div>
			</section>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			<a href="/users" class="rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25"><Users class="h-5 w-5 text-accent" /><p class="mt-4 font-black text-text">Manage users</p><p class="mt-1 text-sm text-text-muted">Plans, access, and activation.</p></a>
			<a href="/plans" class="rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25"><WalletCards class="h-5 w-5 text-accent" /><p class="mt-4 font-black text-text">Review plans</p><p class="mt-1 text-sm text-text-muted">Limits, pricing, and capabilities.</p></a>
			<a href="/system" class="rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/25"><Clock class="h-5 w-5 text-accent" /><p class="mt-4 font-black text-text">Check runtime</p><p class="mt-1 text-sm text-text-muted">Health checks and endpoints.</p></a>
		</div>
	{/if}
</div>
