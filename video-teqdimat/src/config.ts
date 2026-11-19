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
export const SFX_VOLUME = 0.45;

// ─── SƏHNƏLƏRİN VAXTI (kadr, 30 FPS) ────────────────────────
export const TIMING = {
  s1: { from: 0, duration: 210 }, // 0–7 san
  s2: { from: 210, duration: 330 }, // 7–18 san
  s3: { from: 540, duration: 450 }, // 18–33 san
  s4: { from: 990, duration: 270 }, // 33–42 san
  s5: { from: 1260, duration: 420 }, // 42–56 san
  s6: { from: 1680, duration: 390 }, // 56–69 san
  s7: { from: 2070, duration: 420 }, // 69–83 san
  s8: { from: 2490, duration: 210 }, // 83–90 san
};
// Qeyd: səhnə müddətləri diktor mətninin uzunluğuna görə tənzimlənib (cəmi 2700 kadr = 90 san).

// ─── DİKTOR SƏSİ (qadın, Azərbaycan dili) ───────────────────
// Fayllar: public/voice/s1.mp3 … s8.mp3. Mətnlər VOICE_SCRIPT-dədir.
// offset: səsin səhnə daxilində başladığı kadr · length: faylın uzunluğu (san)
export const VOICE = {
  enabled: true,
  volume: 1,
  musicDuck: 0.42, // diktor danışanda musiqi bu nisbətə enir
  clips: {
    s1: { file: 'voice/s1.mp3', offset: 15, length: 6.11 },
    s2: { file: 'voice/s2.mp3', offset: 10, length: 10.03 },
    s3: { file: 'voice/s3.mp3', offset: 12, length: 13.16 },
    s4: { file: 'voice/s4.mp3', offset: 12, length: 7.0 },
    s5: { file: 'voice/s5.mp3', offset: 12, length: 12.82 },
    s6: { file: 'voice/s6.mp3', offset: 12, length: 11.96 },
    s7: { file: 'voice/s7.mp3', offset: 12, length: 11.8 },
    s8: { file: 'voice/s8.mp3', offset: 12, length: 5.15 },
  },
};

export const VOICE_SCRIPT = {
  s1: 'Markanızın dəyərini görünən edin. Çəkiliş, məzmun yaradılması və montaj.',
  s2: 'Məqsəddən hazır videoya. Strategiya. İdeya. Ssenari. Çəkiliş. Montaj. Markanıza uyğun, auditoriyanıza xitab edən.',
  s3: 'Aylıq əməkdaşlıq paketləri. Start: ayda dörd yüz manat, on video, üstəlik iki video hədiyyə. Pro: ayda yeddi yüz manat, iyirmi video. Premium: ayda min yüz manat, otuz video.',
  s4: 'Bütün aylıq paketlərə daxildir: ödənişsiz konsultasiya, səhifə analizi və bazar araşdırması.',
  s5: 'Hədəf auditoriyasının müəyyənləşdirilməsi. Kontent strategiyası və ssenarilər. Peşəkar çəkiliş və montaj. Əməkdaşlıq boyu mentorluq. Nə paylaşacağınızı birlikdə planlaşdırırıq.',
  s6: 'Tək video sifarişi: yetmiş manatdan başlayan qiymətlərlə. İdeya, çəkiliş, montaj. Yekun qiymət formatdan, ssenaridən, çəkiliş məkanından və iş həcmindən asılıdır.',
  s7: 'Bir çəkilişdə bir neçə məzmun. Bir saat yarımlıq çəkiliş: yüz əlli manat. İdeyalar, istiqamətləndirmə, çəkiliş və montaj daxildir. Video sayı format və ssenaridən asılıdır.',
  s8: 'Markanız üçün növbəti addımı birlikdə ataq. Uyğun paketi seçmək üçün mənə yazın.',
};

// ─── SİNXRONLAMA: elementlərin açıldığı kadrlar (səhnə daxilində) ─
// Diktorun hər ifadəsinin başlama anına uyğunlaşdırılıb.
export const SYNC = {
  s1: { services: 84 },
  s2: { steps: [100, 125, 154, 178, 215], accent: [258, 270] },
  // Kartlar tez açılır (son 9+ saniyədə hər üçü görünür); diktor hər paketi oxuyanda kart vurğulanır.
  s3: { cards: [20, 60, 100], gift: 146, highlight: [82, 226, 319, 440] },
  s4: { items: [72, 130, 170] },
  s5: { items: [10, 104, 183, 252], accent: 312 },
  s6: { price: 50, sub: 70, flow: [130, 148, 169], switchAt: 196, factors: [212, 227, 241, 316] },
  s7: { card: 84, chime: 140, includes: 174, items: [180, 207, 234, 261], note: 286 },
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

const Y = SYNC;
export const SFX: Cue[] = [
  // Səhnə 1 — kamera çərçivəsi, başlıq, qızılı xətt
  cue('shutter', T.s1.from + 4, 0.7),
  cue('whoosh', T.s1.from + 26, 0.4),
  cue('chime', T.s1.from + 64, 0.35),
  // Səhnə 2 — hər mərhələ diktor onu deyəndə "tick" ilə açılır
  cue('whoosh', T.s2.from - 6, 0.45),
  ...Y.s2.steps.map((f) => cue('tick', T.s2.from + f + 2, 0.5)),
  cue('chime', T.s2.from + Y.s2.accent[0], 0.3),
  // Səhnə 3 — kartlar açılır; hədiyyə nişanı üçün zəng
  cue('whoosh', T.s3.from - 6, 0.45),
  ...Y.s3.cards.map((f) => cue('pop', T.s3.from + f + 2, 0.65)),
  cue('chime', T.s3.from + Y.s3.gift, 0.4),
  // Səhnə 4 — üç xidmət
  cue('whoosh', T.s4.from - 6, 0.45),
  ...Y.s4.items.map((f) => cue('pop', T.s4.from + f + 2, 0.55)),
  // Səhnə 5 — dörd xidmət + yekun cümlə
  cue('whoosh', T.s5.from - 6, 0.45),
  ...Y.s5.items.map((f) => cue('pop', T.s5.from + f + 2, 0.55)),
  cue('chime', T.s5.from + Y.s5.accent, 0.3),
  // Səhnə 6 — qiymət, iş axını, amillər
  cue('whoosh', T.s6.from - 6, 0.45),
  cue('chime', T.s6.from + Y.s6.price + 4, 0.4),
  ...Y.s6.flow.map((f) => cue('tick', T.s6.from + f + 2, 0.45)),
  cue('whoosh', T.s6.from + Y.s6.switchAt - 10, 0.3),
  ...Y.s6.factors.map((f) => cue('tick', T.s6.from + f + 2, 0.4)),
  // Səhnə 7 — qiymət kartı, saat əqrəbi, siyahı, qeyd
  cue('whoosh', T.s7.from - 6, 0.45),
  cue('pop', T.s7.from + Y.s7.card + 2, 0.5),
  ...Array.from({ length: 10 }, (_, i) => cue('clock', T.s7.from + Y.s7.card + 18 + i * 6, 0.45 - i * 0.03)),
  cue('chime', T.s7.from + Y.s7.chime, 0.4),
  ...Y.s7.items.map((f) => cue('tick', T.s7.from + f + 2, 0.45)),
  cue('pop', T.s7.from + Y.s7.note + 2, 0.45),
  // Səhnə 8 — dəvət və yekun akkord
  cue('whoosh', T.s8.from - 6, 0.45),
  cue('chime-final', T.s8.from + 36, 0.5),
];
