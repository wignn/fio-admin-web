<script lang="ts">
	import { onMount } from 'svelte';
	import { RefreshCw, Search } from 'lucide-svelte';
	import { fetchUsers, toggleUser, updateUserPlan } from '$lib/admin/client';
	import type { AdminUser, PlanId } from '$lib/admin/types';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import PlanBadge from '$lib/components/PlanBadge.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	const planOptions: PlanId[] = ['free', 'starter', 'pro', 'enterprise'];

	let users = $state<AdminUser[]>([]);
	let loading = $state(true);
	let error = $state('');
	let query = $state('');
	let selectedPlan = $state('all');
	let selectedStatus = $state('all');
	let pendingUser = $state<AdminUser | null>(null);
	let pendingPlan = $state('');
	let confirmPlanOpen = $state(false);
	let confirmToggleOpen = $state(false);

	const filteredUsers = $derived(
		users.filter((user) => {
			const q = query.trim().toLowerCase();
			const matchesQuery = !q || user.email.toLowerCase().includes(q) || user.name.toLowerCase().includes(q);
			const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan;
			const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' ? user.is_active : !user.is_active);
			return matchesQuery && matchesPlan && matchesStatus;
		})
	);

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
	}

	async function load() {
		loading = true;
		error = '';
		try {
			const data = await fetchUsers();
			users = data.users;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load users.';
		} finally {
			loading = false;
		}
	}

	function askPlanChange(user: AdminUser, plan: string) {
		if (plan === user.plan) return;
		pendingUser = user;
		pendingPlan = plan;
		confirmPlanOpen = true;
	}

	function askToggle(user: AdminUser) {
		pendingUser = user;
		confirmToggleOpen = true;
	}

	async function confirmPlanChange() {
		if (!pendingUser || !pendingPlan) return;
		await updateUserPlan(pendingUser.id, pendingPlan);
		await load();
	}

	async function confirmToggle() {
		if (!pendingUser) return;
		await toggleUser(pendingUser.id);
		await load();
	}

	onMount(() => {
		void load();
	});
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="text-sm font-semibold text-accent">User management</p>
			<h1 class="mt-1 text-3xl font-bold tracking-tight text-text">Users</h1>
			<p class="mt-2 text-sm text-text-muted">Manage user status and plan assignment.</p>
		</div>
		<button class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={load}>
			<RefreshCw class="h-4 w-4" /> Refresh
		</button>
	</div>

	<div class="grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm lg:grid-cols-[1fr_180px_180px]">
		<div class="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
			<Search class="h-4 w-4 text-text-dim" />
			<input bind:value={query} class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-dim" placeholder="Search email or name..." />
		</div>
		<select bind:value={selectedPlan} class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text outline-none">
			<option value="all">All plans</option>
			{#each planOptions as plan}
				<option value={plan}>{plan}</option>
			{/each}
		</select>
		<select bind:value={selectedStatus} class="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text outline-none">
			<option value="all">All status</option>
			<option value="active">Active</option>
			<option value="inactive">Inactive</option>
		</select>
	</div>

	{#if loading}
		<LoadingBlock label="Loading users..." />
	{:else if error}
		<EmptyState title="Users unavailable" description={error} />
	{:else if filteredUsers.length === 0}
		<EmptyState title="No users found" description="Try changing the search or filters." />
	{:else}
		<div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-border text-sm">
					<thead class="bg-surface-2 text-left text-xs font-bold uppercase tracking-wide text-text-dim">
						<tr>
							<th class="px-4 py-3">User</th>
							<th class="px-4 py-3">Plan</th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3">Keys</th>
							<th class="px-4 py-3">Created</th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredUsers as user}
							<tr class="hover:bg-surface-2/50">
								<td class="px-4 py-3">
									<p class="font-semibold text-text">{user.name}</p>
									<p class="text-xs text-text-muted">{user.email}</p>
									<div class="mt-1"><StatusBadge tone={user.email_verified ? 'green' : 'amber'} label={user.email_verified ? 'Verified' : 'Unverified'} /></div>
								</td>
								<td class="px-4 py-3"><PlanBadge plan={user.plan} /></td>
								<td class="px-4 py-3"><StatusBadge tone={user.is_active ? 'green' : 'red'} label={user.is_active ? 'Active' : 'Inactive'} /></td>
								<td class="px-4 py-3 font-mono text-text-muted">{user.active_keys}</td>
								<td class="px-4 py-3 text-text-muted">{formatDate(user.created_at)}</td>
								<td class="px-4 py-3">
									<div class="flex justify-end gap-2">
										<select class="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-semibold text-text outline-none" value={user.plan} onchange={(e) => askPlanChange(user, e.currentTarget.value)}>
											{#each planOptions as plan}
												<option value={plan}>{plan}</option>
											{/each}
										</select>
										<button class="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={() => askToggle(user)}>
											{user.is_active ? 'Deactivate' : 'Activate'}
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</div>

<ConfirmDialog
	bind:open={confirmPlanOpen}
	title="Change user plan"
	description={`Change ${pendingUser?.email ?? 'this user'} from ${pendingUser?.plan ?? '-'} to ${pendingPlan}? This updates their backend limits after core sync refreshes.`}
	confirmLabel="Change plan"
	onconfirm={confirmPlanChange}
/>

<ConfirmDialog
	bind:open={confirmToggleOpen}
	title={pendingUser?.is_active ? 'Deactivate user' : 'Activate user'}
	description={`${pendingUser?.is_active ? 'Deactivate' : 'Activate'} ${pendingUser?.email ?? 'this user'}? This affects their ability to authenticate and use API keys.`}
	confirmLabel={pendingUser?.is_active ? 'Deactivate' : 'Activate'}
	confirmTone={pendingUser?.is_active ? 'red' : 'blue'}
	onconfirm={confirmToggle}
/>
