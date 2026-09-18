import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

// Every crawler may read the whole site. AI assistants' crawlers are also
// named explicitly, so there is no doubt that being cited and found through
// ChatGPT, Claude, Perplexity, Gemini and others is welcome.
const AI_CRAWLERS = [
  'GPTBot', // OpenAI
  'OAI-SearchBot', // ChatGPT search
  'ChatGPT-User', // ChatGPT browsing on a user's behalf
  'ClaudeBot', // Anthropic
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended', // Gemini
  'Applebot-Extended', // Apple Intelligence
  'meta-externalagent', // Meta AI
  'CCBot', // Common Crawl, used by many models
];

export const GET: APIRoute = () => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.map((bot) => `User-agent: ${bot}`),
    'Allow: /',
    '',
    `Sitemap: ${absoluteUrl('/sitemap-index.xml')}`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
