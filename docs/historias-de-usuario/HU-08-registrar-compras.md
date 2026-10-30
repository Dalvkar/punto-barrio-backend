# HU 08 Registrar compras

**Como** responsable de inventario
**quiero** registrar una compra a un proveedor
**para** reponer existencias y reflejar el egreso de caja sin ajustes manuales duplicados.

## Criterios de aceptación

- La compra exige proveedor activo y al menos un producto con cantidad y costo positivos.
- El servidor calcula subtotales y total con los costos recibidos validados.
- Compra, ítems, incremento de stock, actualización de costo y egreso de caja son atómicos.
- Si proveedor o producto no existe, no queda ningún cambio parcial.

## Trazabilidad

- Requisito: RF-10.
- Backend: `src/routes/purchases.ts`.
- Datos: `Purchase`, `PurchaseItem`, `Product`, `CashMovement`.
- Interfaz: vista Proveedores y compras.
