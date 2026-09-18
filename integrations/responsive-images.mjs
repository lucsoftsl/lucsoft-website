// Writes narrower WebP copies of every image in public/media into the build,
// so pages can offer phones a right-sized file through srcset. Images uploaded
// in the CMS at any size are handled automatically on the next deploy.
import { readdir, mkdir } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

export const VARIANT_WIDTHS = [480, 800, 1200, 1600];
const VARIANT_QUALITY = 78;
const SOURCE_PATTERN = /^\/media\/.+\.(webp|jpe?g|png|avif)$/i;

/** Whether a site-relative image path ("/media/x.jpg") gets build-time variants. */
export const hasVariants = (src) => SOURCE_PATTERN.test(src);

/** Site-relative URL of the WebP variant of `src` at `width` pixels. */
export const variantPath = (src, width) => `/_img/${width}${src.replace(/\.\w+$/, '.webp')}`;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

export default function responsiveImages() {
  return {
    name: 'responsive-images',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const jobs = [];
        for await (const file of walk(join(outDir, 'media'))) {
          const src = `/${relative(outDir, file).split(sep).join('/')}`;
          if (!hasVariants(src)) continue;
          jobs.push(
            (async () => {
              const { width = 0 } = await sharp(file).metadata();
              for (const w of VARIANT_WIDTHS.filter((w) => w < width)) {
                const target = join(outDir, variantPath(src, w));
                await mkdir(dirname(target), { recursive: true });
                await sharp(file).resize({ width: w }).webp({ quality: VARIANT_QUALITY }).toFile(target);
              }
            })(),
          );
        }
        await Promise.all(jobs);
        logger.info(`Resized ${jobs.length} images`);
      },
    },
  };
}
