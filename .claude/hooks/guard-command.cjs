const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const command = String(input.tool_input?.command || '');
const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..'));

if (/\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-[^\s]*f|\bgit\s+push\b[^\n]*\s--force\b/i.test(command)) {
  process.stderr.write('Comando destructivo bloqueado; usa una alternativa reversible.\n');
  process.exit(2);
}
if (!/\bgit\s+commit\b/i.test(command)) process.exit(0);

const match = command.match(/(?:^|\s)-m\s+(?:"([^"]+)"|'([^']+)'|([^\s]+))/i);
const message = match && (match[1] || match[2] || match[3]);
if (!message || !/^(feat|fix|docs|test|refactor|chore|ci|build|perf|style)(\([a-z0-9._-]+\))?!?:\s\S+/.test(message)) {
  process.stderr.write('Commit bloqueado: usa Conventional Commits mediante -m.\n');
  process.exit(2);
}

const result = spawnSync('npm', ['run', 'ci'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
if (result.status !== 0) {
  process.stderr.write(`Commit bloqueado: falló npm run ci.\n${result.stdout || ''}${result.stderr || ''}`);
  process.exit(2);
}
