#!/usr/bin/env bash
# Builds a debug APK. Needs: Node 20+, JDK 21, Android SDK (ANDROID_HOME set).
set -euo pipefail
cd "$(dirname "$0")"
npm install
[ -d android ] || npx cap add android
# Camera/photo picker support for the Album tab
M=android/app/src/main/AndroidManifest.xml
grep -q 'android.permission.CAMERA' "$M" || sed -i 's#<uses-permission android:name="android.permission.INTERNET" />#&\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-permission android:name="android.permission.VIBRATE" />\n    <uses-permission android:name="android.permission.WAKE_LOCK" />#' "$M"
npx capacitor-assets generate --android --iconBackgroundColor '#4350c8' --iconBackgroundColorDark '#4350c8'
npx cap sync android
(cd android && ./gradlew assembleDebug)
mkdir -p dist && cp android/app/build/outputs/apk/debug/app-debug.apk dist/Sinew.apk
echo "APK: $(pwd)/dist/Sinew.apk"
