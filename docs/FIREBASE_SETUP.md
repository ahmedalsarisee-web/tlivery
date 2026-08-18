# إعداد Firebase لمشروع Tlivery

المشروع: https://console.firebase.google.com/project/tlivery-87ad0/overview

تطبيق Wasel في `C:\Wasel` لم يُغيَّر.

## خطوات يجب تنفيذها مرة واحدة من الكونسول

Firestore و Storage لم يُنشآ بعد في المشروع الجديد. من الكونسول:

1. **Firestore:** افتح [Firestore](https://console.firebase.google.com/project/tlivery-87ad0/firestore) واضغط Create database (يفضّل الموقع `me-central1` إن ظهر، وإلا أقرب موقع).
2. **Storage:** افتح [Storage](https://console.firebase.google.com/project/tlivery-87ad0/storage) واضغط Get Started.
3. **Authentication:** افتح [Authentication](https://console.firebase.google.com/project/tlivery-87ad0/authentication) وفعّل مزود Email/Password.

ثم من `C:\Tlivery`:

```powershell
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage,functions --project tlivery-87ad0
```

## نقل الحسابات (17 حساباً صُدّرت محلياً)

من مشروع Wasel انسخ **Password hash parameters**:
Authentication → Users → ⋮ → Password hash parameters

ثم:

```powershell
npx firebase-tools auth:import scripts/.migrate-tmp/auth-users.json --project tlivery-87ad0 --hash-algo SCRYPT --hash-key "<BASE64_HASH_KEY>" --salt-separator "<SALT_SEPARATOR>" --rounds 8 --mem-cost 14
```

القيم `rounds` و `mem-cost` يجب أن تطابق ما يظهر في كونسول Wasel.

## نقل Firestore والملفات

بعد إنشاء قاعدة البيانات والتخزين:

```powershell
node scripts/bootstrap-firebase.mjs
```

يتطلب أيضاً:

```powershell
gcloud auth application-default login
```

حتى يستطيع السكربت القراءة من `wasel-47a78` والكتابة في `tlivery-87ad0` دون تعديل Wasel.
