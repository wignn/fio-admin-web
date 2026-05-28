import { json } from '@sveltejs/kit';
import { clearAdminSession } from '$lib/server/admin-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	clearAdminSession(event);
	return json({ ok: true });
};
