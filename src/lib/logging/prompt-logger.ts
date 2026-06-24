import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { PromptLogEntry } from '@/types/prompt-log';

/**
 * Renders a PromptLogEntry as a Markdown document.
 * Format matches the spec in .cursor/skills/prompt-logging/SKILL.md
 * and docs/prompt-logs/README.md.
 */
export function formatPromptLogMarkdown(entry: PromptLogEntry): string {
  const usageNote = entry.usage
    ? `- Prompt tokens: ${entry.usage.promptTokens} | Completion: ${entry.usage.completionTokens} | Total: ${entry.usage.totalTokens}`
    : '- Token usage: not available';

  const parsedStatus = entry.parsedOutput
    ? '- Validation: passed'
    : '- Validation: FAILED (parsedOutput is undefined)';

  return `## Audit: ${entry.url} — ${entry.timestamp}

### System Prompt

${entry.systemPrompt}

---

### User Prompt (constructed)

${entry.userPrompt}

---

### Structured Input (sent to model)

\`\`\`json
${JSON.stringify(entry.structuredInput, null, 2)}
\`\`\`

---

### Raw Model Output

\`\`\`json
${entry.rawModelOutput}
\`\`\`

---

### Notes

- ID: ${entry.id}
- Model: ${entry.model}
- Timestamp: ${entry.timestamp}
${usageNote}
${parsedStatus}
- Redactions: OPENAI_API_KEY not included; full page HTML not sent to model
`;
}

/**
 * Writes a prompt log entry to the filesystem.
 *
 * Development (NODE_ENV !== 'production'):
 *   docs/prompt-logs/{YYYY-MM-DD}/{id}.md
 *
 * Production (Vercel):
 *   /tmp/prompt-logs/{id}.md  — ephemeral; commit curated examples manually
 *
 * @returns the absolute path of the written file
 */
export async function writePromptLog(
  entry: PromptLogEntry,
  /** Override the output directory (used in tests to avoid writing into the repo) */
  overrideDir?: string,
): Promise<string> {
  const markdown = formatPromptLogMarkdown(entry);

  let dirPath: string;

  if (overrideDir) {
    dirPath = overrideDir;
  } else if (process.env.NODE_ENV === 'production') {
    dirPath = '/tmp/prompt-logs';
  } else {
    const dateStr = entry.timestamp.slice(0, 10); // YYYY-MM-DD
    // cwd() is the repo root during Next.js dev/build
    dirPath = join(process.cwd(), 'docs', 'prompt-logs', dateStr);
  }

  await mkdir(dirPath, { recursive: true });

  const filePath = join(dirPath, `${entry.id}.md`);
  await writeFile(filePath, markdown, 'utf-8');

  return filePath;
}
