# Verificación Punto Barrio operación ampliada

## Matriz de trazabilidad

| Historia | Requisito | Datos | Backend | Frontend | Evidencia automatizada |
| --- | --- | --- | --- | --- | --- |
| HU-07 | RF-10 | `Supplier` | `routes/suppliers.ts` | `SuppliersPurchases` | validación API y navegación UI |
| HU-08 | RF-10 | `Purchase`, `PurchaseItem`, `Product`, `CashMovement` | `routes/purchases.ts` | `SuppliersPurchases` | compra transaccional y carga UI |
| HU-09 | RF-11 | `Customer` | `routes/customers.ts` | `CustomersCredits` | límite inválido y navegación UI |
| HU-10 | RF-11 | `Credit`, `CreditItem`, `CreditPayment`, `Product`, `CashMovement` | `routes/credits.ts` | `CustomersCredits` | límite de crédito y abono |

## Evidencia del cambio

- Migración: `prisma/migrations/20261030120000_add_suppliers_purchases_credits/migration.sql`.
- Esquema y semilla: `prisma/schema.prisma`, `prisma/seed.ts`.
- Seguridad: `scripts/verify-database-safety.mjs` detecta migraciones nuevas rastreadas o no rastreadas.
- Historias: `docs/historias-de-usuario/`.
- Issues preparados: `docs/github-issues.md` en ambos repositorios.

## Comandos de verificación

```powershell
cd backend
npm run ci
git diff --check

cd ..\frontend
npm test
npm run build
git diff --check
```

## Resultado registrado

- Backend: 10 pruebas aprobadas, typecheck y build aprobados.
- Frontend: 9 pruebas aprobadas y build aprobado.
- Prisma: format, validate, generate y control de seguridad aprobados.
- Git: `diff --check` sin errores.

## Límites de la evidencia

Las pruebas backend usan dobles de Prisma y no sustituyen una prueba contra PostgreSQL real. Los issues remotos y el despliegue no se consideran realizados hasta conectar GitHub, publicar commits y ejecutar la migración en Render.
