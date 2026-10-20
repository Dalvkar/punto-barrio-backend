const fs = require('node:fs');
const path = require('node:path');

const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
const toolInput = input.tool_input || {};
const paths = [toolInput.file_path, toolInput.path, ...(toolInput.edits || []).map((edit) => edit.file_path || edit.path)].filter(Boolean);
const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || path.join(__dirname, '..', '..'));

for (const candidate of paths) {
  const absolute = path.isAbsolute(candidate) ? candidate : path.resolve(root, candidate);
  const relative = path.relative(root, absolute).replaceAll('\\', '/');
  const name = relative.toLowerCase().split('/').at(-1) || '';
  const secretEnv = (name === '.env' || name.startsWith('.env.')) && name !== '.env.example';
  const generated = /(^|\/)(node_modules|dist|\.git)(\/|$)/i.test(relative);
  if (relative.startsWith('..') || secretEnv || generated) {
    process.stderr.write(`Edición bloqueada para proteger el proyecto: ${relative || candidate}\n`);
    process.exit(2);
  }
}
