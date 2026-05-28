import { goto } from '$app/navigation';
import type { AdminIdentity } from './types';

const STORAGE_KEY = 'atlsd_admin_key';

let identity = $state<AdminIdentity | null>(null);
let apiKey = $state('');
let ready = $state(false);
let verifying = $state(false);

export const adminSession = {
	get identity() {
		return identity;
	},
	get apiKey() {
		return apiKey;
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
	load() {
		if (typeof sessionStorage === 'undefined') return;
		apiKey = sessionStorage.getItem(STORAGE_KEY) ?? '';
		ready = Boolean(apiKey);
	},
	touch() {
		if (typeof sessionStorage !== 'undefined' && apiKey) sessionStorage.setItem(STORAGE_KEY, apiKey);
	},
	set(key: string, admin: AdminIdentity) {
		apiKey = key;
		identity = admin;
		ready = true;
		if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(STORAGE_KEY, key);
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
		identity = null;
		apiKey = '';
		ready = true;
		verifying = false;
		if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
		if (redirect && typeof window !== 'undefined' && window.location.pathname !== '/login') {
			void goto('/login');
		}
	}
};
