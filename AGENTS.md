# Orquestación de Punto Barrio con Codex

Cuando el usuario solicite una funcionalidad nueva, delega según su alcance en los subagentes nativos de `.codex/agents/`:

- `backend` para rutas, contratos HTTP, validación y reglas de negocio.
- `database` para modelos Prisma, migraciones, semillas, índices y consultas.
- `frontend` para interfaz y consumo de la API cuando `../frontend` esté disponible.

Para cambios de punta a punta, coordina los tres empezando por el contrato de datos y API. Antes de entregar, ejecuta `npm run ci`, confirma que el workflow equivalente existe y comprueba que no se añadió ningún `.env` o secreto.
