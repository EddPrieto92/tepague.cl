# Fintoc TEST setup

Mesa Cobrada V0.2 validates the payment flow in Fintoc TEST mode.

## Environment

```bash
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
FINTOC_SECRET_KEY=sk_test_...
FINTOC_WEBHOOK_SECRET=...
FINTOC_MOCK_CHECKOUT=false
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

## Local data note

The current app still uses `localStorage` for bills. V0.2 adds a temporary server snapshot endpoint before checkout so the backend can calculate the participant amount and create a Checkout Session. The SQL migration in `supabase/migrations` defines the target tables for replacing that temporary store.

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
