---
trigger: always_on
---

# Project: TaskManager

# Platform: macOS (Targeting M4 Macbook Air) -> iOS (Planned)

# Core Feature: iCloud Sync (CloudKit)

Workflow Rules:

1. Target: `platform=macOS,arch=arm64` (Native Apple Silicon).
2. Fix Strategy: Auto-fix build errors (focus on CloudKit/SwiftUI) and retry.

3. "Build and Run" Sequence:
   When I ask to "Run" or "Build", perform this exact sequence:
   1. BUILD: Run `xcodebuild -scheme TaskManager`.
   2. FIX: If it fails, fix the code and retry loop.
   3. KILL: Once successful, run `pkill -x "TaskManager"` to close the old version.
   4. LAUNCH: Find the built .app path and use `open [AppPath]` to launch it immediately.
