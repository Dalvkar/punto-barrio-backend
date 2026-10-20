const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const patch = String(input.tool_input?.command || '');
const root = path.resolve(__dirname, '..', '..');
const changed = [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)]
  .map((match) => match[1].trim().replaceAll('\\', '/'))
  .filter((file) => !file.startsWith('.codex/'));

if (changed.length === 0) process.exit(0);

const task = changed.some((file) => file.endsWith('prisma/schema.prisma'))
  ? ['npm', ['run', 'db:verify']]
  : changed.some((file) => /\.(ts|json|mjs)$/.test(file))
    ? ['npm', ['test']]
    : null;

if (!task) process.exit(0);

const result = spawnSync(task[0], task[1], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.stderr.write(`Validación posterior fallida para ${changed.join(', ')}.\n${result.stdout || ''}${result.stderr || ''}`);
  process.exit(2);
}
