# Fintoc TEST setup

Mesa Cobrada v1.2.1 valida Direct Payments en modo TEST.

## Environment

```bash
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
FINTOC_SECRET_KEY=
FINTOC_WEBHOOK_SECRET=
FINTOC_MOCK_CHECKOUT=false
FINTOC_DIRECT_PAYMENTS=false
NEXT_PUBLIC_ENABLE_MANUAL_PAID_FALLBACK=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Load test credentials only from an untracked local environment file or the deployment secret manager. Never paste values, prefixes, screenshots, or checkout-session URLs into documentation or logs.

For local product review without Fintoc credentials, keep:

```bash
FINTOC_MOCK_CHECKOUT=true
```

Mock mode creates a local test redirect to `/pay/success` and marks the payment as succeeded through the status endpoint. It does not call Fintoc.

Keep `FINTOC_DIRECT_PAYMENTS=false` while validating the hosted Fintoc checkout selection. Set it to `true` only when the Direct Payments recipient-account flow is ready.

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
- `payment_intent.rejected`
- `payment_intent.pending`
- `payment_intent.expired`
- `payment_intent.requires_action`

The endpoint verifies `Fintoc-Signature` when `FINTOC_WEBHOOK_SECRET` is configured.

## Supabase

Run both SQL migrations in `supabase/migrations` before testing public bills or real webhooks.

Bills, items, participants, claims, payment profiles, payments and webhook idempotency are persisted in Supabase when the service credential is configured. `localStorage` is only a local cache.

Direct Payments sends a bank-transfer-only checkout and the bill recipient account. Recipient bank and account type come from controlled selectors; arbitrary text is rejected before sharing.

References:

- [Fintoc Direct Payments](https://docs.fintoc.com/docs/setup-direct-payment)
- [Fintoc Checkout Sessions](https://docs.fintoc.com/reference/create-checkout-session)

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
