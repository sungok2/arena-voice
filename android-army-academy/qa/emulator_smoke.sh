#!/usr/bin/env bash
set -euo pipefail
# A failure in Android's UiAutomation helper is not an Academy app crash.
# Scope crash checks to the Academy application process (exact process name).
app_crashed() {
  grep -E 'Process: com\.sungok2\.armyaiacademy(,|[[:space:]]|$)' "$1"
}
if [[ "${1:-}" == "--self-test" ]]; then
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT
  printf 'FATAL EXCEPTION: UiAutomation\nProcess: com.android.uiautomator, PID: 81\n' > "$tmp"
  if app_crashed "$tmp"; then echo "False positive from unrelated framework crash" >&2; exit 1; fi
  printf 'FATAL EXCEPTION: main\nProcess: com.sungok2.armyaiacademy, PID: 92\n' > "$tmp"
  if ! app_crashed "$tmp"; then echo "Failed to detect target app crash" >&2; exit 1; fi
  printf 'No fatal exception\n' > "$tmp"
  if app_crashed "$tmp"; then echo "False positive on healthy log" >&2; exit 1; fi
  echo 'EMULATOR_CRASH_FILTER_TEST_PASS'
  exit 0
fi
mkdir -p smoke-evidence
adb wait-for-device
adb logcat -c -b crash || true
adb install -r android-army-academy/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -W -n com.sungok2.armyaiacademy/.MainActivity | tee smoke-evidence/start.txt
sleep 10
adb shell pidof com.sungok2.armyaiacademy | tee smoke-evidence/process.txt
adb shell screencap -p /sdcard/academy-home.png
adb pull /sdcard/academy-home.png smoke-evidence/home.png
test -s smoke-evidence/home.png
# Do not run uiautomator dump merely to collect optional hierarchy evidence:
# the helper itself can crash independently of the Academy app.
adb shell am force-stop com.sungok2.armyaiacademy
adb shell am start -W -n com.sungok2.armyaiacademy/.MainActivity | tee smoke-evidence/restart.txt
sleep 3
adb shell pidof com.sungok2.armyaiacademy | tee smoke-evidence/restart-process.txt
adb logcat -d -b crash > smoke-evidence/crash-log.txt
if app_crashed smoke-evidence/crash-log.txt; then
  echo 'Academy application runtime crash found' >&2
  exit 1
fi
echo 'EMULATOR_LAUNCH_RESTART_PASS'
