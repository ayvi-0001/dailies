.ONESHELL:
.SHELLFLAGS += -euo pipefail
SHELL=/usr/bin/bash

.SILENT:

GIT_ROOT_DIR := $(shell eval git rev-parse --show-toplevel)

android-init:
	npm run tauri android init

run-desktop-dev:
	npm run tauri dev

run-desktop-release:
	npm run tauri dev -- --release

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
	DIST=dist/windows
	mkdir -p "$$DIST"
	cp src-tauri/target/release/dailies.exe "$$DIST/"
	ARCHITECTURE=x86_64-pc-windows-msvc
	DIRTY_SUFFIX=-dev
	APK_DESCRIBE=$$(git describe --always --long  --first-parent --abbrev=7 --dirty=$$DIRTY_SUFFIX --tags)
	if rg -q -- $$DIRTY_SUFFIX <<< $$APK_DESCRIBE; then
		GIT_INSERTIONS=$$(git diff --shortstat | rg -o '(\d+)\sinsertions' -r '$$1')
		GIT_DELETIONS=$$(git diff --shortstat | rg -o '(\d+)\sdeletions' -r '$$1')
		GIT_SHORTSTAT="-$$GIT_INSERTIONS-$$GIT_DELETIONS"
	fi
	cd "$$DIST"
	mv dailies.exe "dailies-$$ARCHITECTURE-$$APK_DESCRIBE$$GIT_SHORTSTAT.exe"
	# TODO(ayvi): move nsis/msi bundle

build-android-apk-debug:
	npm run tauri android build -- --debug --apk true

build-android-apk-universal-release:
	npm run tauri android build -- --apk true

build-android-apk-aarch64-release:
	npm run tauri android build -- --apk true --target aarch64
	DIST=dist/android
	mkdir -p "$$DIST"
	cp src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk "$$DIST/"
	ARCHITECTURE=aarch64-linux-android
	DIRTY_SUFFIX=-dev
	APK_DESCRIBE=$$(git describe --always --long  --first-parent --abbrev=7 --dirty=$$DIRTY_SUFFIX --tags)
	if rg -q -- $$DIRTY_SUFFIX <<< $$APK_DESCRIBE; then
		GIT_INSERTIONS=$$(git diff --shortstat | rg -o '(\d+)\sinsertions' -r '$$1')
		GIT_DELETIONS=$$(git diff --shortstat | rg -o '(\d+)\sdeletions' -r '$$1')
		GIT_SHORTSTAT="-$$GIT_INSERTIONS-$$GIT_DELETIONS"
	fi
	cd "$$DIST"
	mv app-universal-release.apk "dailies-$$ARCHITECTURE-$$APK_DESCRIBE$$GIT_SHORTSTAT.apk"

.PHONY: \
	android-init \
	build \
	build-android-apk-aarch64-release \
	build-android-apk-universal-release \
	run-android-dev-android-studio \
	run-android-dev-connected-device \
	run-desktop-dev \
	run-desktop-react-devtools \
	run-desktop-release
