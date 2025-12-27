.ONESHELL:
.SHELLFLAGS += -euo pipefail
SHELL=/usr/bin/bash

GIT_ROOT_DIR := $(shell eval git rev-parse --show-toplevel)
DATE_SUFFIX := $(shell eval date '+%Y%m%d_%H%M%S')

run-desktop-dev:
	npm run tauri dev

run-desktop-react-devtools:
	react-devtools &
	trap 'kill $$(jobs -p)' EXIT
	npm run tauri dev

build:
	npm run tauri build

.PHONY: \
	run-desktop-dev \
	run-desktop-react-devtools \
	build
