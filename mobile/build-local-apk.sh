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
# NOTE: --no-install olib tashlandi — ba'zi Expo 54 pluginlari prebuild vaqtida paket
# versiyalarini tekshiradi va bu qadamsiz xato berishi mumkin
npx expo prebuild --platform android --clean

# 2.5. Android SDK yo'lini aniqlash va sozlash
export ANDROID_HOME="$HOME/Library/Android/sdk"
if [ ! -d "$ANDROID_HOME" ]; then
  echo "Xatolik: Android SDK topilmadi: $ANDROID_HOME"
  echo "Android Studio orqali SDK o'rnatilganligini tekshiring."
  exit 1
fi
echo "Android SDK sozlanmoqda: $ANDROID_HOME"
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

# 3. Gradle orqali APK yig'ish
cd android
echo "Gradlew yordamida APK yig'ilmoqda..."
chmod +x gradlew
# --no-daemon: CI/lokal buildlarda daemon muammolarini oldini olish uchun
./gradlew assembleRelease --no-daemon

# 4. Tayyor APK'ni Ish stoliga (Desktop) nusxalash
GENERATED_APK="app/build/outputs/apk/release/app-release.apk"
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
