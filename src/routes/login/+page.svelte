<script lang="ts">
	import { goto } from '$app/navigation';
	import { LockKeyhole, Shield, Sparkles } from 'lucide-svelte';
	import { loginAdmin, AdminApiError } from '$lib/admin/client';
	import { CONTROL_PLANE_URL, CORE_REST_URL, REALTIME_URL } from '$lib/config';

	let confirmAccess = $state(false);
	let error = $state('');
	let loading = $state(false);

	async function submit() {
		error = '';
		loading = true;
		try {
			await loginAdmin();
			void goto('/');
		} catch (e) {
			error = e instanceof AdminApiError ? e.message : 'Login failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4 py-12 text-text">
	<div class="bg-grid absolute inset-0 opacity-45"></div>
	<div class="absolute -left-20 top-10 h-80 w-80 rounded-full bg-accent/20 blur-3xl"></div>
	<div class="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-green/15 blur-3xl"></div>

	<div class="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
		<section class="hidden lg:block">
			<div class="terminal-panel scanline rounded-[2rem] p-8">
				<div class="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.22em] text-accent">
					<Sparkles class="h-3.5 w-3.5" /> Admin command gate
				</div>
				<h1 class="mt-7 text-5xl font-black tracking-[-0.05em] text-text">Operate ATLSD with surgical clarity.</h1>
				<p class="mt-5 max-w-xl text-sm leading-7 text-text-muted">Revenue, tenants, feeds, market quality, and why-move intelligence sit behind one secure control surface.</p>
				<div class="mt-8 grid gap-3 font-mono text-xs font-bold text-text-muted">
					<div class="rounded-2xl border border-border bg-surface-2/55 p-3"><span class="text-text-dim">CONTROL</span> · {CONTROL_PLANE_URL}</div>
					<div class="rounded-2xl border border-border bg-surface-2/55 p-3"><span class="text-text-dim">CORE</span> · {CORE_REST_URL}</div>
					<div class="rounded-2xl border border-border bg-surface-2/55 p-3"><span class="text-text-dim">REALTIME</span> · {REALTIME_URL}</div>
				</div>
			</div>
		</section>

		<div class="w-full animate-fade-in">
			<div class="mb-7 text-center lg:text-left">
				<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-accent/25 bg-accent/10 text-accent shadow-xl shadow-accent/10 lg:mx-0">
					<Shield class="h-8 w-8" />
				</div>
				<p class="font-mono text-xs font-black uppercase tracking-[0.28em] text-text-dim">Fio / ATLSD</p>
				<h2 class="mt-2 text-4xl font-black tracking-tight">Admin Console</h2>
				<p class="mt-2 text-sm text-text-muted">Enter the admin API key to unlock the production dashboard.</p>
			</div>

			<form class="terminal-panel rounded-[1.75rem] p-6" onsubmit={(e) => { e.preventDefault(); void submit(); }}>
				<div class="flex items-start gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-4">
					<LockKeyhole class="mt-0.5 h-4 w-4 text-text-dim" />
					<div>
						<p class="font-mono text-xs font-black uppercase tracking-[0.2em] text-text-dim">Private server key</p>
						<p class="mt-2 text-sm leading-6 text-text-muted">The admin API key is read only on the SvelteKit server from <span class="font-mono font-bold text-text">API_KEY</span>. It is never exposed to browser JavaScript, URLs, localStorage, or sessionStorage.</p>
					</div>
				</div>
				<label class="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface/70 px-4 py-3 text-sm font-bold text-text-muted">
					<input type="checkbox" bind:checked={confirmAccess} class="h-4 w-4" />
					Use the configured private server credential
				</label>

				{#if error}
					<p class="mt-4 rounded-2xl border border-red/20 bg-red/10 px-4 py-3 text-sm font-bold text-red">{error}</p>
				{/if}

				<button type="submit" class="mt-6 w-full rounded-2xl bg-accent px-4 py-3 text-sm font-black text-white shadow-xl shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60" disabled={loading || !confirmAccess}>
					{loading ? 'Verifying server key...' : 'Enter command center'}
				</button>
			</form>

			<p class="mt-4 text-center text-xs text-text-dim lg:text-left">No API key is rendered to the browser; REST calls go through same-origin server routes.</p>
		</div>
	</div>
</div>
