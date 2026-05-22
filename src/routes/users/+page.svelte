<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowDownUp, CheckCircle2, KeyRound, RefreshCw, Search, ShieldAlert, UserRoundCheck, Users } from 'lucide-svelte';
	import { fetchUsers, toggleUser, updateUserPlan } from '$lib/admin/client';
	import type { AdminUser, PlanId } from '$lib/admin/types';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import LoadingBlock from '$lib/components/LoadingBlock.svelte';
	import PlanBadge from '$lib/components/PlanBadge.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	const planOptions: PlanId[] = ['free', 'starter', 'pro', 'enterprise'];
	type SortKey = 'created_at' | 'name' | 'plan' | 'active_keys';

	let users = $state<AdminUser[]>([]);
	let loading = $state(true);
	let error = $state('');
	let query = $state('');
	let selectedPlan = $state('all');
	let selectedStatus = $state('all');
	let sortKey = $state<SortKey>('created_at');
	let sortAsc = $state(false);
	let pendingUser = $state<AdminUser | null>(null);
	let pendingPlan = $state('');
	let confirmPlanOpen = $state(false);
	let confirmToggleOpen = $state(false);

	const filteredUsers = $derived(
		users
			.filter((user) => {
				const q = query.trim().toLowerCase();
				const matchesQuery = !q || user.email.toLowerCase().includes(q) || user.name.toLowerCase().includes(q) || user.id.toLowerCase().includes(q);
				const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan;
				const matchesStatus =
					selectedStatus === 'all' ||
					(selectedStatus === 'active' ? user.is_active : selectedStatus === 'inactive' ? !user.is_active : selectedStatus === 'verified' ? user.email_verified : user.active_keys === 0);
				return matchesQuery && matchesPlan && matchesStatus;
			})
			.sort((a, b) => {
				const direction = sortAsc ? 1 : -1;
				if (sortKey === 'created_at') return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
				if (sortKey === 'active_keys') return (a.active_keys - b.active_keys) * direction;
				return String(a[sortKey]).localeCompare(String(b[sortKey])) * direction;
			})
	);

	const activeCount = $derived(users.filter((user) => user.is_active).length);
	const verifiedCount = $derived(users.filter((user) => user.email_verified).length);
	const noKeyCount = $derived(users.filter((user) => user.active_keys === 0).length);
	const totalKeys = $derived(users.reduce((total, user) => total + user.active_keys, 0));

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
	}

	function relativeDate(value: string) {
		const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
		if (days <= 0) return 'today';
		if (days === 1) return '1 day ago';
		return `${days} days ago`;
	}

	function initials(user: AdminUser) {
		return user.name
			.split(' ')
			.map((part) => part[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	function sortBy(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
			return;
		}
		sortKey = key;
		sortAsc = key !== 'created_at';
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
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="text-sm font-bold text-accent">User operations</p>
			<h1 class="mt-1 text-4xl font-black tracking-tight text-text">Users</h1>
			<p class="mt-2 text-sm text-text-muted">Manage activation, verification risk, API key coverage, and plan assignments.</p>
		</div>
		<button class="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-glow disabled:opacity-60" onclick={load} disabled={loading}>
			<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" /> {loading ? 'Refreshing...' : 'Refresh'}
		</button>
	</div>

	<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		<StatCard label="Total users" value={users.length} help={`${filteredUsers.length} in current view`} icon={Users} />
		<StatCard label="Active" value={activeCount} help={`${users.length - activeCount} inactive`} icon={UserRoundCheck} tone="green" />
		<StatCard label="Verified emails" value={verifiedCount} help={`${users.length - verifiedCount} need verification`} icon={CheckCircle2} tone="green" />
		<StatCard label="API keys" value={totalKeys} help={`${noKeyCount} users without keys`} icon={KeyRound} tone={noKeyCount ? 'amber' : 'blue'} />
	</div>

	<div class="rounded-3xl border border-border bg-surface p-4 shadow-sm">
		<div class="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
			<div class="flex items-center gap-2 rounded-2xl border border-border bg-surface-2 px-3 py-2">
				<Search class="h-4 w-4 text-text-dim" />
				<input bind:value={query} class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-dim" placeholder="Search name, email, or user id..." />
			</div>
			<div class="flex flex-wrap gap-2">
				{#each ['all', ...planOptions] as plan}
					<button class="rounded-xl border px-3 py-2 text-xs font-bold capitalize transition {selectedPlan === plan ? 'border-accent bg-accent text-white' : 'border-border bg-surface-2 text-text-muted hover:text-text'}" onclick={() => (selectedPlan = plan)}>{plan}</button>
				{/each}
			</div>
			<select bind:value={selectedStatus} class="rounded-2xl border border-border bg-surface-2 px-3 py-2 text-sm font-bold text-text outline-none">
				<option value="all">All status</option>
				<option value="active">Active</option>
				<option value="inactive">Inactive</option>
				<option value="verified">Verified</option>
				<option value="no-key">No API key</option>
			</select>
		</div>
	</div>

	{#if loading}
		<LoadingBlock label="Loading users..." />
	{:else if error}
		<EmptyState title="Users unavailable" description={error} />
	{:else if filteredUsers.length === 0}
		<EmptyState title="No users found" description="Try changing the search or filters." />
	{:else}
		<div class="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
			<div class="flex flex-col gap-2 border-b border-border bg-surface-2/50 p-4 sm:flex-row sm:items-center sm:justify-between">
				<p class="text-sm font-bold text-text">{filteredUsers.length} users</p>
				<p class="text-xs text-text-dim">Sorted by {sortKey.replace('_', ' ')} · {sortAsc ? 'ascending' : 'descending'}</p>
			</div>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-border text-sm">
					<thead class="bg-surface-2 text-left text-xs font-black uppercase tracking-wide text-text-dim">
						<tr>
							<th class="px-4 py-3"><button class="inline-flex items-center gap-1" onclick={() => sortBy('name')}>User <ArrowDownUp class="h-3 w-3" /></button></th>
							<th class="px-4 py-3"><button class="inline-flex items-center gap-1" onclick={() => sortBy('plan')}>Plan <ArrowDownUp class="h-3 w-3" /></button></th>
							<th class="px-4 py-3">Status</th>
							<th class="px-4 py-3"><button class="inline-flex items-center gap-1" onclick={() => sortBy('active_keys')}>Keys <ArrowDownUp class="h-3 w-3" /></button></th>
							<th class="px-4 py-3"><button class="inline-flex items-center gap-1" onclick={() => sortBy('created_at')}>Created <ArrowDownUp class="h-3 w-3" /></button></th>
							<th class="px-4 py-3 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredUsers as user}
							<tr class="transition hover:bg-surface-2/55">
								<td class="px-4 py-4">
									<div class="flex items-center gap-3">
										<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-sm font-black text-accent ring-1 ring-accent/15">{initials(user)}</div>
										<div class="min-w-0">
											<p class="truncate font-bold text-text">{user.name}</p>
											<p class="truncate text-xs text-text-muted">{user.email}</p>
											<p class="mt-1 truncate font-mono text-[11px] text-text-dim">{user.id}</p>
										</div>
									</div>
								</td>
								<td class="px-4 py-4"><PlanBadge plan={user.plan} /></td>
								<td class="px-4 py-4"><div class="flex flex-wrap gap-1.5"><StatusBadge tone={user.is_active ? 'green' : 'red'} label={user.is_active ? 'Active' : 'Inactive'} /><StatusBadge tone={user.email_verified ? 'green' : 'amber'} label={user.email_verified ? 'Verified' : 'Unverified'} /></div></td>
								<td class="px-4 py-4"><span class="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs font-bold text-text"><KeyRound class="h-3 w-3 text-text-dim" />{user.active_keys}</span></td>
								<td class="px-4 py-4 text-text-muted"><p>{formatDate(user.created_at)}</p><p class="mt-1 text-xs text-text-dim">{relativeDate(user.created_at)}</p></td>
								<td class="px-4 py-4">
									<div class="flex justify-end gap-2">
										<select class="rounded-xl border border-border bg-surface px-2 py-1.5 text-xs font-bold text-text outline-none" value={user.plan} onchange={(e) => askPlanChange(user, e.currentTarget.value)}>
											{#each planOptions as plan}<option value={plan}>{plan}</option>{/each}
										</select>
										<button class="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-text-muted transition hover:bg-surface-2 hover:text-text" onclick={() => askToggle(user)}>{user.is_active ? 'Deactivate' : 'Activate'}</button>
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

<ConfirmDialog bind:open={confirmPlanOpen} title="Change user plan" description={`Change ${pendingUser?.email ?? 'this user'} from ${pendingUser?.plan ?? '-'} to ${pendingPlan}? This updates their backend limits after core sync refreshes.`} confirmLabel="Change plan" onconfirm={confirmPlanChange} />

<ConfirmDialog bind:open={confirmToggleOpen} title={pendingUser?.is_active ? 'Deactivate user' : 'Activate user'} description={`${pendingUser?.is_active ? 'Deactivate' : 'Activate'} ${pendingUser?.email ?? 'this user'}? This affects their ability to authenticate and use API keys.`} confirmLabel={pendingUser?.is_active ? 'Deactivate' : 'Activate'} confirmTone={pendingUser?.is_active ? 'red' : 'blue'} onconfirm={confirmToggle} />
