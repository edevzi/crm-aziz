#!/bin/bash
set -e

echo "=== Lokal APK yig'ish boshlandi ==="

# 1. Java (OpenJDK 17) yo'lini aniqlash
if [ -d "/opt/homebrew/opt/openjdk@17" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
elif [ -d "/usr/local/opt/openjdk@17" ]; then
  export JAVA_HOME="/usr/local/opt/openjdk@17"
else
  echo "Xatolik: Java (OpenJDK 17) topilmadi. Iltimos o'rnatilishini kuting."
  exit 1
fi

export PATH="$JAVA_HOME/bin:$PATH"
echo "Java topildi: $JAVA_HOME"
java -version

# 2. Loyiha papkasiga o'tish va native Android loyihasini generatsiya qilish
cd "$(dirname "$0")"
echo "Expo Prebuild generatsiya qilinmoqda..."
npx expo prebuild --platform android --no-install --clean

# 3. Gradle orqali APK yig'ish
cd android
echo "Gradlew yordamida APK yig'ilmoqda..."
chmod +x gradlew
./gradlew assembleDebug

# 4. Tayyor APK'ni Ish stoliga (Desktop) nusxalash
GENERATED_APK="app/build/outputs/apk/debug/app-debug.apk"
DESKTOP_PATH="/Users/edevzi/Desktop/Driver-CRM-Final.apk"

if [ -f "$GENERATED_APK" ]; then
  cp "$GENERATED_APK" "$DESKTOP_PATH"
  echo "============================================="
  echo "   MUVAFFAQIYATLI TUGADI! 🎉"
  echo "============================================="
  echo "Tayyor APK fayli to'g'ridan-to'g'ri Ish stolingizda (Desktop) yaratildi:"
  echo "👉 $DESKTOP_PATH"
  echo "Uni telefoningizga o'rnatib ishlatishingiz mumkin."
else
  echo "Xatolik: APK fayli topilmadi!"
  exit 1
fi
