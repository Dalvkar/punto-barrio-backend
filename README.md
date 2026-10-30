# Punto Barrio Backend

API REST de Punto Barrio para productos, inventario, ventas, caja, panel, reportes, proveedores, compras, clientes y fiados. Está construida con Node.js 22, Express, TypeScript, Prisma y PostgreSQL.

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

Las 10 pruebas levantan Express en un puerto efímero y sustituyen Prisma por dobles controlados. Cubren salud/consulta de base, 404, productos, inventario, dashboard, proveedores, compras, límite de fiado y abonos.

`npm run db:verify` valida el esquema Prisma con una URL ficticia, comprueba variables documentadas, busca conexiones incrustadas y archivos `.env` versionados, y exige una migración cuando cambia `schema.prisma`.

## Incremento final

- **Proveedores y compras:** `/api/suppliers` y `/api/purchases`; una compra repone stock, actualiza costo y registra el egreso dentro de una transacción.
- **Clientes y fiados:** `/api/customers`, `/api/credits` y `/api/credits/:id/payments`; el fiado descuenta stock y registra deuda sin ingreso de caja, mientras el abono actualiza saldos y caja.

La trazabilidad está en `specs/002-proveedores-y-fiados/` con `spec.md`, `plan.md`, `tasks.md` y `verification.md`. Las historias HU-07 a HU-10 viven en `docs/historias-de-usuario/` y los cuerpos de issues en `docs/github-issues.md`.

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

## Hooks y subagentes Codex

`.codex/agents/` contiene los subagentes nativos `frontend`, `backend` y `database` en formato TOML. `AGENTS.md` indica a Codex cuándo coordinarlos. `.codex/hooks.json` registra hooks nativos que protegen secretos y artefactos antes de `apply_patch`, validan después de cambios relevantes y bloquean comandos destructivos, mensajes no convencionales o commits con `npm run ci` fallando. `.codex/skills/punto-barrio/` agrega el skill del dominio con invariantes de stock, caja, compras y fiados.

Al abrir el repositorio con Codex por primera vez, revisa y habilita los hooks del proyecto. Solicita funcionalidades por alcance; una funcionalidad completa debe coordinar los tres agentes.

## Render

- Tipo: Web Service
- Build: `npm ci --include=dev && npm run db:generate && npm run build`
- Start: `npm run render:start`
- Health Check Path: `/api/health`
- Variables: `DATABASE_URL`, `FRONTEND_URL`, `NODE_VERSION=22`

Render establece `NODE_ENV=production`. El arranque aplica `prisma migrate deploy` y luego la semilla idempotente. La migración aditiva de proveedores, compras, clientes y fiados está versionada en `prisma/migrations/`.

## Estado de los requisitos de evaluación

| Requisito | Estado | Evidencia o acción |
| --- | --- | --- |
| Docente colaborador | Pendiente de verificación manual | Invitar al usuario del docente en los repositorios backend y frontend |
| Commits de los 3 | No aplica: trabajo individual | El grupo está compuesto por un solo estudiante y el historial remoto identifica sus commits |
| Tres partes desplegadas | Confirmado | Frontend y backend responden `200`; el health check comprueba PostgreSQL con `SELECT 1` |
| Workflow con pruebas | Implementado | Backend CI y Frontend CI ejecutan 19 pruebas totales, validación de commits y builds |
| Hook y subagente | Implementado | Hooks nativos y tres agentes de Codex dentro de `.codex/` |
| Sin secretos | Confirmado localmente | `.env` ignorados y control automático de archivos versionados |
| README completo | Implementado | Instalación, arquitectura, pruebas, CI, hooks, agentes y despliegue documentados |

Frontend relacionado:

- Repositorio: https://github.com/Dalvkar/punto-barrio-frontend
- Producción: https://punto-barrio-frontend.onrender.com

Antes de la defensa, confirma en GitHub que ambos workflows terminaron en verde, que el docente aceptó la invitación y que aparecen commits reales de los tres integrantes.
