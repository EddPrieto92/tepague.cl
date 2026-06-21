# Mesa Cobrada

App mobile-first para cargar una boleta, dividir consumos y cobrar cada parte mediante Fintoc.

## v1.2.2

Parche de estabilidad para producción:

- La imagen local de la boleta ya no se envía como base64 en cada sincronización.
- La creación y revisión continúan con cache local si la persistencia pública está temporalmente caída.
- Generar el enlace exige una escritura pública real, evitando compartir mesas inexistentes.
- Los errores de esquema o disponibilidad se informan sin exponer credenciales ni detalles sensibles.

La persistencia pública requiere aplicar `supabase/migrations/20260619120000_public_bills_v121.sql` en el proyecto Supabase usado por producción.

## v1.2.1

- Cuenta pública persistida por `shareId` mediante la API y Supabase; `localStorage` queda como caché.
- Productos con reparto por unidad, compartido, entre todos, invitado o consumo propio del organizador.
- Personas esperadas, fee anticipado, faltantes por producto y validación contra la boleta.
- Cuenta receptora validada y enviada a Fintoc Direct Payments.
- Selecciones recuperables y estados de participante/pago.
- Boleta visible durante revisión, validación y seguimiento.
- Transferencia y QR como fallback colapsado; marcado manual desactivado por defecto.

## Local

```bash
npm install
npm run dev
```

Si el watcher local falla por limite de archivos abiertos:

```bash
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

## Fintoc TEST

Configura estas variables únicamente en `.env.local` (ignorado por Git) o en el gestor de secretos del despliegue:

```bash
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
FINTOC_SECRET_KEY=
FINTOC_WEBHOOK_SECRET=
FINTOC_MOCK_CHECKOUT=true
FINTOC_DIRECT_PAYMENTS=false
NEXT_PUBLIC_ENABLE_MANUAL_PAID_FALLBACK=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`FINTOC_MOCK_CHECKOUT=true` permite revisar el flujo local sin credenciales. Para llamar a Fintoc TEST real, carga la credencial desde el gestor de secretos y cambia el mock a `false`.

Con `FINTOC_DIRECT_PAYMENTS=false`, Fintoc muestra el checkout hospedado con selección de método de pago. Activa `FINTOC_DIRECT_PAYMENTS=true` solo cuando la cuenta receptora y el flujo de pago directo estén validados.

Nunca guardes valores de credenciales, prefijos, capturas o URLs de sesión en el repositorio, logs, tickets o notas.

Mas detalle en `docs/fintoc-test-setup.md`.

Antes de probar links públicos o webhooks reales, ejecuta en orden las migraciones SQL de `supabase/migrations`.

## Persistencia

Las pantallas públicas leen `GET /api/bills/[shareId]`. Los cambios se sincronizan con `POST /api/bills/sync` y pueden actualizarse con `PATCH /api/bills/[billId]`.

Sin credenciales Supabase, el servidor usa memoria únicamente para desarrollo local. En un despliegue real, la migración y `SUPABASE_SERVICE_ROLE_KEY` son obligatorias para compartir entre dispositivos.

## Verificacion

```bash
npm run typecheck
npm test
npm run build
```

Escenarios de aceptación: `docs/v1.2.1-qa.md`.
