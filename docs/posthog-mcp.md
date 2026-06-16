# PostHog MCP setup

Use the PostHog wizard after creating a PostHog personal API key.

```bash
npx --cache /private/tmp/npm-cache-posthog-wizard --yes @posthog/wizard@latest mcp add --region us --api-key phx_xxx --project-id 123
```

For EU cloud, use:

```bash
npx --cache /private/tmp/npm-cache-posthog-wizard --yes @posthog/wizard@latest mcp add --region eu --api-key phx_xxx --project-id 123
```

The wizard supports:

- `--region us|eu`
- `--api-key`
- `--project-id`
- `--no-telemetry`
- `--local-mcp`

## App environment

Add these variables to the deployed app:

```bash
NEXT_PUBLIC_APP_VERSION=1.0.1
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Privacy defaults

The app initializes PostHog with session recording disabled by default. Keep it disabled while receipts may show sensitive information.
