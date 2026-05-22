<script lang="ts">
	import { onMount } from 'svelte';
	import { CORE_REST_URL, CONTROL_PLANE_URL } from '$lib/config';
	import type { HealthStatus } from '$lib/admin/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let checks = $state<HealthStatus[]>([]);
	let loading = $state(true);
	let lastChecked = $state<Date | null>(null);

	async function checkService(name: string, baseUrl: string): Promise<HealthStatus> {
		const started = performance.now();
		try {
			const res = await fetch(`${baseUrl}/health`);
			const latency = Math.round(performance.now() - started);
			if (!res.ok) {
				return { service: name, status: 'unhealthy', latency_ms: latency, error: `${res.status} ${res.statusText}` };
			}
			const body = await res.json();
			return { service: body.service ?? name, status: body.status === 'healthy' ? 'healthy' : 'unhealthy', latency_ms: latency };
		} catch {
			return { service: name, status: 'unhealthy', error: 'Cannot reach service' };
		}
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
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-sm font-semibold text-accent">Runtime health</p>
			<h1 class="mt-1 text-3xl font-bold tracking-tight text-text">System</h1>
			<p class="mt-2 text-sm text-text-muted">Health checks for services used by the admin app.</p>
		</div>
		<button class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-60" onclick={load} disabled={loading}>
			{loading ? 'Checking...' : 'Run checks'}
		</button>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		{#each checks as check}
			<article class="rounded-xl border border-border bg-surface p-5 shadow-sm">
				<div class="flex items-start justify-between gap-3">
					<div>
						<h2 class="text-lg font-bold text-text">{check.service}</h2>
						<p class="mt-1 font-mono text-xs text-text-dim">{check.service.includes('control') ? CONTROL_PLANE_URL : CORE_REST_URL}</p>
					</div>
					<StatusBadge tone={check.status === 'healthy' ? 'green' : 'red'} label={check.status} />
				</div>
				<div class="mt-5 grid grid-cols-2 gap-3 text-sm">
					<div class="rounded-lg bg-surface-2 p-3">
						<p class="text-text-dim">Latency</p>
						<p class="mt-1 font-mono font-bold text-text">{check.latency_ms ? `${check.latency_ms}ms` : '-'}</p>
					</div>
					<div class="rounded-lg bg-surface-2 p-3">
						<p class="text-text-dim">Error</p>
						<p class="mt-1 text-sm font-semibold text-text">{check.error ?? 'None'}</p>
					</div>
				</div>
			</article>
		{/each}
	</div>

	<div class="rounded-xl border border-border bg-surface p-5 text-sm text-text-muted shadow-sm">
		<p>Last checked: <span class="font-semibold text-text">{lastChecked ? lastChecked.toLocaleString('id-ID') : 'Never'}</span></p>
		<p class="mt-2">Set <code class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">PUBLIC_CONTROL_PLANE_URL</code> and <code class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">PUBLIC_CORE_REST_URL</code> for the deployed environment.</p>
	</div>
</div>
