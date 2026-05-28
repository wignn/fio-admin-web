import { proxyBackend } from '$lib/server/admin-proxy';
import type { RequestHandler } from './$types';

const forward: RequestHandler = (event) => proxyBackend(event, 'control', event.params.path);

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
