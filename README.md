# Punto Barrio Backend

API REST de Punto Barrio para productos, inventario, ventas, caja, panel de indicadores y reportes. Está construida con Node.js 22, Express, TypeScript, Prisma y PostgreSQL.

## Producción

- API: https://punto-barrio-backend.onrender.com/api
- Salud: https://punto-barrio-backend.onrender.com/api/health
- Repositorio: https://github.com/Dalvkar/punto-barrio-backend

El health check ejecuta `SELECT 1`; por eso una respuesta `200` también confirma la conexión del servicio con PostgreSQL.

## Configuración local

```bash
docker compose up -d
npm ci
copy .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

En Linux o macOS, usa `cp .env.example .env`. Variables:

- `DATABASE_URL`: conexión PostgreSQL.
- `PORT`: puerto local, por defecto `4000`.
- `FRONTEND_URL`: orígenes CORS separados por coma.

No confirmes `.env`; solo `.env.example` pertenece al repositorio.

`docker-compose.yml` levanta PostgreSQL 16 con la misma configuración local documentada en `.env.example`. Los datos permanecen en el volumen `tiendita_data`.

## Calidad y pruebas

```bash
npm test
npm run typecheck
npm run build
npm run db:verify
npm run ci
```

Las 5 pruebas levantan Express en un puerto efímero y sustituyen Prisma por dobles controlados. Cubren health/consulta de base de datos, contrato 404, validación de productos, normalización de datos y prevención de stock negativo.

`npm run db:verify` valida el esquema Prisma con una URL ficticia, comprueba variables documentadas, busca conexiones incrustadas y archivos `.env` versionados, y exige una migración cuando cambia `schema.prisma`.

## Integración continua

`.github/workflows/ci.yml` se ejecuta en pushes y pull requests con Node.js 22:

1. validación del mensaje Conventional Commit
2. `npm ci`
3. generación del cliente Prisma
4. control de seguridad de base de datos
5. pruebas HTTP
6. typecheck
7. build

Protege la rama `main` en GitHub y exige el check `Backend CI` para impedir merges cuando falle algún control.

## Hooks y subagentes Claude Code

`.claude/agents/` contiene los subagentes `frontend`, `backend` y `database`. `.claude/settings.json` registra hooks que protegen secretos y artefactos antes de editar, validan después de cambios relevantes y bloquean comandos destructivos, mensajes no convencionales o commits con `npm run ci` fallando.

Al abrir Claude Code por primera vez, revisa y acepta los hooks del repositorio. Solicita funcionalidades por alcance; una funcionalidad completa debe coordinar los tres agentes.

## Render

- Tipo: Web Service
- Build: `npm ci --include=dev && npm run db:generate && npm run build`
- Start: `npm run render:start`
- Health Check Path: `/api/health`
- Variables: `DATABASE_URL`, `FRONTEND_URL`, `NODE_VERSION=22`

Render establece `NODE_ENV=production`. El arranque actual aplica `prisma db push` y una semilla idempotente. Antes de introducir cambios de esquema en producción, crea migraciones en `prisma/migrations/` y planifica la transición a `prisma migrate deploy`.

## Estado de los requisitos de evaluación

| Requisito | Estado | Evidencia o acción |
| --- | --- | --- |
| Docente colaborador | Pendiente de verificación manual | Invitar al usuario del docente en los repositorios backend y frontend |
| Commits de los 3 | Pendiente | El historial remoto actual solo identifica a un autor; cada integrante debe subir commits propios |
| Tres partes desplegadas | Confirmado | Frontend y backend responden `200`; el health check comprueba PostgreSQL con `SELECT 1` |
| Workflow con pruebas | Implementado | Backend CI y Frontend CI ejecutan 11 pruebas totales, validación de commits y builds |
| Hook y subagente | Implementado | Hooks de Claude Code y tres agentes dentro de `.claude/` |
| Sin secretos | Confirmado localmente | `.env` ignorados y control automático de archivos versionados |
| README completo | Implementado | Instalación, arquitectura, pruebas, CI, hooks, agentes y despliegue documentados |

Frontend relacionado:

- Repositorio: https://github.com/Dalvkar/punto-barrio-frontend
- Producción: https://punto-barrio-frontend.onrender.com

Antes de la defensa, confirma en GitHub que ambos workflows terminaron en verde, que el docente aceptó la invitación y que aparecen commits reales de los tres integrantes.
