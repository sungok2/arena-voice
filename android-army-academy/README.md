# ARMY AI EXCELLENCE ACADEMY — Android RC

This Android application embeds the user's **2026-11-12 v1.0 RC** offline HTML interface. The existing Arena Voice PWA in the repository root is preserved unchanged.

- Package: `com.sungok2.armyaiacademy`
- Java 17, Android Gradle Plugin 8.9.2, Gradle 8.11.1
- compileSdk/targetSdk 35, minSdk 26
- AndroidX WebViewAssetLoader serves the bundled `assets/index.html` through a trusted local HTTPS origin.
- No Android INTERNET permission; external navigations and subresources blocked.
- Diagnostic, 42-course catalog, selected specialization ratios, 12-week plan, Capstone and demo XP from existing offline UI.
- JSON export uses Android's user-selected document picker; app does not request broad storage permissions.
- No actual Army systems/data or remote API integration.
- Debug APK is for local testing. Not production signed, not approved by an Army security authority.

## Build

From `android-army-academy/`, run:

```bash
gradle :app:assembleDebug --no-daemon
```

The workflow `.github/workflows/build-army-ai-academy-apk.yml` builds and uploads `app-debug.apk` as an Actions artifact.

## Verification limits

Only GitHub Actions can confirm Android compilation in this build environment. HTML quiz answers are included for self-study, not trusted certification. 12-week 144h is a proposed curriculum. Official approval remains pending.

## Original source

ARMY_AI_EXCELLENCE_ACADEMY_v1.0_RC.zip — `ui/index.html`, supplied in this conversation.
