// Build-time facts about images in public/: intrinsic size (for width/height,
// so nothing shifts while loading) and srcset candidates (for right-sized files).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { imageMetadata } from 'astro/assets/utils';
import { VARIANT_WIDTHS, hasVariants, variantPath } from '../../integrations/responsive-images.mjs';
import { withBase } from './url';

export interface ImageSize {
  width: number;
  height: number;
}

const sizes = new Map<string, Promise<ImageSize>>();

async function readSize(src: string): Promise<ImageSize> {
  const file = join(process.cwd(), 'public', src);
  const data = await readFile(file).catch(() => {
    throw new Error(`Image not found: public${src} — check the image path in the CMS.`);
  });
  const { width, height } = await imageMetadata(data, src);
  return { width, height };
}

/** Intrinsic size of an image in public/, e.g. "/media/og.jpg". */
export function imageSize(src: string): Promise<ImageSize> {
  const cached = sizes.get(src) ?? readSize(src);
  sizes.set(src, cached);
  return cached;
}

/**
 * srcset listing the WebP variants written by the responsive-images integration
 * plus the original. Undefined in dev, where the variants don't exist.
 */
export async function srcsetFor(src: string): Promise<string | undefined> {
  if (!import.meta.env.PROD || !hasVariants(src)) return undefined;
  const { width } = await imageSize(src);
  const variants = VARIANT_WIDTHS.filter((w) => w < width).map((w) => `${withBase(variantPath(src, w))} ${w}w`);
  return [...variants, `${withBase(src)} ${width}w`].join(', ');
}
