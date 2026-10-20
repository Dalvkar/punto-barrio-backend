const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const changed = String(input.tool_input?.file_path || input.tool_input?.path || '').replaceAll('\\', '/');
const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..'));
if (!changed || changed.includes('/.claude/') || changed.startsWith('.claude/')) process.exit(0);

const command = changed.endsWith('prisma/schema.prisma')
  ? ['npm', ['run', 'db:verify']]
  : /\.(ts|json|mjs)$/.test(changed) ? ['npm', ['test']] : null;
if (!command) process.exit(0);

const result = spawnSync(command[0], command[1], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
if (result.status !== 0) {
  process.stderr.write(`Validación posterior fallida para ${changed}.\n${result.stdout || ''}${result.stderr || ''}`);
  process.exit(2);
}
