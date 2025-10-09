#!/usr/bin/env bash

set -euo pipefail

react-devtools &

trap 'kill $(jobs -p)' EXIT

cd "$(git rev-parse --show-toplevel)" && npm run tauri dev

exit
