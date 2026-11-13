# ARMY AI EXCELLENCE ACADEMY — v2.0 RC3
**Professional learning prototype; not officially certified by the ROK Army.**
This project is isolated under `android-army-academy/`; the repository-root Arena Voice PWA is unchanged.

## Features
- Responsive original navy/teal learning dashboard and 5-tab mobile navigation.
- 42 courses with 252 modules and domain-specific concept/pitfall summaries.
- 210 instructor-review-required reflective questions, five per course.
- 30 multiple-choice diagnostic questions across three fields, explanation review.
- 12-week 144-hour personal specialization plan; verified 34:33:33 balanced schedule.
- 14-item AI business-planning Capstone checklist.
- Local-only notes, course progress, bookmarks and optional demo XP. Export JSON through Android Storage Access Framework.
- Optional original synthesized UI sounds, volume, haptics, font scale, contrast and reduced-motion settings (audio off by default).
- No INTERNET permission, no external API, no telemetry, no classified/operational data.

## Security and certification
All local progress and XP are self-reported and *not* professional or military qualification evidence.
Academic contents remain editorial drafts; actual instructor review and Army security authorization have **not** been completed.
A sensitive military or real personal record must not be entered.

## Build
Android Gradle Plugin 8.13.2, Gradle 8.13, JDK 17, compile/target SDK 36, min SDK 26.

```bash
cd android-army-academy
gradle :app:lintRelease :app:assembleRelease
```

## Signing
If `ACADEMY_RELEASE_KEYSTORE_BASE64`, `ACADEMY_RELEASE_STORE_PASSWORD`, `ACADEMY_RELEASE_KEY_ALIAS` and `ACADEMY_RELEASE_KEY_PASSWORD` are configured as GitHub Actions secrets, CI uses the persistent release key.
Otherwise, the release variant is signed with a **development key solely to permit local device evaluation**. It MUST NOT be distributed as the final production signed identity and may not install over RC2 due to a different signing certificate. Do not upload a keystore to this public repository.
A privately managed persistent signing key and legitimate distribution approval are required for production.

## Testing
`qa/content_audit.py` checks catalog count, module count, assessment count, balanced allocation and bundled offline resources. Android CI performs JS syntax, lint, APK build, signature and SHA-256 checks. Headless Chromium desktop/mobile interaction tests run separately; physical Samsung device validation remains outstanding.

## Source
2026-11-12 v1.0 RC package and the user's refined 34:33:33 curriculum. This remains an educational design proposal, not an approved Army course.
