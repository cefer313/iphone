// ─────────────────────────────────────────────────────────────
//  BÜTÜN MƏTNLƏR, QİYMƏTLƏR, RƏNGLƏR VƏ ƏLAQƏ MƏLUMATLARI BURADADIR
//  Videonu dəyişmək üçün adətən yalnız bu faylı redaktə etmək kifayətdir.
// ─────────────────────────────────────────────────────────────

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 2700, // 90 saniyə
};

export const COLORS = {
  navy: '#101827', // tünd göy fon
  navySoft: '#17223A', // kartların alt tonu
  warm: '#F7F5EF', // isti ağ — əsas mətn
  gold: '#C8A86B', // qızılı vurğu
  muted: '#AEB5C2', // ikinci dərəcəli mətn (tünd fonda ~9:1 kontrast)
  line: 'rgba(247, 245, 239, 0.14)',
  goldSoft: 'rgba(200, 168, 107, 0.14)',
  goldLine: 'rgba(200, 168, 107, 0.55)',
};

export const FONTS = {
  display: "'Montserrat', 'Inter', sans-serif",
  body: "'Inter', 'Montserrat', sans-serif",
};

// Kənarlardan minimum məsafə (px). Yuxarı və aşağıda Instagram/WhatsApp
// interfeysi üçün əlavə boşluq saxlanılır.
export const SAFE = { side: 90, top: 150, bottom: 170 };

// ─── ƏLAQƏ MƏLUMATLARI ───────────────────────────────────────
// Boş saxlanılan sahələr videoda ümumiyyətlə göstərilmir.
// Loqo üçün faylı public/ qovluğuna qoyun və adını yazın, məs: 'logo.png'.
export const CONTACT = {
  name: '',
  logo: '',
  instagram: '', // məs: '@studio'
  phone: '', // məs: '+994 50 000 00 00'
};

// ─── FON MUSİQİSİ ───────────────────────────────────────────
// public/audio/music.wav — scripts/generate-audio.py ilə sintez olunub (lisenziyasız, öz səsimiz).
// Başqa musiqi istifadə etmək üçün faylı public/ qovluğuna qoyub adını yazın.
// Boş qalarsa, fon musiqisi olmur.
export const MUSIC = {
  file: 'audio/music.wav',
  volume: 0.32,
};

// Səs effektləri üçün ümumi səviyyə (0 = söndür, 1 = tam).
export const SFX_VOLUME = 0.55;

// ─── SƏHNƏLƏRİN VAXTI (kadr, 30 FPS) ────────────────────────
export const TIMING = {
  s1: { from: 0, duration: 210 }, // 0–7 san
  s2: { from: 210, duration: 240 }, // 7–15 san
  s3: { from: 450, duration: 540 }, // 15–33 san
  s4: { from: 990, duration: 300 }, // 33–43 san
  s5: { from: 1290, duration: 360 }, // 43–55 san
  s6: { from: 1650, duration: 390 }, // 55–68 san
  s7: { from: 2040, duration: 450 }, // 68–83 san
  s8: { from: 2490, duration: 210 }, // 83–90 san
};

// ─── SƏHNƏ MƏTNLƏRİ ─────────────────────────────────────────
export const TEXT = {
  s1: {
    kicker: 'Sosial media üçün məqsədli video məzmun',
    title: ['Markanızın dəyərini', 'görünən edin.'],
    services: ['Çəkiliş', 'Məzmun yaradılması', 'Montaj'],
  },
  s2: {
    title: 'Məqsəddən hazır videoya',
    steps: [
      { label: 'Strategiya', icon: 'target' },
      { label: 'İdeya', icon: 'bulb' },
      { label: 'Ssenari', icon: 'script' },
      { label: 'Çəkiliş', icon: 'camera' },
      { label: 'Montaj', icon: 'timeline' },
    ],
    accent: ['Markanıza uyğun.', 'Auditoriyanıza xitab edən.'],
  },
  s3: {
    title: 'Aylıq əməkdaşlıq paketləri',
  },
  s4: {
    title: 'Bütün aylıq paketlərə daxildir',
    items: [
      { title: 'Ödənişsiz konsultasiya', sub: 'Markanın ehtiyacları və məqsədləri', icon: 'chat' },
      { title: 'Səhifə analizi', sub: 'Bio, vizual təqdimat və təkmilləşdirmə', icon: 'profile' },
      { title: 'Bazar araşdırması', sub: 'Rəqiblər, mövqeləndirmə və fərqlənmə', icon: 'chart' },
    ],
  },
  s5: {
    title: 'Bütün aylıq paketlərə daxildir',
    items: [
      { title: 'Hədəf auditoriyasının müəyyənləşdirilməsi', icon: 'users' },
      { title: 'Kontent strategiyası və ssenarilər', icon: 'plan' },
      { title: 'Peşəkar çəkiliş və montaj', icon: 'camera' },
      { title: 'Mentorluq və istiqamətləndirmə', sub: 'Əməkdaşlıq müddətində', icon: 'compass' },
    ],
    accent: 'Nə paylaşacağınızı birlikdə planlaşdırırıq.',
  },
  s6: {
    title: 'Tək video sifarişi',
    priceMain: '70 AZN',
    priceSuffix: '-dən',
    priceLine: 'başlayan qiymətlərlə',
    sub: 'Konkret məhsul və ya xidmətin təqdimatı üçün',
    flow: ['İdeya', 'Çəkiliş', 'Montaj'],
    factorsTitle: 'Yekun qiymət nədən asılıdır?',
    factors: ['Format və mürəkkəblik', 'Ssenari və ideya', 'Çəkiliş məkanı', 'Tələb olunan iş həcmi'],
  },
  s7: {
    title: 'Bir çəkilişdə bir neçə məzmun',
    duration: '1,5 saatlıq çəkiliş',
    price: '150 AZN',
    includesLabel: 'Daxildir',
    includes: [
      'Video ideyalarının hazırlanması',
      'Təqdimat üzrə istiqamətləndirmə',
      'Çəkilişin təşkili və həyata keçirilməsi',
      'Çəkilmiş videoların montajı',
    ],
    highlightIndex: 3, // montaj sətri vurğulanır
    note: 'Video sayı formatdan, ssenaridən və çəkilişin mürəkkəbliyindən asılıdır.',
  },
  s8: {
    title: ['Markanız üçün', 'növbəti addımı birlikdə ataq.'],
    sub: 'Uyğun paketi seçmək üçün mənə yazın.',
  },
};

