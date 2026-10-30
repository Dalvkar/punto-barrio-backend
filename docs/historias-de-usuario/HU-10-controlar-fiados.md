# HU 10 Controlar fiados y abonos

**Como** propietario de la tienda
**quiero** registrar ventas fiadas y sus abonos
**para** conocer cuánto debe cada cliente y reconocer efectivo solo cuando se cobra.

## Criterios de aceptación

- El fiado exige cliente activo, productos existentes, stock suficiente y límite disponible.
- El fiado disminuye stock y aumenta saldo, pero no genera ingreso de caja.
- Un abono positivo no puede superar el saldo pendiente.
- El abono reduce saldos, cambia estado a `PARTIAL` o `PAID` y registra ingreso de caja de forma atómica.

## Trazabilidad

- Requisito: RF-11.
- Backend: `src/routes/credits.ts`.
- Datos: `Credit`, `CreditItem`, `CreditPayment`, `Customer`, `Product`, `CashMovement`.
- Interfaz: vista Clientes y fiados.
