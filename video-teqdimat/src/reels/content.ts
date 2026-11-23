// ─────────────────────────────────────────────────────────────
//  "Mühasib — ilk iş günü" · Instagram Reels reklamı (1080×1920, 30 FPS)
//  Mətnlər, bildirişlər və səhnə ardıcıllığı. Vaxtlar timeline.json-dadır
//  (scripts/reels-timeline.py diktor səslərinin uzunluğuna görə yaradır).
// ─────────────────────────────────────────────────────────────

export const R_COLORS = {
  ink: '#0E1320',
  white: '#FFFFFF',
  gold: '#F2C14E', // vurğu (altyazıda açar sözlər)
  rose: '#FF5D8F', // stres/xəbərdarlıq
  mint: '#3DDC97', // həll/özünəinam
  glass: 'rgba(16, 20, 32, 0.62)',
};

// Altyazı: *ulduz* arasındakı söz qızılı, ~tilda~ arasındakı çəhrayı, _alt xətt_ arasındakı yaşıl vurğulanır.
export type Scene = {
  id: string;
  clip: string; // public/reels/clips/*.mp4
  voice: string; // diktor mətni (səsə çevrilib)
  caption: string; // ekrandakı altyazı
  overlay?: 'hook' | 'tasks1' | 'tasks2' | 'monthend' | 'question' | 'course' | 'skills' | 'doubt' | 'cta';
};

export const SCENES: Scene[] = [
  {
    id: 's1',
    clip: 'reels/clips/s1.mp4',
    voice: 'Təsəvvür edin. Mühasib vəzifəsinə işə qəbul olunmusunuz. Sabah ilk iş gününüzdür.',
    caption: 'Mühasib kimi *işə qəbul* olunmusunuz. Sabah *ilk iş gününüzdür*.',
    overlay: 'hook',
  },
  {
    id: 's2',
    clip: 'reels/clips/s2.mp4',
    voice: 'İşə gəlirsiniz və qarşınızda tapşırıqlar bir-birinin ardınca yaranır.',
    caption: 'İşə gəlirsiniz və tapşırıqlar *bir-birinin ardınca* yaranır…',
  },
  {
    id: 's3',
    clip: 'reels/clips/s3.mp4',
    voice: 'Yeni işçi işə qəbul edilməlidir. Elektron qaimə göndərilməlidir.',
    caption: '~Yeni işçi~ qəbul edilməlidir. ~Elektron qaimə~ göndərilməlidir.',
    overlay: 'tasks1',
  },
  {
    id: 's4',
    clip: 'reels/clips/s4.mp4',
    voice: 'Bank əməliyyatları yoxlanılmalı, vergi kabinetinə daxil olan məktub cavablandırılmalıdır.',
    caption: '~Bank əməliyyatları~ yoxlanılmalı, ~vergi kabinetindəki məktub~ cavablandırılmalıdır.',
    overlay: 'tasks2',
  },
  {
    id: 's5',
    clip: 'reels/clips/s5.mp4',
    voice: 'Ayın sonunda isə əməkhaqqı hesablanmalı, vergi və sosial sığorta hesabatları hazırlanmalıdır.',
    caption: 'Ayın sonunda isə ~əməkhaqqı~, ~vergi~ və ~sosial sığorta~ hesabatları…',
    overlay: 'monthend',
  },
  {
    id: 's6',
    clip: 'reels/clips/s6.mp4',
    voice: 'İndi özünüzə bir sual verin. Bütün bu işləri müstəqil şəkildə yerinə yetirməyə hazırsınızmı?',
    caption: 'Bütün bu işləri *müstəqil* yerinə yetirməyə hazırsınızmı?',
    overlay: 'question',
  },
  {
    id: 's7',
    clip: 'reels/clips/s7.mp4',
    voice: 'Əgər cavabınız xeyrdirsə, bu praktiki təlim məhz sizin üçündür.',
    caption: 'Cavabınız *xeyrdirsə* — bu praktiki təlim *məhz sizin üçündür!*',
    overlay: 'course',
  },
  {
    id: 's8',
    clip: 'reels/clips/s8.mp4',
    voice: 'Vergi kabineti, elektron qaimə, ƏMAS, bank əməliyyatları və əməkhaqqı. Hər mövzunu özünüz tətbiq edəcəksiniz.',
    caption: 'Hər mövzunu _özünüz tətbiq_ edəcəksiniz — sadəcə dinləməyəcəksiniz.',
    overlay: 'skills',
  },
  {
    id: 's9',
    clip: 'reels/clips/s9.mp4',
    voice: 'Artıq "bunu bacararam, yoxsa yox?" tərəddüdü olmayacaq. Gündəlik işləri müstəqil icra edəcəksiniz.',
    caption: 'Artıq *«Bunu bacararam, yoxsa yox?»* tərəddüdü olmayacaq.',
    overlay: 'doubt',
  },
  {
    id: 's10',
    clip: 'reels/clips/s10.mp4',
    voice: 'Diplomunuz ola bilər. Amma təcrübə lazımdırsa, gəlin, həmin təcrübəni birlikdə qazanaq!',
    caption: 'Diplomunuz ola bilər. Gəlin, *təcrübəni birlikdə qazanaq!*',
    overlay: 'cta',
  },
];

// Stres səhnələrində telefon bildirişləri kimi düşən tapşırıqlar
export const NOTIFS = {
  tasks1: [
    { icon: 'user', app: 'ƏMAS', text: 'Yeni işçi: əmək müqaviləsi gözləyir' },
    { icon: 'doc', app: 'E-qaimə', text: 'Elektron qaimə göndərilməlidir' },
  ],
  tasks2: [
    { icon: 'bank', app: 'Bank', text: '14 əməliyyat yoxlanılmayıb' },
    { icon: 'mail', app: 'Vergi kabineti', text: '1 yeni məktub · cavab gözlənilir' },
  ],
  monthend: [
    { icon: 'calc', app: 'Əməkhaqqı', text: 'Ay bitir — hesablanmalıdır' },
    { icon: 'doc', app: 'Vergi', text: 'Hesabatın təqdim müddəti yaxınlaşır' },
    { icon: 'shield', app: 'Sosial sığorta', text: 'Hesabat hazırlanmalıdır' },
  ],
};

export const SKILLS = ['Vergi kabineti', 'Elektron qaimə', 'ƏMAS', 'Bank əməliyyatları', 'Əməkhaqqı', 'Vergi hesabatları'];

export const COURSE_TITLE = 'Praktiki mühasibatlıq təlimi';
export const CTA = {
  title: 'Praktiki mühasibatlıq təlimi',
  button: 'Qeydiyyat üçün Direct-ə yazın',
  note: '', // əlavə qısa qeyd (məs. başlama tarixi); boş qalsa göstərilmir
};
