.ONESHELL:
.SHELLFLAGS += -euo pipefail
SHELL=/usr/bin/bash

GIT_ROOT_DIR := $(shell eval git rev-parse --show-toplevel)

android-init:
	npm run tauri android init

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

# TODO(ayvi): move/rename executable for all builds
# http://ayvi:3000/ayvi/dailies/issues/186

build:
	npm run tauri build

build-android-apk-debug:
	npm run tauri android build -- --debug --apk true

build-android-apk-universal-release:
	npm run tauri android build -- --apk true

build-android-apk-aarch64-release:
	npm run tauri android build -- --apk true --target aarch64
	mkdir -p dist/
	cp src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk dist/
	DIRTY_SUFFIX=-dev
	APK_DESCRIBE=$$(git describe --always --long  --first-parent --abbrev=7 --dirty=$$DIRTY_SUFFIX)
	if rg -q -- $$DIRTY_SUFFIX <<< $$APK_DESCRIBE; then
		GIT_INSERTIONS=$$(git diff --shortstat | rg -o '(\d+)\sinsertions' -r '$$1')
		GIT_DELETIONS=$$(git diff --shortstat | rg -o '(\d+)\sdeletions' -r '$$1')
		GIT_SHORTSTAT="-$$GIT_INSERTIONS-$$GIT_DELETIONS"
	fi
	mv dist/app-universal-release.apk "dist/dailies-aarch64-linux-android-$$APK_DESCRIBE$$GIT_SHORTSTAT.apk"

.PHONY: \
	run-desktop-dev \
	run-desktop-react-devtools \
	run-android-dev-connected-device \
	run-android-dev-android-studio \
	build \
	android-init \
	build-android-apk-universal-release \
	build-android-apk-aarch64-release
