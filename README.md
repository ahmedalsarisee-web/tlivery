# Tlivery

نسخة Expo Go من منصة التوصيل، مربوطة بمشروع Firebase `tlivery-87ad0`.
تطبيق Wasel الأصلي في `C:\Wasel` لم يُغيَّر.

## تشغيل التطبيق على Expo Go

```powershell
cd C:\Tlivery\TliveryMobile
npm install
npx expo start
```

ثم امسح QR من تطبيق Expo Go على الهاتف (نفس شبكة Wi‑Fi).

## لوحة الويب

```powershell
cd C:\Tlivery\TliveryWebPlatform
npm install
npm run dev
```

## Firebase

المشروع: https://console.firebase.google.com/project/tlivery-87ad0/overview

تم إنشاء تطبيق Web وربط المفاتيح. بقي تفعيل Firestore و Storage و Authentication من الكونسول ثم نشر القواعد ونقل البيانات. التفاصيل في `docs/FIREBASE_SETUP.md`.