// ─── AYLIQ PAKETLƏR ─────────────────────────────────────────
export type Pkg = { name: string; price: string; period: string; videos: string; gift?: string };

export const PACKAGES: Pkg[] = [
  { name: 'START', price: '400 AZN', period: '/ ay', videos: '10 video', gift: '+ 2 video hədiyyə' },
  { name: 'PRO', price: '700 AZN', period: '/ ay', videos: '20 video' },
  { name: 'PREMIUM', price: '1100 AZN', period: '/ ay', videos: '30 video' },
];

// ─── SƏS EFFEKTLƏRİ (hər biri animasiya ilə eyni kadrda) ───────
// file: public/audio içindəki fayl · at: kadr · volume: nisbi səviyyə
export type Cue = { file: string; at: number; volume: number };

const T = TIMING;
const cue = (file: string, at: number, volume = 1): Cue => ({ file: `audio/${file}.wav`, at, volume });

export const SFX: Cue[] = [
  // Səhnə 1 — kamera çərçivəsi, başlıq, qızılı xətt
  cue('shutter', T.s1.from + 4, 0.7),
  cue('whoosh', T.s1.from + 26, 0.45),
  cue('chime', T.s1.from + 64, 0.45),
  // Səhnə 2 — keçid, hər mərhələ üçün yüngül "tick", sonda vurğu
  cue('whoosh', T.s2.from - 6, 0.5),
  ...[0, 1, 2, 3, 4].map((i) => cue('tick', T.s2.from + 24 + i * 18, 0.55)),
  cue('chime', T.s2.from + 130, 0.4),
  // Səhnə 3 — hər paket kartı açılır; hədiyyə nişanı üçün zəng
  cue('whoosh', T.s3.from - 6, 0.5),
  ...[0, 1, 2].map((i) => cue('pop', T.s3.from + 32 + i * 70, 0.75)),
  cue('chime', T.s3.from + 56, 0.5),
  // Səhnə 4 — üç xidmət
  cue('whoosh', T.s4.from - 6, 0.5),
  ...[0, 1, 2].map((i) => cue('pop', T.s4.from + 30 + i * 40, 0.6)),
  // Səhnə 5 — dörd xidmət + yekun cümlə
  cue('whoosh', T.s5.from - 6, 0.5),
  ...[0, 1, 2, 3].map((i) => cue('pop', T.s5.from + 28 + i * 36, 0.6)),
  cue('chime', T.s5.from + 192, 0.4),
  // Səhnə 6 — qiymət, iş axını, amillər
  cue('whoosh', T.s6.from - 6, 0.5),
  cue('chime', T.s6.from + 34, 0.5),
  ...[0, 1, 2].map((i) => cue('tick', T.s6.from + 80 + i * 18, 0.5)),
  cue('whoosh', T.s6.from + 186, 0.35),
  ...[0, 1, 2, 3].map((i) => cue('tick', T.s6.from + 220 + i * 16, 0.45)),
  // Səhnə 7 — qiymət kartı, saat əqrəbinin hərəkəti, siyahı, qeyd
  cue('whoosh', T.s7.from - 6, 0.5),
  cue('chime', T.s7.from + 30, 0.5),
  ...Array.from({ length: 10 }, (_, i) => cue('clock', T.s7.from + 42 + i * 6, 0.5 - i * 0.03)),
  ...[0, 1, 2, 3].map((i) => cue('tick', T.s7.from + 86 + i * 18, 0.5)),
  cue('pop', T.s7.from + 290, 0.5),
  // Səhnə 8 — dəvət və yekun akkord
  cue('whoosh', T.s8.from - 6, 0.5),
  cue('chime-final', T.s8.from + 36, 0.55),
];
