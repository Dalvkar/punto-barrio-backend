---
name: punto-barrio
description: Implementa, revisa y documenta cambios de Punto Barrio entre React, Express y Prisma con trazabilidad SDD. Usar para módulos, contratos API, inventario, caja, compras, proveedores, clientes y fiados de este proyecto; no usar para tiendas o repositorios ajenos.
---

# Punto Barrio

Punto Barrio está dividido en dos repositorios hermanos: `../frontend` contiene React/Vite y el repositorio actual contiene Express/Prisma/PostgreSQL. Lee los `AGENTS.md` aplicables y coordina los perfiles `frontend`, `backend` y `database` cuando el cambio atraviese capas.

## Invariantes del dominio

- El servidor calcula importes; el cliente nunca determina totales confiables.
- Una venta o un fiado no puede dejar stock negativo.
- Compra, actualización de stock y egreso de caja son una transacción.
- Venta, descuento de stock e ingreso de caja son una transacción.
- Un fiado reduce stock pero no crea ingreso de caja hasta recibir un abono.
- Un abono no puede superar el saldo y debe actualizar deuda del cliente, estado del crédito y caja en una transacción.
- Dinero persistido usa `Decimal(10, 2)`; cantidades de producto son enteros positivos.
- No editar ni versionar `.env`, credenciales, `node_modules`, `dist` o secretos de Render.

## Flujo de cambio

1. Identifica la historia y los requisitos afectados en `specs/`.
2. Define o confirma el contrato HTTP y los cambios de datos antes de conectar la interfaz.
3. Implementa persistencia, backend y frontend respetando sus límites de repositorio.
4. Actualiza `plan.md`, `tasks.md` y `verification.md` con evidencia real; no marques como verificado lo que solo fue inspeccionado.
5. Ejecuta `npm run ci` en backend y `npm test` más `npm run build` en frontend.
6. Comprueba `git diff --check`, que no haya secretos y que la migración sea versionada cuando cambie Prisma.

Para el mapa técnico y los comandos exactos, lee [references/project-map.md](references/project-map.md).
