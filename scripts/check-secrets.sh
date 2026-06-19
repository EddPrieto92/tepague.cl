#!/usr/bin/env bash

set -euo pipefail

pattern='((sk|pk)_(test|live)_[A-Za-z0-9_-]{12,}|whsec_[A-Za-z0-9_-]{12,}|sb_(secret|publishable)_[A-Za-z0-9_-]{12,}|ph[ctx]_[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|(FINTOC_SECRET_KEY|FINTOC_WEBHOOK_SECRET|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_POSTHOG_KEY)=[^[:space:]]+)'
report_file="$(mktemp -t mesa-cobrada-secrets.XXXXXX)"
trap 'rm -f "$report_file"' EXIT

if git grep -Il -E "$pattern" -- ':!scripts/check-secrets.sh' > "$report_file"; then
  echo "Posibles secretos detectados en archivos versionados:"
  sed 's/^/- /' "$report_file"
  exit 1
fi

echo "Sin valores sensibles en archivos versionados."
