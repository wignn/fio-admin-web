import { json } from '@sveltejs/kit';
import { hasAdminSession, verifyServerKey } from '$lib/server/admin-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!hasAdminSession(event)) {
		return json({ authenticated: false }, { status: 401 });
	}
	const identity = await verifyServerKey();
	if (!identity) {
		return json({ authenticated: false }, { status: 401 });
	}
	return json(identity);
};
