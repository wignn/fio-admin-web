<script lang="ts">
	import { goto } from '$app/navigation';
	import { LockKeyhole, Shield } from 'lucide-svelte';
	import { loginAdmin, AdminApiError } from '$lib/admin/client';

	let apiKey = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit() {
		error = '';
		loading = true;
		try {
			await loginAdmin(apiKey);
			void goto('/');
		} catch (e) {
			error = e instanceof AdminApiError ? e.message : 'Login failed. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-bg px-4 py-12 text-text">
	<div class="w-full max-w-md animate-fade-in">
		<div class="mb-8 text-center">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
				<Shield class="h-7 w-7" />
			</div>
			<h1 class="text-3xl font-bold tracking-tight">Fio Admin</h1>
			<p class="mt-2 text-sm text-text-muted">Internal control plane access</p>
		</div>

		<form class="rounded-2xl border border-border bg-surface p-6 shadow-sm" onsubmit={(e) => { e.preventDefault(); void submit(); }}>
			<label for="api-key" class="text-sm font-semibold text-text">Admin API key</label>
			<div class="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 focus-within:border-accent focus-within:bg-surface">
				<LockKeyhole class="h-4 w-4 text-text-dim" />
				<input
					id="api-key"
					type="password"
					bind:value={apiKey}
					placeholder="Paste ADMIN_API_KEY"
					class="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
					autocomplete="off"
				/>
			</div>

			{#if error}
				<p class="mt-3 rounded-lg border border-red/20 bg-red/10 px-3 py-2 text-sm text-red">{error}</p>
			{/if}

			<button
				type="submit"
				class="mt-5 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-accent-glow disabled:opacity-60"
				disabled={loading}
			>
				{loading ? 'Verifying...' : 'Enter admin dashboard'}
			</button>
		</form>

		<p class="mt-4 text-center text-xs text-text-dim">
			The key is stored in sessionStorage only and is never sent in URLs.
		</p>
	</div>
</div>
