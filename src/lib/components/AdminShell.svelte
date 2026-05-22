<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { BarChart3, Command, CreditCard, LogOut, Moon, Search, Server, Shield, Sparkles, Sun, Users } from 'lucide-svelte';
	import { adminSession } from '$lib/admin/session.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	let isDarkTheme = $state(false);

	const nav = [
		{ href: '/', label: 'Dashboard', description: 'Overview & insights', icon: BarChart3 },
		{ href: '/users', label: 'Users', description: 'Accounts & access', icon: Users },
		{ href: '/plans', label: 'Plans', description: 'Limits & pricing', icon: CreditCard },
		{ href: '/system', label: 'System', description: 'Health & runtime', icon: Server }
	];

	onMount(() => {
		const storedTheme = localStorage.getItem('admin-theme');
		if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			isDarkTheme = true;
			document.documentElement.classList.add('dark');
		}
	});

	function toggleTheme() {
		isDarkTheme = !isDarkTheme;
		document.documentElement.classList.toggle('dark', isDarkTheme);
		localStorage.setItem('admin-theme', isDarkTheme ? 'dark' : 'light');
	}

	function logout() {
		adminSession.clear(false);
		void goto('/login');
	}
</script>

<div class="min-h-screen bg-bg text-text">
	<header class="sticky top-0 z-40 border-b border-border bg-surface/90 shadow-sm backdrop-blur-xl">
		<div class="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 lg:px-6">
			<a href="/" class="flex min-w-0 items-center gap-3">
				<div class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/15">
					<Shield class="h-5 w-5" />
					<span class="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-green"></span>
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-black leading-none tracking-tight">Fio Admin</p>
					<p class="mt-1 truncate text-xs text-text-dim">Internal control plane</p>
				</div>
			</a>

			<div class="hidden min-w-0 max-w-xl flex-1 items-center rounded-2xl border border-border bg-surface-2/70 px-3 py-2 text-sm text-text-dim shadow-inner lg:flex">
				<Search class="h-4 w-4 shrink-0" />
				<span class="ml-2 truncate">Search users, plans, or operational pages</span>
				<span class="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-text-dim"><Command class="h-3 w-3" />K</span>
			</div>

			<div class="flex items-center gap-2">
				<div class="hidden items-center gap-2 rounded-2xl border border-border bg-surface-2/70 px-3 py-2 text-xs font-semibold text-text-muted md:flex">
					<Sparkles class="h-4 w-4 text-accent" />
					<span>{adminSession.identity?.user?.email ?? 'Admin session'}</span>
				</div>
				<button type="button" class="rounded-xl border border-border bg-surface px-3 py-2 text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={toggleTheme} title="Toggle theme">
					{#if isDarkTheme}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>
				<button
					type="button"
					class="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text"
					onclick={logout}
				>
					<LogOut class="h-4 w-4" />
					<span class="hidden sm:inline">Logout</span>
				</button>
			</div>
		</div>
	</header>

	<div class="mx-auto grid max-w-[1500px] grid-cols-1 lg:grid-cols-[280px_1fr]">
		<aside class="border-b border-border bg-surface/70 lg:min-h-[calc(100vh-64px)] lg:border-b-0 lg:border-r lg:bg-transparent">
			<div class="sticky top-16 p-3 lg:p-5">
				<div class="mb-4 hidden rounded-2xl border border-border bg-surface p-4 shadow-sm lg:block">
					<p class="text-xs font-bold uppercase tracking-wide text-text-dim">Workspace</p>
					<p class="mt-2 text-sm font-bold text-text">Production Admin</p>
					<div class="mt-3 flex items-center gap-2 text-xs text-text-muted">
						<span class="h-2 w-2 rounded-full bg-green"></span>
						Ready for operations
					</div>
				</div>

				<nav class="flex gap-2 overflow-x-auto lg:flex-col">
					{#each nav as item}
						{@const active = page.url.pathname === item.href}
						{@const Icon = item.icon}
						<a
							href={item.href}
							class="group flex shrink-0 items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition lg:shrink {active ? 'border-accent/20 bg-accent text-white shadow-lg shadow-accent/15' : 'border-transparent text-text-muted hover:border-border hover:bg-surface hover:text-text hover:shadow-sm'}"
						>
							<span class="rounded-xl p-2 {active ? 'bg-white/15 text-white' : 'bg-surface-2 text-text-dim group-hover:text-accent'}">
								<Icon class="h-4 w-4" />
							</span>
							<span class="min-w-0">
								<span class="block truncate">{item.label}</span>
								<span class="hidden truncate text-xs font-medium opacity-75 lg:block">{item.description}</span>
							</span>
						</a>
					{/each}
				</nav>
			</div>
		</aside>

		<main class="min-w-0 p-4 md:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
