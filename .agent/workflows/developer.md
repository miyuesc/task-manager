---
description: TaskManager
---

# Project: TaskManager

# Platform: macOS (Targeting M4 Macbook Air) -> iOS (Planned)

# Core Feature: iCloud Sync (CloudKit)

Workflow Rules:

1. Build Target: Always build for `platform=macOS` (Host Machine/Apple Silicon).
2. Architecture: Ensure `arch=arm64` is used for M4 performance.
3. iCloud/CloudKit:
   - Prioritize fixing CloudKit container/database compilation errors.
   - If `Entitlements.plist` is missing or provisioning fails, stop and ask me to enable "iCloud" in Xcode UI manually.
4. Automation:
   - On command "Build": Run `xcodebuild`, analyze errors, fix source code, auto-retry.
