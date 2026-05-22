<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AdminShell from '$lib/components/AdminShell.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import { verifyStoredSession } from '$lib/admin/client';
	import { adminSession } from '$lib/admin/session.svelte';

	let { children } = $props();

	onMount(async () => {
		const ok = await verifyStoredSession();
		if (!ok && page.url.pathname !== '/login') {
			void goto('/login');
		}
		if (ok && page.url.pathname === '/login') {
			void goto('/');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Fio Admin</title>
	<meta name="description" content="Internal admin dashboard for Fio / ATLSD." />
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

{#if page.url.pathname === '/login'}
	{@render children()}
{:else if !adminSession.ready || adminSession.verifying}
	<div class="flex min-h-screen items-center justify-center bg-bg p-4">
		<div class="w-full max-w-sm">
			<LoadingBlock label="Verifying admin session..." />
		</div>
	</div>
{:else if adminSession.isAdmin}
	<AdminShell>
		{@render children()}
	</AdminShell>
{/if}
