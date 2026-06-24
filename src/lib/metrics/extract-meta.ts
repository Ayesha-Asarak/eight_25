import type { CheerioAPI } from 'cheerio';

export interface MetaFields {
  metaTitle: string | null;
  metaDescription: string | null;
}

/**
 * Extracts the page's meta title and meta description.
 *
 * Returns null for each field when:
 * - The element is absent
 * - The value is present but empty after trimming
 */
export function extractMeta($: CheerioAPI): MetaFields {
  const rawTitle = $('title').first().text().trim();
  const metaTitle = rawTitle.length > 0 ? rawTitle : null;

  const rawDescription = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const metaDescription = rawDescription.length > 0 ? rawDescription : null;

  return { metaTitle, metaDescription };
}
