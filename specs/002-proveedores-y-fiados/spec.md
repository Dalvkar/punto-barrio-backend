# Especificación Punto Barrio operación ampliada

**Identificador:** 002-proveedores-y-fiados
**Estado:** Implementado
**Fecha:** 2026-10-30

## Resumen de lo implementado

Punto Barrio quedó funcionando con ocho módulos integrados. A los seis módulos originales se añadieron proveedores y compras, además de clientes y fiados. La implementación incluyó base de datos, API, interfaz, pruebas, CI y despliegue en Render.

## Módulos incluidos

| ID | Módulo | Resultado implementado |
| --- | --- | --- |
| M01 | Dashboard | Resumen de ventas, ingresos, catálogo y stock bajo |
| M02 | Productos | Alta, edición, desactivación y búsqueda |
| M03 | Inventario | Existencias, ajustes y alertas |
| M04 | Ventas | Venta, total, comprobante, stock y caja |
| M05 | Caja | Ingresos, egresos y cierre |
| M06 | Reportes | Métricas por periodo y productos principales |
| M07 | Proveedores y compras | Proveedores, compras, reposición y egreso automático |
| M08 | Clientes y fiados | Clientes, límite, deuda, fiados y abonos |

## Historias completadas

- HU-07: se implementó el registro y consulta de proveedores.
- HU-08: se implementaron compras con reposición de stock y egreso automático.
- HU-09: se implementaron clientes con límite y saldo de crédito.
- HU-10: se implementaron fiados y abonos con actualización de deuda y caja.

Las historias completas están en `docs/historias-de-usuario/`.

## RF 10 Proveedores y compras

- El sistema lista proveedores activos por nombre y permite crearlos con nombre obligatorio, contacto y teléfono opcionales.
- Una compra exige proveedor válido y al menos un ítem con producto, cantidad entera positiva y costo positivo.
- El servidor agrupa productos repetidos y calcula subtotal y total.
- La compra crea cabecera e ítems, incrementa stock, actualiza costo y registra un egreso de caja en una sola transacción.
- Un error de validación, proveedor o producto impide cualquier cambio parcial.

## RF 11 Clientes y fiados

- El sistema lista y crea clientes activos con límite no negativo y saldo inicial cero.
- Un fiado exige cliente, ítems, stock suficiente y crédito disponible.
- El fiado calcula importes con precios persistidos, disminuye stock y aumenta la deuda de manera atómica.
- Crear un fiado no registra ingreso de caja.
- Un abono positivo no puede superar el saldo pendiente; reduce saldos, actualiza estado y crea el ingreso de caja en una transacción.
- Los estados son `PENDING`, `PARTIAL` y `PAID`.

## Requisitos no funcionales

- Validación Zod en toda escritura y errores 4xx en español.
- Importes persistidos como `Decimal(10,2)`.
- Migración PostgreSQL versionada y semillas idempotentes.
- Interfaz responsive con estados de carga, error y vacío.
- Ningún secreto, `.env` real o URL de base incrustada.

## Fuera de alcance

- Edición o eliminación de compras y fiados confirmados.
- Devoluciones, notas de crédito, intereses o vencimientos automáticos.
- Mensajería de cobranza y autenticación por roles.

## Criterios de finalización

- RF-10 y RF-11 implementados en datos, API e interfaz.
- Pruebas y builds de ambos repositorios aprobados.
- Matriz en `verification.md` con evidencia verificable.
- Historias resumidas con su implementación y evidencia.
