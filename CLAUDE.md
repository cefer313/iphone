# iphone — Claude üçün təlimat

Bu repozitoriya istifadəçinin video layihələridir: video təqdimatlar və reklamlar, animasiya videoları. Dil materialları burada **deyil** — onlar ayrıca repozitoriyalardadır:
`cefer313/ingilis_dili` (ingilis dili), `cefer313/fars-dili` (fars dili), `cefer313/-r-b-dili` (ərəb dili).
Saytlar, tətbiqlər və oyunlar (o cümlədən "Baxışını dəyiş") `cefer313/web-program` repozitoriyasındadır.

Bu fayldakı qaydalara hər söhbətdə əməl et.

## Ünsiyyət

- Həmişə **Azərbaycan dilində** cavab ver. Sadə, aydın izah et; texniki terminləri lazım olanda izah et.
- Bilmədiyin və ya yoxlaya bilmədiyin şeyi açıq de (məs. səsin tələffüzünü qulaqla yoxlaya bilməmək). Uydurma.
- Pul/kredit xərclənən işlərdə (Higgsfield) sonda təxmini xərci de.

## Git qaydaları

- Bu repozitoriyada işləri **ayrıca budaqda** et və o budağa göndər. `main`-ə yalnız istifadəçi açıq icazə verəndə yaz.
- Böyük yaradılmış fayllar (video klipləri, səs fayllarının xam variantları) repoya əlavə olunmur — `.gitignore` və mənbə siyahısı (`SOURCES.md`) ilə idarə olunur. Hazır son videolar `videolar/` qovluğuna və ya layihənin `out/` qovluğuna qoyulur.

## Repozitoriyanın quruluşu

| Qovluq / fayl | Nədir |
|---|---|
| `video-teqdimat/` | Remotion layihəsi: xidmət təqdimatı videosu (`Teqdimat`) və mühasibatlıq Reels reklamı (`MuhasibReels`). Bütün mətnlər/qiymətlər `src/config.ts` və `src/reels/content.ts`-dədir |
| `videolar/` | Hazır animasiya videoları və filmlər (siyahı: `videolar/README.md`) |

## Dil dərslikləri

Ərəb, fars və ingilis dili materialları öz repozitoriyalarına yazılır; qaydaları həmin repozitoriyaların `CLAUDE.md` faylındadır.
Bu repozitoriyada dil dərsliyi istənsə, uyğun repozitoriyanı söhbətə qoş və işi orada gör.

## Videolar və reklamlar

- Ekran mətnləri **Azərbaycan dilində**. Şrift Azərbaycan hərflərini, xüsusilə böyük **Ə**-ni dəstəkləməlidir: **Montserrat** və **Inter** uyğundur (Manrope böyük Ə-ni dəstəkləmir).
- Reklamlarda **sübutsuz iddialar yazma**: satış/izləyici zəmanəti, "ən çox seçilən", "yerlər məhduddur", uydurma endirim və ya əlaqə məlumatı olmaz. Əlaqə məlumatı verilməyibsə, göstərilmir.
- Reels/Instagram: 1080×1920, H.264, `yuv420p`, `+faststart`, səs −14…−16 LUFS. Səssiz izləyənlər üçün iri altyazılar.
- Hazır videonu göndərməzdən əvvəl hər səhnədən kadr çıxarıb yoxla (mətn daşması, səhv hərəkət, personajın uyğunluğu).

### Süni intellektlə video (Higgsfield)

- Personaj ardıcıllığı üçün: əvvəl bir əsas portret/kadr (`gpt_image_2_6`), sonra bütün səhnə kadrları ona istinadla; video üçün **Kling 3.0 Pro** (start kadr, lazım olsa end kadr ilə — hərəkəti dəqiq idarə etmək üçün).
- Azərbaycanca diktor: ElevenLabs (`text2speech_v2`, variant `elevenlabs`). Qadın səsi: **"Elena"**. Rəqəmləri sözlə yaz ("dörd yüz manat"), "AZN" əvəzinə "manat".
- Fon musiqisi lazımdırsa, lisenziya problemi olmasın deyə ya sintez et (numpy), ya da istifadəçidən fayl istə.

### Dini mövzulu səhnələr

- Hörmətlə və dəqiq göstər: məsciddə ayaqqabısız; səcdə düzgün (alın, burun, ovuclar, dizlər, ayaq barmaqları yerdə; dirsəklər yerdən yuxarı); dua — ovuclar yuxarı, sinə qarşısında.
- Müqəddəs şəxslər (məs. İmam Mehdi) göstəriləndə **üz heç bir kadrda görünmür**: yalnız arxadan və ya əllərin yaxın planı; profil, əks, kölgə də olmaz. Hər kadrı yoxla.

## Mühit

- Bu repo "iphone" bulud mühitində işləyir. Orada Higgsfield üçün lazımi ünvanlar (`d8j0ntlcm91z4.cloudfront.net`, `upload.higgsfield.ai` və s.) açıqdır.
- Render üçün Chromium: `/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell`.

## Yeni qaydalar

İstifadəçi yeni qayda və ya üstünlük deyəndə (məs. "bundan sonra belə et"):
1. Onu bu fayla, uyğun bölməyə əlavə et (uyğun bölmə yoxdursa, aşağıdakı siyahıya).
2. Dəyişikliyi dərhal commit edib göndər.
3. İstifadəçiyə qısaca hansı qaydanı yadda saxladığını de.

### Əlavə olunmuş qaydalar (tarixlə)

- 2026-11-25 — Bu fayl yaradıldı; yuxarıdakı qaydalar əvvəlki işlərdən toplandı.
- 2026-11-25 — Dil materialları ayrıca repozitoriyalara köçürüldü (ingilis_dili, fars-dili, -r-b-dili).
- 2026-11-25 — Saytlar/tətbiqlər/oyunlar üçün `web-program` repozitoriyası yaradıldı; "Baxışını dəyiş" saytı/tətbiqi ora köçürüldü.
