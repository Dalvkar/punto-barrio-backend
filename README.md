# Punto Barrio — Backend

API REST del sistema Punto Barrio, desarrollada con Node.js, Express, TypeScript, PostgreSQL y Prisma.

## Desarrollo

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Crea un archivo `.env` a partir de `.env.example` y configura `DATABASE_URL` y `FRONTEND_URL`.

## Render

- Tipo: Web Service
- Build Command: `npm ci --include=dev && npm run db:generate && npm run build`
- Start Command: `npm run render:start`
- Health Check Path: `/api/health`
- Variables: `DATABASE_URL`, `FRONTEND_URL`, `NODE_VERSION=22`

Render establece `NODE_ENV=production` automáticamente durante la ejecución. El proyecto fuerza la instalación de dependencias de desarrollo durante la compilación porque TypeScript, Prisma CLI y los tipos `@types/*` son necesarios para generar `dist/`.

