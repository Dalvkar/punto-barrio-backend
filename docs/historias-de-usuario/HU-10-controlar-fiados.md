# HU 10 Controlar fiados y abonos

**Historia:** Como propietario, necesitaba registrar fiados y abonos para conocer la deuda real y reconocer dinero únicamente al cobrar.

**Resultado realizado:** se implementó control de stock y límite, deuda por cliente, estados pendiente/parcial/pagado y abonos que actualizan saldo y caja.

**Evidencia:** modelos `Credit`, `CreditItem` y `CreditPayment`, ruta `src/routes/credits.ts` y pruebas de límite y abono.
