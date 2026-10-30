# Mapa del proyecto Punto Barrio

## Repositorios

- Backend: `punto-barrio-backend`, Express 5, TypeScript, Prisma 6 y PostgreSQL.
- Frontend: `../frontend`, React 18, TypeScript, Vite y Tailwind.
- Producción: frontend y backend desplegados por separado en Render; `VITE_API_URL` apunta al prefijo `/api` del backend.

## Módulos

1. Dashboard.
2. Productos.
3. Inventario.
4. Ventas.
5. Caja.
6. Reportes.
7. Proveedores y compras.
8. Clientes y fiados.

## Rutas ampliadas

- `/api/suppliers` y `/api/purchases`.
- `/api/customers` y `/api/credits`.
- `/api/credits/:id/payments` para abonos.

## Verificación

```powershell
cd backend
npm run ci
cd ..\frontend
npm test
npm run build
```

Revisa además las migraciones en `backend/prisma/migrations`, los cuerpos de issues en `docs/github-issues.md` y la especificación activa en `specs/002-proveedores-y-fiados`.
