# Mesa Cobrada v1.2.1

Iteración enfocada en reemplazar el reparto manual tipo planilla durante una salida real: persistencia pública, validación de boleta, faltantes por producto, modos de reparto, recuperación de claims y pago contextual.

## Operación requerida

Aplicar `20260619120000_public_bills_v121.sql` en Supabase antes del despliegue. Las cuentas creadas con esquemas anteriores siguen disponibles en caché local, pero deben volver a sincronizarse para ser públicas.

## Seguridad

La iteración incluye la limpieza previa de ejemplos de credenciales, respuestas externas sanitizadas y el detector local `npm run security:secrets`.
