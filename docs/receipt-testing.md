# Receipt testing lab

Use this folder to turn every real receipt format into a repeatable test.

## Add a new receipt case

1. Capture the OCR text from the app under `Texto detectado`.
2. Create a JSON file in `tests/fixtures/receipts`.
3. Fill `rawText` with the OCR output.
4. Fill `expected.items`, `expected.subtotal`, `expected.tip`, and `expected.total`.
5. Run:

```bash
npm run test:receipts
```

## What counts as success

- Every listed product is detected.
- Product quantity matches the receipt.
- Product total matches the receipt.
- Subtotal, tip, and total match the receipt.

## What not to store

- Do not commit receipt photos with names, RUTs, card numbers, addresses, or QR payment data.
- Prefer OCR text fixtures with sensitive data removed.
- Keep raw images local until they are anonymized.

## Suggested fixture labels

- `restaurant-tip`
- `pos-no-tip`
- `long-receipt`
- `discount`
- `quantity-x`
- `bad-light`
- `tilted-photo`
- `ocr-thousands`
