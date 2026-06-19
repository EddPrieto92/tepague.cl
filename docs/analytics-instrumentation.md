# Analytics instrumentation

Mesa Cobrada should measure product behavior without collecting receipt content.

## Recommendation

Start with PostHog for early product analytics because the free tier includes product analytics and session replay in the same tool. Use Google Analytics later if acquisition/channel reporting becomes important.

## Privacy rule

Never send:

- receipt images
- raw OCR text
- product names from receipts
- RUT, address, card digits, QR payloads, account details

Only send aggregate metadata.

## Current events v1.2.1

### `receipt_image_selected`

- `source`: `camera` or `gallery`
- `file_type`
- `file_size_kb`
- `app_version`

### `receipt_ocr_completed`

- `source`
- `duration_ms`
- `item_count`
- `subtotal_detected`
- `tip_detected`
- `total_detected`
- `app_version`

### `receipt_ocr_failed`

- `source`
- `duration_ms`
- `app_version`

### `bill_created`

- `has_ocr`
- `item_count`
- `subtotal_detected`
- `tip_detected`
- `total_detected`
- `app_version`

### Lifecycle

- `ocr_completed`
- `ocr_partial`
- `ocr_failed`
- `bill_reviewed`
- `bill_shared`
- `participant_started`
- `participant_claimed_item`
- `participant_confirmed`
- `payment_started`
- `payment_succeeded`
- `payment_failed`
- `payment_cancelled`

## First dashboards

- OCR success rate: `receipt_ocr_completed / receipt_image_selected`
- Empty OCR rate: `receipt_ocr_completed where item_count = 0`
- Total detection rate: `total_detected = true`
- Tip detection rate: `tip_detected = true`
- Median OCR duration
- Gallery vs camera success rate

All payloads are aggregate identifiers, amounts and statuses; receipt content and payment credentials are excluded.
