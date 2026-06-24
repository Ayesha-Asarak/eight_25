import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractCtas } from './extract-ctas';

const sample = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/sample-page.html'), 'utf-8'),
);
const edge = cheerio.load(
  readFileSync(join(__dirname, '__fixtures__/edge-case.html'), 'utf-8'),
);

describe('extractCtas', () => {
  it('detects CTAs on the sample page', () => {
    // sample-page has:
    //   - <a class="btn">Contact Us</a> (nav) — matches class + text
    //   - <a class="btn btn-primary">Get Started</a> — matches class + text
    //   - <a class="cta-link">View Our Work</a> — matches class
    //   - <button>Request a Quote</button> — button element
    const count = extractCtas(sample);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('returns 0 when there are no CTAs', () => {
    expect(extractCtas(edge)).toBe(0);
  });

  it('detects a plain <button>', () => {
    const $ = cheerio.load('<button>Submit</button>');
    expect(extractCtas($)).toBe(1);
  });

  it('detects an <a> with a CTA class', () => {
    const $ = cheerio.load('<a href="/go" class="btn-primary">Go</a>');
    expect(extractCtas($)).toBe(1);
  });

  it('detects an <a> with CTA text', () => {
    const $ = cheerio.load('<a href="/start">Get Started</a>');
    expect(extractCtas($)).toBe(1);
  });

  it('does not double-count an element matching both class and text rules', () => {
    const $ = cheerio.load('<a href="/start" class="btn">Get Started</a>');
    expect(extractCtas($)).toBe(1);
  });

  it('detects role="button"', () => {
    const $ = cheerio.load('<div role="button">Click me</div>');
    expect(extractCtas($)).toBe(1);
  });
});
