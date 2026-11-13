# Baxışını dəyiş

Motivasiya və şəxsi inkişaf saytı və mobil tətbiqi (AZ / RU / EN).

## Struktur
- `www/` — sayt (HTML, CSS, JS). Mətnlər: `www/js/i18n.js`
- `android/` — Android tətbiq layihəsi (Capacitor)
- `ios/` — iOS tətbiq layihəsi (Capacitor)
- `assets/` — tətbiq ikonu və splash ekran mənbələri

## Saytı dəyişəndən sonra
```
npm install
npx cap sync
```

## Android APK
Hər push-dan sonra GitHub Actions APK-nı avtomatik yığır:
GitHub → **Actions** → **Android APK** → son run → **Artifacts** → `baxisini-deyis-apk`.
Play Store üçün: Android Studio-da `npm run android` → Build → Generate Signed Bundle (.aab).

## iOS
Mac və Xcode lazımdır: `npm install && npm run ios`, sonra Xcode-da Team seçib işə salın.
App Store üçün Apple Developer hesabı ($99/il) lazımdır.

## PWA (quraşdırılan veb-tətbiq)
Sayt internetdə yayımlananda telefonda "Ana ekrana əlavə et" ilə tətbiq kimi quraşdırılır,
offline da işləyir. GitHub Pages: Settings → Pages → Source: **GitHub Actions** (main branch-dan yayımlanır).
