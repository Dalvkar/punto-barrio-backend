import { execFileSync } from 'node:child_process';

const message = execFileSync('git', ['log', '-1', '--pretty=%s'], { encoding: 'utf8' }).trim();
const conventional = /^(feat|fix|docs|test|refactor|chore|ci|build|perf|style)(\([a-z0-9._-]+\))?!?:\s\S+/;

if (!conventional.test(message)) {
  console.error(`Mensaje de commit no permitido: "${message}"`);
  console.error('Usa Conventional Commits, por ejemplo: feat(api): agregar búsqueda');
  process.exit(1);
}

console.log(`Mensaje válido: ${message}`);
