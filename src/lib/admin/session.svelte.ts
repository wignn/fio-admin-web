import { goto } from '$app/navigation';
import type { AdminIdentity } from './types';

let identity = $state<AdminIdentity | null>(null);
let ready = $state(false);
let verifying = $state(false);

export const adminSession = {
	get identity() {
		return identity;
	},
	get ready() {
		return ready;
	},
	get verifying() {
		return verifying;
	},
	get isAuthenticated() {
		return Boolean(identity);
	},
	get isAdmin() {
		return identity?.role === 'admin';
	},
	load() {},
	touch() {},
	set(_key: string, admin: AdminIdentity) {
		identity = admin;
		ready = true;
	},
	setVerifying(value: boolean) {
		verifying = value;
	},
	setReady(value: boolean) {
		ready = value;
	},
	setIdentity(admin: AdminIdentity | null) {
		identity = admin;
	},
	async clear(redirect = true) {
		identity = null;
		ready = true;
		verifying = false;
		try {
			await fetch('/api/admin/logout', { method: 'POST' });
		} catch {
			// best effort logout
		}
		if (redirect && typeof window !== 'undefined' && window.location.pathname !== '/login') {
			void goto('/login');
		}
	}
};
