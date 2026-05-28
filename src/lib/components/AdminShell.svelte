<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		Activity,
		BarChart3,
		Command,
		CreditCard,
		FileSearch,
		Gauge,
		LogOut,
		Moon,
		RadioTower,
		Search,
		Server,
		Shield,
		Sparkles,
		Sun,
		Users
	} from 'lucide-svelte';
	import { adminSession } from '$lib/admin/session.svelte';
	import { CONTROL_PLANE_URL, CORE_REST_URL, REALTIME_URL } from '$lib/config';
	import EndpointPill from './EndpointPill.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	let isDarkTheme = $state(false);

	const navGroups = [
		{
			label: 'Command',
			items: [{ href: '/', label: 'Dashboard', description: 'Revenue, users, risk', icon: BarChart3 }]
		},
		{
			label: 'Business',
			items: [
				{ href: '/users', label: 'Users', description: 'Accounts & access', icon: Users },
				{ href: '/plans', label: 'Plans', description: 'Limits & pricing', icon: CreditCard }
			]
		},
		{
			label: 'Operations',
			items: [
				{ href: '/ops', label: 'Ops Center', description: 'Feeds & markets', icon: Activity },
				{ href: '/system', label: 'System', description: 'Health & runtime', icon: Server }
			]
		}
	];

	const opsQuickLinks = [
		{ href: '/ops/feeds', label: 'Feed Health', icon: RadioTower },
		{ href: '/ops', label: 'Market Quality', icon: Gauge },
		{ href: '/ops/why', label: 'Why Engine', icon: FileSearch }
	];

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	onMount(() => {
		const storedTheme = localStorage.getItem('admin-theme');
		if (storedTheme !== 'light') {
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
		void adminSession.clear(false);
		void goto('/login');
	}
</script>

<div class="relative min-h-screen bg-bg text-text">
	<header class="sticky top-0 z-40 border-b border-border bg-surface/80 shadow-xl shadow-slate-950/5 backdrop-blur-2xl">
		<div class="mx-auto flex h-18 max-w-[1580px] items-center justify-between gap-4 px-4 lg:px-6">
			<a href="/" class="flex min-w-0 items-center gap-3">
				<div class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-accent/25 bg-accent/10 text-accent shadow-lg shadow-accent/10">
					<div class="absolute inset-0 bg-grid opacity-50"></div>
					<Shield class="relative h-5 w-5" />
					<span class="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-green shadow-[0_0_14px_rgba(16,185,129,0.9)]"></span>
				</div>
				<div class="min-w-0">
					<p class="truncate text-sm font-black leading-none tracking-tight">ATLSD Command</p>
					<p class="mt-1 truncate font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-text-dim">Fio internal admin</p>
				</div>
			</a>

			<div class="hidden min-w-0 max-w-xl flex-1 items-center rounded-2xl border border-border bg-surface-2/70 px-3 py-2 text-sm text-text-dim shadow-inner lg:flex">
				<Search class="h-4 w-4 shrink-0" />
				<span class="ml-2 truncate">Search users, plans, feeds, symbols, or runtime pages</span>
				<span class="ml-auto inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-text-dim"><Command class="h-3 w-3" />K</span>
			</div>

			<div class="flex items-center gap-2">
				<div class="hidden items-center gap-2 rounded-2xl border border-border bg-surface-2/70 px-3 py-2 text-xs font-semibold text-text-muted md:flex">
					<Sparkles class="h-4 w-4 text-accent" />
					<span class="max-w-44 truncate">{adminSession.identity?.user?.email ?? 'Admin session'}</span>
				</div>
				<button type="button" class="rounded-xl border border-border bg-surface px-3 py-2 text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={toggleTheme} title="Toggle theme">
					{#if isDarkTheme}<Sun class="h-4 w-4" />{:else}<Moon class="h-4 w-4" />{/if}
				</button>
				<button type="button" class="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={logout}>
					<LogOut class="h-4 w-4" />
					<span class="hidden sm:inline">Logout</span>
				</button>
			</div>
		</div>
	</header>

	<div class="mx-auto grid max-w-[1580px] grid-cols-1 lg:grid-cols-[286px_1fr]">
		<aside class="border-b border-border bg-surface/65 backdrop-blur-xl lg:min-h-[calc(100vh-72px)] lg:border-b-0 lg:border-r lg:bg-surface/32">
			<div class="sticky top-18 p-3 lg:p-4">
				<div class="terminal-panel scanline mb-4 hidden rounded-3xl p-4 lg:block">
					<p class="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-text-dim">Workspace</p>
					<p class="mt-2 text-lg font-black text-text">Production Admin</p>
					<div class="mt-4 grid gap-2">
						<EndpointPill label="Control" value={CONTROL_PLANE_URL} />
						<EndpointPill label="Core" value={CORE_REST_URL} />
						<EndpointPill label="Realtime" value={REALTIME_URL} />
					</div>
				</div>

				<nav class="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-4 lg:overflow-visible lg:pb-0">
					{#each navGroups as group}
						<div class="flex shrink-0 gap-2 lg:flex-col">
							<p class="hidden px-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-text-dim lg:block">{group.label}</p>
							<div class="flex gap-2 lg:flex-col">
								{#each group.items as item}
									{@const active = isActive(item.href)}
									{@const Icon = item.icon}
									<a href={item.href} class="group flex shrink-0 items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition lg:shrink {active ? 'border-accent/25 bg-accent text-white shadow-xl shadow-accent/20' : 'border-transparent text-text-muted hover:border-border hover:bg-surface hover:text-text hover:shadow-sm'}">
										<span class="rounded-xl p-2 {active ? 'bg-white/15 text-white' : 'bg-surface-2 text-text-dim group-hover:text-accent'}"><Icon class="h-4 w-4" /></span>
										<span class="min-w-0">
											<span class="block truncate">{item.label}</span>
											<span class="hidden truncate text-xs font-medium opacity-75 lg:block">{item.description}</span>
										</span>
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</nav>

				<div class="mt-4 hidden rounded-3xl border border-border bg-surface/75 p-3 shadow-sm lg:block">
					<p class="px-1 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-text-dim">Ops shortcuts</p>
					<div class="mt-2 space-y-1">
						{#each opsQuickLinks as link}
							{@const active = isActive(link.href)}
							{@const Icon = link.icon}
							<a href={link.href} class="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-bold transition {active ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-surface-2 hover:text-text'}">
								<Icon class="h-3.5 w-3.5" />
								{link.label}
							</a>
						{/each}
					</div>
				</div>
			</div>
		</aside>

		<main class="relative z-10 min-w-0 p-4 md:p-6 lg:p-7">
			{@render children()}
		</main>
	</div>
</div>
