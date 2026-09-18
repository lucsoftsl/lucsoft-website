import type { APIRoute } from 'astro';
import { llmsFull } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(await llmsFull(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
