import { goto } from '$app/navigation';
import type { AdminIdentity } from './types';

const STORAGE_KEY = 'atlsd_admin_key';

let apiKey = $state<string | null>(null);
let identity = $state<AdminIdentity | null>(null);
let ready = $state(false);
let verifying = $state(false);

export const adminSession = {
	get apiKey() {
		return apiKey;
	},
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
		return Boolean(apiKey && identity);
	},
	get isAdmin() {
		return identity?.role === 'admin';
	},
	load() {
		if (typeof sessionStorage === 'undefined') return;
		apiKey = sessionStorage.getItem(STORAGE_KEY);
	},
	set(key: string, admin: AdminIdentity) {
		apiKey = key;
		identity = admin;
		ready = true;
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem(STORAGE_KEY, key);
		}
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
	clear(redirect = true) {
		apiKey = null;
		identity = null;
		ready = true;
		verifying = false;
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.removeItem(STORAGE_KEY);
		}
		if (redirect && typeof window !== 'undefined' && window.location.pathname !== '/login') {
			void goto('/login');
		}
	}
};
