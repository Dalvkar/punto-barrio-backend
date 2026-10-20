const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const command = String(input.tool_input?.command || '');
const root = path.resolve(__dirname, '..', '..');

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

if (/\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-[^\s]*f|\bgit\s+push\b[^\n]*\s--force(?:-with-lease)?\b/i.test(command)) {
  deny('Comando destructivo bloqueado; usa una alternativa reversible.');
  process.exit(0);
}

if (!/\bgit\s+commit\b/i.test(command)) process.exit(0);

const match = command.match(/(?:^|\s)-m\s+(?:"([^"]+)"|'([^']+)'|([^\s]+))/i);
const message = match && (match[1] || match[2] || match[3]);
if (!message || !/^(feat|fix|docs|test|refactor|chore|ci|build|perf|style)(\([a-z0-9._-]+\))?!?:\s\S+/.test(message)) {
  deny('Commit bloqueado: usa Conventional Commits mediante -m.');
  process.exit(0);
}

const result = spawnSync('npm', ['run', 'ci'], {
  cwd: root,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  deny(`Commit bloqueado: falló npm run ci.\n${result.stdout || ''}${result.stderr || ''}`);
}
