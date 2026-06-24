import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractMeta } from './extract-meta';

const sample = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/sample-page.html'), 'utf-8'),
);
const edge = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/edge-case.html'), 'utf-8'),
);

describe('extractMeta', () => {
  it('returns title and description from a fully populated page', () => {
    const result = extractMeta(sample);
    expect(result.metaTitle).toBe('Sample Agency Page — EIGHT25MEDIA');
    expect(result.metaDescription).toBe(
      'We build high-performing marketing websites for ambitious brands.',
    );
  });

  it('returns null for both when title and description are absent', () => {
    const result = extractMeta(edge);
    expect(result.metaTitle).toBeNull();
    expect(result.metaDescription).toBeNull();
  });

  it('returns null for an empty title element', () => {
    const $ = cheerio.load('<html><head><title>   </title></head><body></body></html>');
    expect(extractMeta($).metaTitle).toBeNull();
  });

  it('returns null for an empty description content attribute', () => {
    const $ = cheerio.load(
      '<html><head><meta name="description" content="  " /></head><body></body></html>',
    );
    expect(extractMeta($).metaDescription).toBeNull();
  });
});
