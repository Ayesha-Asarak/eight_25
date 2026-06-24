import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { ParseError } from './errors';

/**
 * Loads an HTML string into Cheerio and returns the API root.
 * All metric extractors receive this root as their sole DOM dependency.
 *
 * Throws ParseError if the input is empty or whitespace-only.
 */
export function parseHtml(html: string): CheerioAPI {
  if (!html || !html.trim()) {
    throw new ParseError('Received empty HTML string');
  }

  return cheerio.load(html);
}
