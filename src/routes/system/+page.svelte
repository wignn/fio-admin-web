<script lang="ts">
	import { onMount } from 'svelte';
	import { Activity, CheckCircle2, Clock, Globe2, RefreshCw, Server, ShieldAlert, WifiOff } from 'lucide-svelte';
	import { CORE_REST_URL, CONTROL_PLANE_URL } from '$lib/config';
	import type { HealthStatus } from '$lib/admin/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import StatCard from '$lib/components/StatCard.svelte';

	let checks = $state<HealthStatus[]>([]);
	let loading = $state(true);
	let lastChecked = $state<Date | null>(null);

	const healthyCount = $derived(checks.filter((check) => check.status === 'healthy').length);
	const avgLatency = $derived(
		checks.length > 0
			? Math.round(checks.reduce((total, check) => total + (check.latency_ms ?? 0), 0) / checks.length)
			: 0
	);
	const allHealthy = $derived(checks.length > 0 && healthyCount === checks.length);

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

	function endpointFor(check: HealthStatus) {
		return check.service.includes('control') ? CONTROL_PLANE_URL : CORE_REST_URL;
	}

	async function load() {
		loading = true;
		checks = await Promise.all([
			checkService('world-info-control-plane', CONTROL_PLANE_URL),
			checkService('world-info-core', CORE_REST_URL)
		]);
		lastChecked = new Date();
		loading = false;
	}

	onMount(() => {
		void load();
	});
</script>

<div class="space-y-6 animate-fade-in">
	<div class="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-8">
		<div class="absolute inset-0 bg-grid opacity-35"></div>
		<div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<p class="text-sm font-bold text-accent">Runtime health</p>
				<h1 class="mt-1 text-4xl font-black tracking-tight text-text">System</h1>
				<p class="mt-2 max-w-2xl text-sm text-text-muted">Monitor backend reachability, latency, endpoint configuration, and deployment readiness for the admin app.</p>
			</div>
			<button class="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60" onclick={load} disabled={loading}>
				<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" /> {loading ? 'Checking...' : 'Run checks'}
			</button>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		<StatCard label="Service health" value={`${healthyCount}/${checks.length || 2}`} help="Control-plane and core REST" trend={allHealthy ? 'Healthy' : 'Attention'} icon={Server} tone={allHealthy ? 'green' : 'red'} />
		<StatCard label="Average latency" value={checks.length ? `${avgLatency}ms` : '-'} help="Client-side health probe" icon={Activity} tone={avgLatency < 500 ? 'green' : 'amber'} />
		<StatCard label="Last checked" value={lastChecked ? lastChecked.toLocaleTimeString('id-ID') : 'Never'} help={lastChecked ? lastChecked.toLocaleDateString('id-ID') : 'Run checks to update'} icon={Clock} />
		<StatCard label="Environment" value="Configured" help="PUBLIC_* endpoint variables" icon={Globe2} tone="blue" />
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		{#each checks as check}
			<article class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
				<div class="flex items-start justify-between gap-3 border-b border-border bg-surface-2/45 p-5">
					<div class="min-w-0">
						<div class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full {check.status === 'healthy' ? 'bg-green' : 'bg-red'}"></span><h2 class="truncate text-lg font-black text-text">{check.service}</h2></div>
						<p class="mt-2 truncate font-mono text-xs text-text-dim">{endpointFor(check)}</p>
					</div>
					<StatusBadge tone={check.status === 'healthy' ? 'green' : 'red'} label={check.status} />
				</div>
				<div class="grid gap-3 p-5 sm:grid-cols-3">
					<div class="rounded-2xl border border-border bg-surface-2/50 p-4"><p class="text-xs font-bold uppercase tracking-wide text-text-dim">Latency</p><p class="mt-2 font-mono text-lg font-black text-text">{check.latency_ms ? `${check.latency_ms}ms` : '-'}</p></div>
					<div class="rounded-2xl border border-border bg-surface-2/50 p-4"><p class="text-xs font-bold uppercase tracking-wide text-text-dim">Error</p><p class="mt-2 text-sm font-bold text-text">{check.error ?? 'None'}</p></div>
					<div class="rounded-2xl border border-border bg-surface-2/50 p-4"><p class="text-xs font-bold uppercase tracking-wide text-text-dim">Probe</p><p class="mt-2 text-sm font-bold text-text">/health</p></div>
				</div>
			</article>
		{/each}
	</div>

	<section class="rounded-3xl border border-border bg-surface p-5 shadow-sm">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-xl font-black text-text">Deployment readiness</h2>
				<p class="mt-1 text-sm text-text-muted">Quick checklist for running the admin app in production.</p>
			</div>
			<StatusBadge tone={allHealthy ? 'green' : 'amber'} label={allHealthy ? 'Ready' : 'Needs review'} />
		</div>
		<div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
			<div class="rounded-2xl border border-border bg-surface-2/50 p-4"><CheckCircle2 class="h-5 w-5 text-green" /><p class="mt-3 font-bold text-text">Admin auth enforced</p><p class="mt-1 text-sm text-text-muted">Session verification redirects non-admin users.</p></div>
			<div class="rounded-2xl border border-border bg-surface-2/50 p-4"><Globe2 class="h-5 w-5 text-accent" /><p class="mt-3 font-bold text-text">Endpoint variables</p><p class="mt-1 text-sm text-text-muted">Control-plane and core REST URLs are visible here.</p></div>
			<div class="rounded-2xl border border-border bg-surface-2/50 p-4"><ShieldAlert class="h-5 w-5 text-amber" /><p class="mt-3 font-bold text-text">Safe mutations</p><p class="mt-1 text-sm text-text-muted">User plan and activation changes require confirmation.</p></div>
			<div class="rounded-2xl border border-border bg-surface-2/50 p-4"><WifiOff class="h-5 w-5 text-red" /><p class="mt-3 font-bold text-text">Failure states</p><p class="mt-1 text-sm text-text-muted">Backend outages render clear errors instead of silent failures.</p></div>
		</div>
	</section>

	<div class="rounded-3xl border border-border bg-surface p-5 text-sm text-text-muted shadow-sm">
		<p>Set <code class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">PUBLIC_CONTROL_PLANE_URL</code> and <code class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">PUBLIC_CORE_REST_URL</code> for deployed environments.</p>
	</div>
</div>
