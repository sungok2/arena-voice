#!/usr/bin/env bash
set -euo pipefail
mkdir -p smoke-evidence
adb wait-for-device
adb install -r android-army-academy/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -W -n com.sungok2.armyaiacademy/.MainActivity | tee smoke-evidence/start.txt
sleep 10
adb shell pidof com.sungok2.armyaiacademy | tee smoke-evidence/process.txt
adb shell screencap -p /sdcard/academy-home.png
adb pull /sdcard/academy-home.png smoke-evidence/home.png
adb shell uiautomator dump /sdcard/window.xml || true
adb pull /sdcard/window.xml smoke-evidence/window.xml || true
adb shell am force-stop com.sungok2.armyaiacademy
adb shell am start -W -n com.sungok2.armyaiacademy/.MainActivity | tee smoke-evidence/restart.txt
sleep 3
adb shell pidof com.sungok2.armyaiacademy | tee smoke-evidence/restart-process.txt
adb logcat -d -b crash > smoke-evidence/crash-log.txt
if grep -E 'FATAL EXCEPTION|Process: com.sungok2.armyaiacademy' smoke-evidence/crash-log.txt; then
  echo 'Android runtime crash found' >&2
  exit 1
fi
echo 'EMULATOR_LAUNCH_RESTART_PASS'
