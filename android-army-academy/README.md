# ARMY AI EXCELLENCE ACADEMY v2.4.1 — 2027 curriculum approval candidate

**Status: NOT OFFICIALLY APPROVED.** This repository is a public/synthetic curriculum-proposal and offline learner-app implementation. It is NOT an approved Republic of Korea Army course, a sanctioned grading platform, or a certificate issuer.

## Candidate program
- 12 weeks × 12 planned hours = 144 hours: 18 core + 90 specialist + 28 capstone + 8 evaluation.
- Specialist targets AI Technology 34%, Data Fusion 33%, Strategy & Planning 33%, scheduled as 31/30/29 hours.
- Eight performance-based program learning outcomes (PLO01–PLO08), nine proposed assessments totaling 100 points.
- 42-course/252-module **library**; only 28 course IDs contribute specialist hours to the scheduled 12-week candidate. Do not interpret 252 modules as approved mandatory classes.
- Current learning checks: 504 module questions (456 foundation, 48 applied draft cases), 30 uncalibrated diagnostics, 210 reflective prompts, synthetic labs. **None are officially approved summative assessment items.**
- Proposed formal assessment: independent written exam 20, six human-rated performance tasks 30, capstone 40, independent oral defense 10. No certified exam bank or formal score exists.

## Review-only, source-backed documents
- [CURRICULUM_APPROVAL_CANDIDATE_2027.md](CURRICULUM_APPROVAL_CANDIDATE_2027.md): full course proposal, 12-week timetable, performance outcomes and approval gates.
- [ASSESSMENT_BLUEPRINT_2027.md](ASSESSMENT_BLUEPRINT_2027.md): assessment specifications and evidence needed to establish validity.
- [INSTRUCTOR_OPERATIONS_GUIDE.md](INSTRUCTOR_OPERATIONS_GUIDE.md): instructor, examination and pilot-operation SOP.
- `app/src/main/assets/official_curriculum.js`: structured weekly outcomes, assessment rubrics, evidence IDs and approval status.
- `qa/approval_manifest.json`: unsigned, independent-review-required approval checklist.
- `qa/curriculum_candidate_test.js`: verifies hours, 8 PLOs, 12 weekly plans, 100 points and explicit nonapproval.
- `qa/curriculum_dossier_export.js --out curriculum-review`: emits **review-only**, non-sensitive CSV matrices; no signatures/learner identities/scores.

## Android app & security
- `applicationId`: `com.sungok2.armyaiacademy`; Android 26+; target 36.
- Offline Android WebView; no INTERNET permission. Local progress stored on device; backup/import through Android Storage Access Framework.
- App localStorage, XP, self-checks and exported JSON **cannot be used as authoritative official attendance/grades**, because identity, custody, tamper evidence and independent assessment authorization have not been validated.
- Never input or publish classified/restricted military materials, operational data, real service personnel records or unlicensed source documents to public GitHub or individual devices.

## CI build workflows
- `.github/workflows/build-army-ai-academy-apk.yml`: static QA, curriculum integrity and expert-review inventories, Android lint, debug APK.
- `.github/workflows/prepare-army-ai-academy-release.yml`: unsigned APK/AAB; not a user-ready certified release.
- `.github/workflows/academy-android-smoke.yml`: install/start/restart/screenshot on emulator, app-only crash filter; not Samsung Galaxy hardware testing.
- `.github/workflows/release-army-ai-academy-production.yml`: manual owner-keystore release signing; signing identity verification is **not** education approval.

## Authorization before institutional use
The governing training institution, latest military education regulation and applicable training-command procedures must define: target student admission, approved syllabus, instructional-hour accounting, instructor credentialing, independent examination security, score validity and appeal process, approved devices/networks, security review, record retention, and official issuance. None may be inferred from public external standards or the presence of APK artifacts.

Refer to [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) and [PRIVACY_OFFLINE.md](PRIVACY_OFFLINE.md) for remaining software controls.


## v2.4.1 readiness and teacher evidence
- [EDUCATION_VALIDATION_MASTER_PLAN_2027.md](EDUCATION_VALIDATION_MASTER_PLAN_2027.md): G1–G6 approval evidence and 2027 regulatory sunset revalidation.
- [training_cases/PE02_INSTRUCTOR_LESSON_PLAN.md](training_cases/PE02_INSTRUCTOR_LESSON_PLAN.md): 60-minute synthetic data fusion exemplar, not an official exam.
- `qa/instructional_evidence_audit.js`: CSV inventory for all 252 lessons and 15 labs; reports zero instructor/expert approval rather than inventing it.
- `qa/synthetic_practicum_test.js`: recomputes asset identity mapping, deduplication, orphan and UTC outcomes from public-only fixture.
- `qa/institutional_no_go_test.js`: blocks misrepresentation of missing accreditation and examination evidence.
- First-exposure module prerequisites corrected for 10 scheduled courses. Any waiver must be separately evidenced by the governing institution.
- Production-grade institutional learner records, instructor signoff, independent exam, pilot evaluation and official authorization remain missing.
