#!/bin/sh
set -eu

root="${DOMAINBOOK_ROOT:-domainbook}"
base="${DOMAINBOOK_BASE:-}"
head="${DOMAINBOOK_HEAD:-}"
cli="${DOMAINBOOK_CLI:-npx -y domainbook@latest}"

if [ -z "$base" ] || [ -z "$head" ]; then
  echo "the domainbook action reads the commit range from the event that started the run, and this one carries none — run it on a pull_request or a push" >&2
  exit 1
fi

$cli validate "$root"
$cli check --range "$base..$head" "$root"
$cli instructions --check "$root" || true
