import type { APIRoute } from 'astro';
import { llmsIndex } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(await llmsIndex(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
