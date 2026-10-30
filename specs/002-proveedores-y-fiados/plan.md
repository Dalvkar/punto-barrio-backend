# Plan técnico Punto Barrio operación ampliada

## Alcance

Implementar M07 y M08 sobre la arquitectura React → API Express → Prisma → PostgreSQL sin alterar el comportamiento de los seis módulos existentes.

## Diseño de datos

- `Supplier` 1:N `Purchase`; `Purchase` 1:N `PurchaseItem`; cada ítem referencia `Product`.
- `Customer` 1:N `Credit`; `Credit` 1:N `CreditItem` y 1:N `CreditPayment`.
- `Product` conserva relaciones históricas con compras y fiados.
- Índices cubren listados por proveedor/cliente, fecha, producto y estado.

## Contrato HTTP

| Método | Ruta | Propósito |
| --- | --- | --- |
| GET/POST | `/api/suppliers` | Listar y crear proveedores |
| GET/POST | `/api/purchases` | Listar y registrar compras |
| GET/POST | `/api/customers` | Listar y crear clientes |
| GET/POST | `/api/credits` | Listar y registrar fiados |
| POST | `/api/credits/:id/payments` | Registrar un abono |

## Flujos críticos

### Compra

Validar → consultar proveedor/productos → agrupar ítems → calcular importes → crear compra/ítems → incrementar stock y actualizar costo → registrar egreso. La transacción completa falla ante cualquier inconsistencia.

### Fiado

Validar → consultar cliente/productos → comprobar límite y stock → calcular con precios persistidos → crear crédito/ítems → disminuir stock → incrementar deuda. No crea movimiento de caja.

### Abono

Validar monto y crédito pendiente → comprobar que no exceda saldo → crear pago → reducir saldo del crédito y cliente → actualizar estado → registrar ingreso de caja.

## Interfaz

- M07 combina alta de proveedor, compra con productos y consulta de compras.
- M08 combina alta de cliente, carrito de fiado, deuda visible y abonos.
- Ambos módulos reutilizan cliente HTTP, componentes de panel/formulario y formato monetario BOB.

## Despliegue

Aplicar `prisma migrate deploy` antes de iniciar el backend actualizado. El cambio es aditivo y no elimina tablas ni columnas. Mantener variables existentes `DATABASE_URL`, `FRONTEND_URL` y `VITE_API_URL`.

## Trabajo paralelo

| Área | Responsabilidad | Punto de integración |
| --- | --- | --- |
| Database | modelos, índices, migración, seed | Cliente Prisma generado |
| Backend | contratos, reglas, transacciones, pruebas HTTP | Rutas `/api/*` |
| Frontend | navegación, formularios, listados, pruebas UI | Tipos y cuerpos JSON acordados |

El trabajo fue realizado por una sola persona con tres subagentes por área; la integración se hace sobre el contrato compartido y la verificación final conjunta.

## Riesgos

- Render aún usaba `prisma db push`; debe utilizar migraciones para proteger producción.
- Los comprobantes dependen del reloj y conviene migrarlos a secuencia en una especificación futura.
- Los créditos no tienen vencimiento ni auditoría de anulaciones, deliberadamente fuera de alcance.
