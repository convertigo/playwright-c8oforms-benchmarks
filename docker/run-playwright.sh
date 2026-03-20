#!/usr/bin/env sh
set -eu

ARTIFACTS_DIR="${PLAYWRIGHT_ARTIFACTS_DIR:-/tmp/playwright-results}"
HTML_REPORT_DIR="${PLAYWRIGHT_HTML_OUTPUT_DIR:-/tmp/playwright-report}"

mkdir -p "$ARTIFACTS_DIR" "$HTML_REPORT_DIR"

exec ./node_modules/.bin/playwright test --output "$ARTIFACTS_DIR" "$@"
