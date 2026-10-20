import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(backendRoot, 'prisma', 'schema.prisma');
const envExamplePath = join(backendRoot, '.env.example');
const packagePath = join(backendRoot, 'package.json');
const errors = [];
const warnings = [];

const schema = readFileSync(schemaPath, 'utf8');
const envExample = readFileSync(envExamplePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

if (!/provider\s*=\s*"postgresql"/.test(schema)) {
  errors.push('El datasource de Prisma debe usar PostgreSQL.');
}

if (!/url\s*=\s*env\("DATABASE_URL"\)/.test(schema)) {
  errors.push('El datasource debe obtener la URL desde env("DATABASE_URL").');
}

if (/postgres(?:ql)?:\/\/[^\s"']+/i.test(schema)) {
  errors.push('schema.prisma contiene una URL de PostgreSQL incrustada.');
}

for (const variable of ['DATABASE_URL', 'PORT', 'FRONTEND_URL']) {
  if (!new RegExp(`^${variable}=`, 'm').test(envExample)) {
    errors.push(`.env.example no documenta ${variable}.`);
  }
}

function git(args) {
  return spawnSync('git', ['-C', backendRoot, ...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
}

const tracked = git(['ls-files']);
if (tracked.status === 0) {
  const unsafeEnvFiles = tracked.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((file) => /(^|\/)\.env(?:\.|$)/.test(file))
    .filter((file) => !/\.example$|\.sample$|\.template$/.test(file));

  if (unsafeEnvFiles.length > 0) {
    errors.push(`Hay archivos de entorno versionados: ${unsafeEnvFiles.join(', ')}`);
  }
} else {
  warnings.push('No se pudo comprobar con Git si existen archivos .env versionados.');
}

const diffSpecs = [];
if (process.env.DATABASE_GUARD_BASE) {
  diffSpecs.push([`${process.env.DATABASE_GUARD_BASE}...HEAD`]);
} else if (process.env.CI) {
  diffSpecs.push(['HEAD^', 'HEAD']);
}
diffSpecs.push(['--cached'], []);

const changed = new Set();
for (const spec of diffSpecs) {
  const result = git(['diff', '--name-only', ...spec]);
  if (result.status === 0) {
    for (const file of result.stdout.split(/\r?\n/).filter(Boolean)) changed.add(file);
  }
}

if (changed.has('prisma/schema.prisma')) {
  const migrationChanged = [...changed].some((file) => file.startsWith('prisma/migrations/'));
  if (!migrationChanged) {
    errors.push('schema.prisma cambió sin una migración versionada en prisma/migrations/.');
  }
}

const renderStart = packageJson.scripts?.['render:start'] ?? '';
if (/prisma\s+db\s+push/.test(renderStart)) {
  warnings.push('render:start usa prisma db push; conviene migrar el despliegue a prisma migrate deploy.');
}

const prismaCli = join(backendRoot, 'node_modules', 'prisma', 'build', 'index.js');
const validation = spawnSync(process.execPath, [prismaCli, 'validate', '--schema', schemaPath], {
  cwd: backendRoot,
  encoding: 'utf8',
  windowsHide: true,
  env: {
    ...process.env,
    DATABASE_URL: 'postgresql://validation:validation@localhost:5432/validation?schema=public',
  },
});

if (validation.status !== 0) {
  errors.push('Prisma rechazó schema.prisma. Ejecuta prisma validate para ver el detalle.');
}

for (const warning of warnings) console.warn(`ADVERTENCIA: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);

if (errors.length > 0) process.exit(1);
console.log('OK: controles de seguridad de base de datos superados.');
