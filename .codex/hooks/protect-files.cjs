const fs = require('node:fs');
const path = require('node:path');

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const patch = String(input.tool_input?.command || '');
const root = path.resolve(__dirname, '..', '..');
const paths = [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((match) => match[1].trim());

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
}

for (const candidate of paths) {
  const absolute = path.isAbsolute(candidate) ? candidate : path.resolve(root, candidate);
  const relative = path.relative(root, absolute).replaceAll('\\', '/');
  const name = relative.toLowerCase().split('/').at(-1) || '';
  const secretEnv = (name === '.env' || name.startsWith('.env.')) && name !== '.env.example';
  const generated = /(^|\/)(node_modules|dist|\.git)(\/|$)/i.test(relative);

  if (relative.startsWith('..') || path.isAbsolute(relative) || secretEnv || generated) {
    deny(`Edición bloqueada para proteger el proyecto: ${relative || candidate}`);
    process.exit(0);
  }
}
