# Fintoc TEST setup

Mesa Cobrada V0.2 validates the payment flow in Fintoc TEST mode.

## Environment

```bash
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
FINTOC_SECRET_KEY=sk_test_...
FINTOC_WEBHOOK_SECRET=...
FINTOC_MOCK_CHECKOUT=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Use Fintoc test keys. Test keys use the `sk_test_` prefix and simulate objects without moving money.

For local product review without Fintoc credentials, keep:

```bash
FINTOC_MOCK_CHECKOUT=true
```

Mock mode creates a local test redirect to `/pay/success` and marks the payment as succeeded through the status endpoint. It does not call Fintoc.

## Webhook

Register:

```text
POST {NEXT_PUBLIC_APP_URL}/api/webhooks/fintoc
```

Handled events:

- `checkout_session.finished`
- `checkout_session.expired`
- `payment_intent.succeeded`
- `payment_intent.failed`
- `payment_intent.requires_action`

The endpoint verifies `Fintoc-Signature` when `FINTOC_WEBHOOK_SECRET` is configured.

## Supabase

Run the SQL migration in `supabase/migrations/20260616120000_fintoc_payments.sql` before testing real webhooks.

Payments and webhook idempotency are persisted in Supabase when `SUPABASE_SERVICE_ROLE_KEY` is configured. Bills still use `localStorage`, so the frontend sends a minimal bill snapshot before checkout so the backend can calculate the amount.

## Test flow

1. Create or open a mesa.
2. Configure the receiver account and accept the authorization checkbox.
3. Share/open participant flow.
4. Claim items and confirm selection.
5. Press `Pagar ahora`.
6. Complete the Fintoc TEST checkout, or use mock mode locally.
7. Return to `/pay/success`.
8. Confirm that payment status becomes `succeeded` and participant status becomes `paid`.

Fintoc TEST mode supports bank-transfer scenarios and webhooks. The official Fintoc testing guide lists test RUTs, bank accounts, MFA codes, failed payments, pending payments, and card test values.
