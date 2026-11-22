#!/usr/bin/env python3
"""Fail-closed release source checks; does not certify device/Army approval."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
manifest=(root/'app/src/main/AndroidManifest.xml').read_text()
gradle=(root/'app/build.gradle').read_text()
java=(root/'app/src/main/java/com/sungok2/armyaiacademy/MainActivity.java').read_text()
for requirement in ['android:allowBackup="false"', 'android:usesCleartextTraffic="false"', 'android:networkSecurityConfig="@xml/network_security_config"']:
    assert requirement in manifest,requirement
assert 'android.permission.INTERNET' not in manifest
assert 'android.permission.READ_EXTERNAL_STORAGE' not in manifest
assert 'android.permission.MANAGE_EXTERNAL_STORAGE' not in manifest
assert 'minSdk 26' in gradle and 'targetSdk 36' in gradle
assert 'versionCode 21' in gradle and "versionName '2.7.0'" in gradle
assert 'signingConfigs.debug' not in gradle,'Production release must NEVER fall back to debug signing'
assert 'if (persistentStore) signingConfig signingConfigs.production' in gradle
assert 'WebView.setWebContentsDebuggingEnabled(false)' in java
assert 'setAllowFileAccess(false)' in java
assert 'setAcceptThirdPartyCookies(webView, false)' in java
assert 'LOCAL_HOST.equals(uri.getHost())' in java
assert (root/'app/src/main/assets/index.html').exists()
assert (root/'app/src/main/assets/module_draft.js').exists()
assert (root/'app/src/main/assets/learning_experience.js').exists()
assert (root/'app/src/main/assets/quiz_applied_v2_3_3.js').exists()
assert (root/'app/src/main/assets/official_curriculum.js').exists()
html=(root/'app/src/main/assets/index.html').read_text()
assert html.index('src="module_draft.js"')<html.index('src="app.js"')
assert html.index('src="learning_experience.js"')<html.index('src="app.js"')
assert html.count('data-view-target=')>=6
assert 'id="floating-mission"' not in html
assert "testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'" in gradle
assert (root/'app/src/androidTest/java/com/sungok2/armyaiacademy/LearningJourneyInstrumentedTest.java').exists()
assert 'id="home-next-lesson"' in html and html.index('id="home-next-lesson"')<html.index('id="home-stats"')
assert html.count('<svg viewBox="0 0 24 24" aria-hidden="true"')>=6
print('RELEASE_SOURCE_SECURITY_GATE_PASS: signature debug fallback absent, offline-only, backup off')
