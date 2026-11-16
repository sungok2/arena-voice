# ARMY AI EXCELLENCE ACADEMY — 2.0.0 distribution builds

The source is a 100% offline educational Android WebView app.
- applicationId: `com.sungok2.armyaiacademy`
- minSdk 26, targetSdk 36
- 42 courses, 252 modules, 30 diagnostics, 210 reflective questions
- Proposed 12-week 144-hour curriculum; content and certifications are **not officially approved**
- No INTERNET permission. Local progress stored on device; import/export through Android Storage Access Framework.
- Production signing identity fingerprint: see `RELEASE_CERT_SHA256.txt`.

## Build workflows

- `.github/workflows/build-army-ai-academy-apk.yml` — debugging/testing only (debug key).
- `.github/workflows/prepare-army-ai-academy-release.yml` — builds **unsigned** release APK/AAB for owner-held private key signing.
- `.github/workflows/release-army-ai-academy-production.yml` — manual-only, refuses debug fallback, signs using owner GitHub Secrets, verifies APK/AAB and pins signing certificate.

## Sign manually with a private keystore

1. Save the keystore only in a private encrypted vault/offline media; do not add it to source control.
2. For direct APK deployment, use Android Build Tools `apksigner` (after zipalign, if needed).
3. For AAB upload, use `jarsigner`; new apps are served through Play App Signing if published on Google Play.
4. Record SHA256 and certificate digest; preserve the signing key for all updates.
5. For GitHub Actions production workflow, add four secrets to the repository:
`ACADEMY_RELEASE_KEYSTORE_BASE64`, `ACADEMY_RELEASE_STORE_PASSWORD`,
`ACADEMY_RELEASE_KEY_ALIAS`, `ACADEMY_RELEASE_KEY_PASSWORD`.
Keep the keystore **out** of the public repository.

## Before public or military deployment
Read `RELEASE_CHECKLIST.md` and `PRIVACY_OFFLINE.md`. Device testing, human curriculum review, Army information security review, terms, ownership, and Play Console publication are separate mandatory actions. Do not input confidential data.
