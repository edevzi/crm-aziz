# 📱 Driver CRM - Mobil Ilova (Expo / React Native)

Ushbu mobil ilova haydovchilar (haydovchi: **Polat**) uchun maxsus ishlab chiqilgan bo'lib, **Expo Go** platformasi yordamida Android va iOS qurilmalarida real-vaqt rejimida testlash uchun mo'ljallangan.

---

## ✨ Imkoniyatlari:
1. **Kirish (Auth):**
   * Login: `driver`
   * Parol: `driver123`
2. **Buyurtmalarni boshqarish:**
   * Haydovchiga biriktirilgan buyurtmalarni **real-vaqt rejimida** (realtime) ko'rish.
   * Har 10 soniyada yangi buyurtmalar bormi deb avtomatik tekshirib turadi va yangi buyurtma biriktirilganda telefon vibratsiya berib ogohlantiradi (Local Notification simulyatsiyasi).
3. **Statuslarni yangilash:**
   * `Biriktirildi (assigned)` -> `Yo'lda (in_progress)` -> `Konteyner qo'yildi (container_placed)` -> `Yuklandi (picked_up)` -> `Yakunlandi (completed)`.
4. **To'lovlarni qabul qilish:**
   * Buyurtmani yakunlashda to'lov usulini belgilash imkoniyati: **Naqd pul**, **Karta**, yoki **Onlayn o'tkazma**.
   * To'lov qabul qilinganda serverda avtomatik ravishda to'lov statusi `received` (to'landi) qilinadi va hisobotlarda aks etadi.
5. **Dinamik Server IP Sozlamasi:**
   * Ilova ichidagi Sozlamalar (⚙️) tugmasi orqali o'z kompyuteringizning Wi-Fi IP manzilini kiritishingiz mumkin. Bu sizning jismoniy Android telefoningizda ham localhost dagi ma'lumotlar bilan ishlash imkonini beradi!

---

## 🚀 Ishga tushirish (Expo Go orqali):

1. **Kompyuteringiz va Telefoningizni bitta Wi-Fi tarmoqqa ulang.**
2. **Katalogni oching:**
   ```bash
   cd mobile
   ```
3. **Ilovani ishga tushiring:**
   ```bash
   npm start
   ```
4. Telefoningizda **Expo Go** ilovasini oching (Google Play Store yoki App Store dan yuklab oling) va terminalda chiqqan **QR kodni skanerlang**.
5. Ilova yuklangach, kirish ekranining yuqori o'ng burchagidagi **Sozlamalar (⚙️)** belgisini bosing va u yerga **kompyuteringizning Wi-Fi IP manzilini** kiriting.
   * *IP manzilni topish:*
     * macOS da: `ipconfig getifaddr en0` yoki tizim sozlamalaridan.
     * Windows da: terminalda `ipconfig` yozib `IPv4 Address`ni ko'ring.

---

## 📦 APK formatda yig'ish (Build):

Ilovani mustaqil Android `.apk` fayli ko'rinishida yig'ish va o'rnatish uchun quyidagi qadamlarni bajaring:

1. **EAS CLI-ni o'rnating:**
   ```bash
   npm install -g eas-cli
   ```
2. **Expo hisobiga kiring:**
   ```bash
   eas login
   ```
3. **Loyihani konfiguratsiya qiling:**
   ```bash
   eas build:configure
   ```
4. **APK uchun build qiling (Local build orqali yoki Expo Cloud-da):**
   * *Expo Cloud bepul serverida yig'ish:*
     ```bash
     eas build -p android --profile preview
     ```
   * *O'z kompyuteringizda mahalliy yig'ish (Java/Android SDK kerak bo'ladi):*
     ```bash
     eas build -p android --profile preview --local
     ```

Build yakunlangach, sizga **`.apk`** yuklab olish havolasi beriladi yoki fayl kompyuteringizda paydo bo'ladi. Uni telefonga o'rnatib bemalol ishlatishingiz mumkin!
