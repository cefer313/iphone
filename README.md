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

## Şəriət məsələləri (kitab bölməsi)
`www/serieet/` — Ayətullah əl-üzma Seyid Əli Sistani cənablarının fətvaları, «Geniş izahlı şəriət məsələləri», I cild
(tərcümə: Bəxtiyar Hüseynov; nəşr: «Zərdabi LTD» MMC, Bakı, 2018). Nəşriyyatın icazəsi ilə, nəşriyyatın adı qeyd
edilmək şərti ilə dərc olunur — `serieet/` səhifəsində və ana səhifədəki kitab bölməsində bu qeyd silinməməlidir.

Mətn PDF-dən avtomatik çıxarılır (dəyişiklik edilmədən):
```
pip install pymupdf
python3 tools/toc.py azari-book-25262.pdf tools/toc.json
python3 tools/extract.py azari-book-25262.pdf www/serieet/data
python3 tools/verify.py azari-book-25262.pdf www/serieet/data   # PDF ilə simvol-simvol müqayisə
```
Qeyd: kitabın öz nömrələməsində 53, 162, 247 iki dəfə gəlir; 54, 161, 248, 1020, 2039, 2362 yoxdur — olduğu kimi saxlanılıb.
