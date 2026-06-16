# Mesa Cobrada

Mobile-first app para dividir una cuenta y cobrar automaticamente en modo de prueba.

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

Variables:

```bash
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
FINTOC_SECRET_KEY=sk_test_...
FINTOC_WEBHOOK_SECRET=...
FINTOC_MOCK_CHECKOUT=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`FINTOC_MOCK_CHECKOUT=true` permite revisar el flujo local sin credenciales. Para llamar a Fintoc TEST real, usa una llave `sk_test_` y cambia el mock a `false`.

Mas detalle en `docs/fintoc-test-setup.md`.

Antes de probar webhooks reales, ejecuta la migracion SQL en `supabase/migrations`.

## Verificacion

```bash
npm run typecheck
npm test
npm run build
```
