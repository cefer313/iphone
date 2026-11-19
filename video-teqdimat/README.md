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

### Diktor səsi (qadın, Azərbaycan dili)
Hər səhnənin mətni qadın səsi ilə oxunur: `public/voice/s1.mp3` … `s8.mp3`. Səslər Higgsfield-də (ElevenLabs mühərriki, "Elena" səsi) yaradılıb, oxunan mətnlər `src/config.ts` → `VOICE_SCRIPT`-dədir.

- Animasiyalar diktorla sinxrondur: hər element diktor onu deyəndə açılır (`SYNC`). Paket kartları erkən açılır, diktor hansı paketi oxuyursa, o kart qızılı haşiyə ilə vurğulanır.
- Diktor danışanda fon musiqisi avtomatik enir (`VOICE.musicDuck`).
- Mətni dəyişsəniz: yeni səsi yaradın, faylı `public/voice/` qovluğunda əvəz edin, `VOICE.clips` içində `length` (saniyə) və lazım olsa `SYNC` kadrlarını yeniləyin.
- Diktoru söndürmək: `VOICE.enabled = false`.

### Səs
Fon musiqisi və bütün effektlər `scripts/generate-audio.py` ilə sıfırdan sintez olunub (`public/audio/`). Kənar səs faylı istifadə olunmayıb, ona görə lisenziya məhdudiyyəti yoxdur.

| Səs | Harada səslənir |
|---|---|
| `music.wav` | Sakit ambient fon (D major), bütün video boyu, aşağı səviyyədə |
| `shutter.wav` | Səhnə 1 — kamera çərçivəsi yaranarkən |
| `whoosh.wav` | Səhnələr arası keçidlər |
| `tick.wav` | Mərhələlər, iş axını və siyahı elementləri |
| `pop.wav` | Paket kartları və xidmət kartları açılarkən |
| `chime.wav` | Qiymətlər, hədiyyə nişanı və vurğulanan cümlələr |
| `clock.wav` | Səhnə 7 — saat əqrəbi fırlanarkən |
| `chime-final.wav` | Səhnə 8 — yekun akkord |

- Səsləri yenidən yaratmaq: `python3 scripts/generate-audio.py` (numpy lazımdır).
- Effektlərin vaxtı və səviyyəsi: `src/config.ts` → `SFX`. Hamısını söndürmək: `SFX_VOLUME = 0`.
- Öz musiqinizi istifadə etmək: faylı `public/` qovluğuna qoyub `MUSIC.file` sahəsinə adını yazın. Musiqini tam söndürmək üçün sahəni boş saxlayın.

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
