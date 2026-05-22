<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { BarChart3, CreditCard, LogOut, Server, Shield, Users } from 'lucide-svelte';
	import { adminSession } from '$lib/admin/session.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	const nav = [
		{ href: '/', label: 'Dashboard', icon: BarChart3 },
		{ href: '/users', label: 'Users', icon: Users },
		{ href: '/plans', label: 'Plans', icon: CreditCard },
		{ href: '/system', label: 'System', icon: Server }
	];

	function logout() {
		adminSession.clear(false);
		void goto('/login');
	}
</script>

<div class="min-h-screen bg-bg text-text">
	<header class="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 shadow-sm lg:px-6">
		<a href="/" class="flex items-center gap-3">
			<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
				<Shield class="h-5 w-5" />
			</div>
			<div>
				<p class="text-sm font-bold leading-none tracking-tight">Fio Admin</p>
				<p class="mt-1 text-xs text-text-dim">Internal control plane</p>
			</div>
		</a>

		<div class="flex items-center gap-3">
			<div class="hidden text-right sm:block">
				<p class="text-xs font-semibold text-text">Admin session</p>
				<p class="text-xs text-text-dim">{adminSession.identity?.plan ?? 'enterprise'}</p>
			</div>
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text"
				onclick={logout}
			>
				<LogOut class="h-4 w-4" />
				<span class="hidden sm:inline">Logout</span>
			</button>
		</div>
	</header>

	<div class="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[240px_1fr]">
		<aside class="border-b border-border bg-surface lg:min-h-[calc(100vh-56px)] lg:border-b-0 lg:border-r">
			<nav class="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:p-4">
				{#each nav as item}
					{@const active = page.url.pathname === item.href}
					{@const Icon = item.icon}
					<a
						href={item.href}
						class="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition {active ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:bg-surface-2 hover:text-text'}"
					>
						<Icon class="h-4 w-4" />
						{item.label}
					</a>
				{/each}
			</nav>
		</aside>

		<main class="min-w-0 p-4 md:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
