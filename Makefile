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

run-android-dev-connected-device:
	cargo tauri android dev

run-android-dev-emulator:
	cargo tauri android dev --host

run-android-dev-android-studio:
	npm run tauri android dev --open

build:
	npm run tauri build

android-init:
	npm run tauri android init

build-android-apk-debug:
	npm run tauri android build -- --debug --apk true

build-android-apk-universal-release:
	npm run tauri android build -- --apk true

build-android-apk-aarch64-release:
	npm run tauri android build -- --apk true --target aarch64

.PHONY: \
	run-desktop-dev \
	run-desktop-react-devtools \
	run-android-dev-connected-device \
	run-android-dev-android-studio \
	build \
	android-init \
	build-android-apk-universal-release \
	build-android-apk-aarch64-release
