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

## Current events

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

## First dashboards

- OCR success rate: `receipt_ocr_completed / receipt_image_selected`
- Empty OCR rate: `receipt_ocr_completed where item_count = 0`
- Total detection rate: `total_detected = true`
- Tip detection rate: `tip_detected = true`
- Median OCR duration
- Gallery vs camera success rate

## Later events

- `receipt_item_edited`
- `receipt_item_added`
- `receipt_item_deleted`
- `receipt_total_edited`
- `receipt_tip_edited`
- `share_link_opened`
- `participant_joined`
- `participant_claim_confirmed`
- `payment_marked_paid`
