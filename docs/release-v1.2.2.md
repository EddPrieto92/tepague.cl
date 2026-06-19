# Mesa Cobrada v1.2.2

Parche de estabilidad para el error `503` observado en `POST /api/bills/sync`.

## Causa

- La app trataba toda sincronización como obligatoria, incluso durante la creación del borrador.
- Si Supabase estaba configurado pero las tablas públicas aún no estaban disponibles, el flujo se bloqueaba.
- La foto local de la boleta viajaba como `data:` URL dentro del JSON y elevaba el request a cientos de KB.

## Corrección

- Los borradores mantienen una copia local y pueden avanzar a revisión durante una caída temporal.
- La publicación del enlace exige persistencia pública real.
- Las imágenes locales `data:` y `blob:` no se envían al API ni se guardan en el snapshot público.
- Los snapshots siguen siendo la fuente pública principal; las tablas normalizadas se sincronizan como respaldo.
- Los errores retornan códigos controlados y no registran secretos.

## Operación requerida

Producción debe tener aplicada la migración:

`supabase/migrations/20260619120000_public_bills_v121.sql`

Sin esa migración se podrá crear y revisar localmente, pero la app bloqueará correctamente la generación del enlace público.

## Validación

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run security:secrets`
