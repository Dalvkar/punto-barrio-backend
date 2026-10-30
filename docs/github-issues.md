# Issues propuestos para punto barrio backend

Estos cuerpos están listos para crear issues en `Dalvkar/punto-barrio-backend`. No contienen secretos ni datos de producción.

## Issue 1 feat suppliers API

**Título:** `feat(suppliers): administrar proveedores activos`

Implementar `GET /api/suppliers` y `POST /api/suppliers` con validación Zod, orden por nombre y conflicto por nombre duplicado.

**Aceptación:** cumple HU-07, devuelve errores 400/409 estables y tiene prueba HTTP.

## Issue 2 feat purchases transaction

**Título:** `feat(purchases): registrar compras y reponer inventario`

Crear una compra transaccional que calcule el total, incremente stock, actualice costo y registre egreso de caja.

**Aceptación:** cumple HU-08, evita cambios parciales y tiene prueba de integración con doble Prisma.

## Issue 3 feat customers credit limits

**Título:** `feat(customers): administrar clientes y límites de crédito`

Implementar listado y alta de clientes con límite no negativo, saldo calculado por operaciones y estado activo.

**Aceptación:** cumple HU-09 y expone saldo y crédito disponible.

## Issue 4 feat credits and payments

**Título:** `feat(credits): registrar fiados y abonos atómicos`

Registrar fiados con control de stock/límite y abonos que actualicen saldos, estado y caja.

**Aceptación:** cumple HU-10; el fiado no crea ingreso y el abono no supera el saldo.
