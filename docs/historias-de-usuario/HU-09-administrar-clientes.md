# HU 09 Administrar clientes

**Como** encargado de la tienda
**quiero** registrar clientes y su límite de crédito
**para** controlar a quién se permite comprar fiado.

## Criterios de aceptación

- Nombre es obligatorio; teléfono es opcional.
- El límite de crédito es no negativo y el saldo inicial es cero.
- El listado muestra saldo y crédito disponible por cliente activo.
- El saldo solo cambia mediante operaciones de fiado o abono.

## Trazabilidad

- Requisito: RF-11.
- Backend: `src/routes/customers.ts`.
- Datos: `Customer`.
- Interfaz: vista Clientes y fiados.
