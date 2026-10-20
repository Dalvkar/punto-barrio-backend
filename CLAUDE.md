# Orquestación de Punto Barrio

Cuando el usuario solicite una funcionalidad nueva, usa los subagentes de `.claude/agents/` según el alcance:

- `backend` para rutas, contratos HTTP, validación y reglas de negocio.
- `database` para modelos Prisma, migraciones, semillas, índices y consultas.
- `frontend` para interfaz y consumo de la API cuando el repositorio hermano `../frontend` esté disponible.

Para cambios de punta a punta, coordina los tres empezando por el contrato de datos y API. Antes de entregar, ejecuta `npm run ci`, confirma que el workflow equivalente existe y comprueba que no se añadió ningún `.env` o secreto.
