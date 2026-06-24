import type { CheerioAPI } from 'cheerio';

export interface ImageMetrics {
  imageCount: number;
  /** Percentage (0–100) of images WITH a non-empty alt attribute */
  altTextPercent: number;
}

/**
 * Counts total images and calculates the alt text coverage percentage.
 *
 * An image is considered to have alt text when:
 * - The alt attribute is present AND non-empty after trimming
 *
 * Returns 0 for both fields when no images exist (avoids division by zero).
 */
export function extractImages($: CheerioAPI): ImageMetrics {
  const images = $('img');
  const imageCount = images.length;

  if (imageCount === 0) {
    return { imageCount: 0, altTextPercent: 0 };
  }

  let withAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr('alt')?.trim() ?? '';
    if (alt.length > 0) withAlt++;
  });

  const altTextPercent = Math.round((withAlt / imageCount) * 100);

  return { imageCount, altTextPercent };
}
