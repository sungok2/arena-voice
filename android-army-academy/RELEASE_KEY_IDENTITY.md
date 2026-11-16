# Release signing identity (PUBLIC CERTIFICATE FINGERPRINT ONLY)

Release version: 2.0.1 (versionCode 6)
Package: com.sungok2.armyaiacademy
Certificate SHA-256: c38e1305b47ae27eaa40fa1a19ce2f0c68826150a391a4c0425513908fae6ea6
Algorithm: RSA 4096
Alias: academy-release-key
Validity: 2026-11-16 to 2056-11-08

Never commit or upload the PKCS12 private keystore or passwords to this PUBLIC repository.
Subsequent direct APK updates must retain this same application signing certificate.
The production-signing GitHub Action requires encrypted GitHub Secrets and refuses to publish if this fingerprint changes.

Note: this certificate was generated in a ChatGPT execution environment and delivered to the user; for higher-assurance deployment, organization-owned key custody and security review are recommended before distribution.
