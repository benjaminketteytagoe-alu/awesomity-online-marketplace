#!/usr/bin/env bash
set -euo pipefail

EMAIL="${1:-}"
if [[ -z "$EMAIL" ]]; then
  echo "Usage: $0 <recipient-email>" >&2
  exit 1
fi

MAILHOG_URL="${MAILHOG_URL:-http://localhost:8025}"

curl -sS --max-time 10 "$MAILHOG_URL/api/v2/messages" | python3 -c '
import sys, json, re, quopri

target = sys.argv[1].lower()
data = json.load(sys.stdin)
items = data.get("items", [])
if not items:
    sys.stderr.write("Mailhog inbox is empty.\n")
    sys.exit(3)

def find_token(text):
    # Token is url-safe base64, no padding, >= 40 chars in practice.
    m = re.search(r"token=([A-Za-z0-9_\-]{30,})", text)
    return m.group(1) if m else None

for item in items:
    to_header = json.dumps(item.get("Content", {}).get("Headers", {}).get("To", []))
    if target not in to_header.lower():
        continue

    raw = item["Content"]["Body"]

    # JavaMail always QP-encodes the body. Decode FIRST — never trust raw.
    try:
        qp = quopri.decodestring(raw.encode("utf-8", "replace")).decode("utf-8", "replace")
    except Exception:
        qp = raw

    token = find_token(qp)
    if token:
        print(token)
        sys.exit(0)

    # Last-ditch: raw fallback for environments where QP was already resolved.
    token = find_token(raw)
    if token:
        print(token)
        sys.exit(0)

sys.stderr.write(f"No token found for {target}\n")
sys.exit(4)
' "$EMAIL"
