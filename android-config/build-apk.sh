#!/usr/bin/env bash
set -euo pipefail

echo "1. Building production web bundle (dist/)..."
npm install
npm run build

echo "2. Installing Capacitor 7 (supports Android 14 / 15 / 16 - API 35)..."
npm install --no-save @capacitor/core@^7.0.0 @capacitor/cli@^7.0.0 @capacitor/android@^7.0.0

if [ ! -d "android" ]; then
  echo "3. Generating Android project..."
  npx cap add android
fi

echo "4. Applying latest Android SDK 35 configuration (minSdk 24, targetSdk 35)..."
cp android-config/variables.gradle android/variables.gradle

echo "5. Copying school app icons into Android mipmap directories..."
for dir in android/app/src/main/res/mipmap-*; do
  if [ -d "$dir" ]; then
    cp public/pwa-512x512.png "$dir/ic_launcher.png" 2>/dev/null || true
    cp public/pwa-maskable-512x512.png "$dir/ic_launcher_round.png" 2>/dev/null || true
    cp public/pwa-maskable-512x512.png "$dir/ic_launcher_foreground.png" 2>/dev/null || true
  fi
done

echo "6. Syncing web assets into Android..."
npx cap sync android

echo "7. Compiling Debug APK (compatible with Android 7 to Android 16)..."
cd android
chmod +x gradlew
./gradlew assembleDebug

echo ""
echo "APK built successfully!"
echo "Output: android/app/build/outputs/apk/debug/app-debug.apk"
