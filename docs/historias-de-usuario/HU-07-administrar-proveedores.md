# HU 07 Administrar proveedores

**Como** responsable de compras
**quiero** registrar y consultar proveedores
**para** identificar el origen de la mercadería y mantener datos de contacto.

## Criterios de aceptación

- Nombre es obligatorio y no puede repetirse sin distinguir mayúsculas.
- Contacto y teléfono son opcionales.
- El listado muestra proveedores activos por nombre.
- Una entrada inválida responde `400` sin escribir datos.

## Trazabilidad

- Requisito: RF-10.
- Backend: `src/routes/suppliers.ts`.
- Datos: `Supplier`.
- Interfaz: vista Proveedores y compras.
