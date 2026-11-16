# ARMY AI EXCELLENCE ACADEMY 2.0.1 release evidence (public checksums)

Status: Android APK/AAB have been independently release-key signed for direct distribution readiness. Public Play listing, military approvals, and curriculum expert review are pending.

- Repository revision (application code): `22471de66e772e549ab3488b105ed16097a8d5bf`
- Application ID: `com.sungok2.armyaiacademy`
- Version: `2.0.1`, versionCode `6`
- minSdk `26`, targetSdk `36`
- Certificate SHA-256: `c38e1305b47ae27eaa40fa1a19ce2f0c68826150a391a4c0425513908fae6ea6`
- Signed APK SHA-256: `b5136d688527885d9e1feb0f00791b92bccf3ce84031110598ecb6c16616490d`
- Signed AAB SHA-256: `0e02fca8264f1ddac83eec076693cb4751d46c6c8a11ef3659ea7cd598573fb3`
- Source lint/build: https://github.com/sungok2/arena-voice/actions/runs/43835472672
- Debug lint and offline QA: https://github.com/sungok2/arena-voice/actions/runs/43835472837
- Android emulator launch and restart: https://github.com/sungok2/arena-voice/actions/runs/43835472833
  - Android app processes survived both launches; crash log empty; system bar overlap corrected.
  - Emulator system "Pixel Launcher isn't responding" popup observed; real hardware stability not tested.

The production keystore/password are NOT stored in GitHub. Source-only workflows cannot produce a user-signed release without the owner-managed encrypted signing secrets; no debug-key fallback is permitted.

Data and content remain educational drafts, not official Army information or certifications.
