# Especificación Punto Barrio operación ampliada

**Identificador:** 002-proveedores-y-fiados
**Estado:** Implementado
**Fecha:** 2026-10-30

## Contexto y objetivo

Los seis módulos existentes cubren dashboard, productos, inventario, ventas, caja y reportes. La ampliación agrega dos capacidades operativas que cierran ciclos cotidianos de una tienda de barrio: reponer mercadería desde proveedores y controlar ventas fiadas con cobros posteriores.

## Módulos incluidos

| ID | Módulo | Resultado esperado |
| --- | --- | --- |
| M01 | Dashboard | Resumen de ventas, ingresos, catálogo y stock bajo |
| M02 | Productos | Alta, edición, desactivación y búsqueda |
| M03 | Inventario | Existencias, ajustes y alertas |
| M04 | Ventas | Venta, total, comprobante, stock y caja |
| M05 | Caja | Ingresos, egresos y cierre |
| M06 | Reportes | Métricas por periodo y productos principales |
| M07 | Proveedores y compras | Proveedores, compras, reposición y egreso automático |
| M08 | Clientes y fiados | Clientes, límite, deuda, fiados y abonos |

## Historias de usuario

- HU-07: administrar proveedores.
- HU-08: registrar compras.
- HU-09: administrar clientes y límites.
- HU-10: controlar fiados y abonos.

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
- Historias e issues preparados sin incluir secretos.
