// Copies files that live outside the Astro project (the hosted app legal pages
// in /root, app-ads.txt, output1.pdf) into the build output unchanged, so their
// public URLs keep working exactly as before.
import { cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/** @param {string[]} paths repo-relative files or folders */
export default function legacyFiles(paths) {
  return {
    name: 'legacy-files',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        for (const path of paths) {
          const from = fileURLToPath(new URL(`../${path}`, import.meta.url));
          const to = fileURLToPath(new URL(path, dir));
          try {
            await access(from);
          } catch {
            logger.warn(`Skipping missing legacy path: ${path}`);
            continue;
          }
          await cp(from, to, { recursive: true, filter: (src) => !src.endsWith('.DS_Store') });
          logger.info(`Copied ${path}`);
        }
      },
    },
  };
}
