#!/usr/bin/env bash
# Bootstrap a Helix dev environment from a fresh checkout.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf "\n\033[1;35m▶ %s\033[0m\n" "$*"; }

step "Node version"
node --version

step "Enabling pnpm via corepack"
corepack enable
pnpm --version

step "Installing workspace dependencies"
pnpm install --no-frozen-lockfile

step "Copying .env.example → .env (if missing)"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "  ✓ created .env — edit it to add ANTHROPIC_API_KEY and VOYAGE_API_KEY"
else
  echo "  .env already exists, skipping"
fi

step "Building shared packages"
pnpm -r --filter './packages/*' build

step "Done"
echo "  next: pnpm dev"
