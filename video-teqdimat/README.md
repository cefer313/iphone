# Video təqdimat — Çəkiliş, məzmun yaradılması və montaj

Remotion layihəsi: 1080×1920 (9:16), 30 FPS, 90 saniyə (2700 kadr), H.264 MP4.

## Tez başlanğıc

Node.js 18+ lazımdır.

```bash
npm install
npm run studio     # brauzerdə önizləmə və redaktə
npm run render     # out/teqdimat.mp4 faylını yaradır
npm run stills     # hər səhnədən yoxlama kadrları: out/stills/
```

İlk render zamanı Remotion öz Chromium-unu avtomatik yükləyir. Öz brauzerinizdən istifadə etmək istəsəniz:

```bash
REMOTION_BROWSER=/yol/chrome-headless-shell npm run render
```

## Nəyi harada dəyişmək olar

Bütün mətnlər, qiymətlər, rənglər, səhnə vaxtları və əlaqə məlumatları bir fayldadır: **`src/config.ts`**.

| Nə | Harada |
|---|---|
| Paketlər və qiymətlər | `PACKAGES` |
| Səhnə mətnləri | `TEXT.s1` … `TEXT.s8` |
| Rənglər | `COLORS` |
| Səhnələrin başlama vaxtı və müddəti | `TIMING` |
| Ad, loqo, Instagram, telefon | `CONTACT` |
| Fon musiqisi | `MUSIC` |

### Əlaqə məlumatları
`CONTACT` sahələri boşdursa, videoda heç nə göstərilmir. Doldurduqda ad giriş səhnəsində, bütün məlumatlar isə son səhnədə görünür:

```ts
export const CONTACT = {
  name: 'Studio Adı',
  logo: 'logo.png',          // fayl public/ qovluğunda olmalıdır
  instagram: '@studio',
  phone: '+994 50 000 00 00',
};
```

### Musiqi
İstifadə hüququnuz olan instrumental faylı `public/` qovluğuna qoyun və `MUSIC.file` sahəsinə adını yazın (məs. `'fon.mp3'`). Səs aşağı səviyyədədir (`volume: 0.18`), girişdə və sonda yumşaq keçir. Sahə boşdursa, video səssizdir.

## Struktur

```
src/
  config.ts              bütün məzmun və parametrlər
  fonts.ts               şriftlərin render-dən əvvəl yüklənməsi
  Teqdimat.tsx           əsas kompozisiya (fon + 8 səhnə + musiqi)
  components/
    anim.tsx             Reveal, SceneShell, easing
    Icon.tsx             xətti ikonlar
    Elements.tsx         fon, kamera çərçivəsi, timeline, PackageCard, ServiceItem
  scenes/                Səhnə 1–8
scripts/stills.mjs       yoxlama kadrları
```

## Şriftlər
Montserrat (başlıqlar, qiymətlər) və Inter (mətn). Şriftlər `@fontsource` paketləri ilə layihənin içindədir, render üçün internet lazım deyil. Hər ikisi Ə ə ı İ ş ç ö ü ğ hərflərini dəstəkləyir.
