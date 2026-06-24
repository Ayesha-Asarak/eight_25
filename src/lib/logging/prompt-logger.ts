/**
 * Prompt Logger — Phase 0 stub
 *
 * Full implementation in Phase 2.
 * Stubs are typed and exported so other modules can import without breaking.
 *
 * Responsibilities (Phase 2):
 * - formatPromptLogMarkdown: render a PromptLogEntry as a Markdown string
 * - writePromptLog: write the markdown file to docs/prompt-logs/{date}/{id}.md
 *   in development; write to /tmp in production (Vercel)
 */

import type { PromptLogEntry } from '@/types/prompt-log';

/**
 * Renders a PromptLogEntry as a Markdown document matching the required
 * submission format defined in .cursor/skills/prompt-logging/SKILL.md.
 *
 * @stub — implement in Phase 2
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatPromptLogMarkdown(_entry: PromptLogEntry): string {
  throw new Error('formatPromptLogMarkdown: not implemented — Phase 2');
}

/**
 * Writes a prompt log entry to the filesystem.
 *
 * Development: docs/prompt-logs/{YYYY-MM-DD}/{id}.md
 * Production:  /tmp/prompt-logs/{id}.md  (ephemeral — commit curated examples manually)
 *
 * @returns the file path written
 * @stub — implement in Phase 2
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function writePromptLog(_entry: PromptLogEntry): Promise<string> {
  throw new Error('writePromptLog: not implemented — Phase 2');
}
