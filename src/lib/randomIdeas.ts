// Idea engine: combines subjects, personalities, jobs, and merch angles so the
// Shuffle button does not feel like a static template list.

import type { CharacterForm, DesignTheme, GenerationOptions } from '@/types';
import { CHARACTER_FORM_OPTIONS, DEFAULT_GENERATION_OPTIONS, DESIGN_THEME_OPTIONS } from './constants';

export const RANDOM_IDEAS: string[] = [
  'Kucing barista yang selalu ngantuk tapi tetap bikin kopi sempurna',
  'Panda astronot yang menjelajahi luar angkasa sambil makan bambu',
  'Bebek programmer yang debugging code tengah malam',
  'Kelinci chef yang masaknya selalu kelebihan bahan',
  'Hamster gamer yang pakai headset terlalu besar',
  'Anjing detektif berkacamata yang suka dramatisasi',
  'Kucing penyihir kecil dengan jubah bintang dan tongkat ajaib',
  'Capybara meditasi di tengah kekacauan kota kecil',
  'Axolotl streamer yang gaming sambil senyum terus',
  'Stickman pemalu yang membawa bunga raksasa lebih besar dari tubuhnya',
  'Monster marshmallow mungil yang ingin terlihat galak tapi terlalu imut',
  'Roti panggang hidup yang panik karena hampir telat kerja',
  'Dinosaurus mini pecinta tanaman hias dan teh hangat',
  'Hantu kecil yang takut gelap tapi suka dekorasi lucu',
  'Robot bulat yang belajar jadi pelukis watercolor',
  'Jamur kecil berpayung daun yang suka hujan pastel',
  'Beruang teddy retro yang menjalankan toko kaset lo-fi',
  'Kodok jazz yang main saksofon di kolam bulan purnama',
  'Rubah pelukis dengan kuas besar dan noda warna di pipi',
  'Penguin knight penjual es krim di kastil mini',
  'Koala pilot pesawat kertas raksasa',
  'Kambing gunung gothic yang suka bunga daisy',
  'Cumi-cumi chef sushi yang terlalu percaya diri',
  'Burung merpati delivery yang selalu tersesat tapi tetap optimis',
  'Karakter original berbentuk awan kecil yang suka menabung petir',
  'Ulat buku memakai hoodie oversized dan kacamata bulat',
  'Ikan koi skater dengan sepatu roda neon',
  'Kura-kura librarian yang membawa rak buku di punggungnya',
  'Kelelawar kecil penjual jus buah malam hari',
  'Bebek goth yang membawa payung kuning cerah',
];

const SUBJECTS = [
  'kucing montok', 'anak anjing corgi', 'axolotl pink', 'capybara tenang',
  'panda mungil', 'kelinci floppy-ear', 'bebek kuning', 'hamster bulat',
  'koala sleepy', 'rubah kecil', 'penguin pendek', 'kodok hijau',
  'dinosaurus bayi', 'gurita mini', 'kura-kura pemalu', 'kelelawar kecil',
  'monster marshmallow', 'hantu pemalu', 'robot bulat', 'stickman kikuk',
  'awan hidup', 'jamur hutan', 'roti panggang hidup', 'bintang kecil',
];

const SUBJECTS_BY_FORM: Partial<Record<CharacterForm, string[]>> = {
  animal: [
    'kucing montok', 'anak anjing corgi', 'axolotl pink', 'capybara tenang',
    'panda mungil', 'kelinci floppy-ear', 'bebek kuning', 'hamster bulat',
  ],
  human: [
    'manusia original pemalu', 'anak muda skater original', 'barista kecil ekspresif',
    'pelukis original berhoodie', 'kurir original yang mudah panik',
  ],
  cartoon: [
    'karakter cartoon original', 'maskot cartoon lucu', 'cartoon buddy ekspresif',
  ],
  doodle: [
    'karakter doodle mungil', 'doodle buddy bergaris sederhana', 'coretan hidup yang lucu',
  ],
  anime: [
    'karakter anime original', 'chibi anime original', 'anime mascot brand-safe',
  ],
  'living-object': [
    'awan hidup', 'bintang kecil hidup', 'mug kopi hidup', 'jam alarm hidup',
    'tas selempang hidup',
  ],
  stickman: [
    'stickman kikuk', 'stickman pemalu', 'stickman kecil yang ekspresif',
    'stickman deadpan', 'stickman panik yang dramatis',
  ],
  'fantasy-creature': [
    'sprite hutan mungil', 'peri mini original', 'naga bayi brand-safe',
    'creature fantasi pastel',
  ],
  robot: [
    'robot bulat', 'robot retro mungil', 'robot helper yang ekspresif',
  ],
  'living-food': [
    'roti panggang hidup', 'donat hidup', 'boba cup hidup', 'croissant hidup',
  ],
  'living-plant': [
    'jamur hutan hidup', 'kaktus kecil hidup', 'bunga matahari hidup',
    'tanaman pot mungil',
  ],
  'cute-monster': [
    'monster marshmallow', 'monster bulu mungil', 'monster pastel pemalu',
  ],
  'original-mascot': [
    'maskot original mungil', 'brand-safe mascot lucu', 'mascot buddy ekspresif',
  ],
};

const ROLES = [
  'barista', 'astronot', 'detektif', 'chef ramen', 'skater', 'pustakawan',
  'penjual bunga', 'musisi jazz', 'penyihir pemula', 'petualang peta',
  'gamer malam', 'pelukis watercolor', 'tukang kebun', 'kurir yang tersesat',
  'pilot pesawat kertas', 'kolektor stiker', 'DJ lo-fi', 'penjaga toko kaset',
];

const QUIRKS = [
  'selalu ngantuk tapi penuh usaha',
  'terlalu serius untuk hal-hal kecil',
  'panik setiap melihat notifikasi',
  'pura-pura galak padahal sangat lembut',
  'suka membawa snack darurat di tas mini',
  'punya ekspresi deadpan yang absurd',
  'mudah tersipu saat dipuji',
  'senang menolong tapi sering salah arah',
  'terobsesi dengan tanaman mungil',
  'punya aura chaotic good yang menggemaskan',
  'selalu membawa benda raksasa yang tidak praktis',
  'percaya diri walau skill-nya masih berantakan',
];

const VISUAL_HOOKS = [
  'topi kecil miring', 'hoodie oversized', 'kacamata bulat besar', 'syal pastel',
  'tas selempang mungil', 'sepatu roda neon', 'payung transparan', 'mug kopi raksasa',
  'bunga daisy di kepala', 'bintang kecil berkilau', 'patch berbentuk hati', 'sarung tangan lucu',
];

const STYLE_DIRECTIONS = [
  'kawaii chibi dengan outline tebal',
  'kartun flat vector yang bersih',
  'doodle lucu seperti gambar tangan',
  'retro mascot 90-an yang lembut',
  'minimalist stickman yang ekspresif',
  'soft pastel cartoon dengan tekstur halus',
  'bold cute mascot untuk merchandise',
];

const STYLE_DIRECTIONS_BY_FORM: Partial<Record<CharacterForm, string[]>> = {
  stickman: [
    'minimalist stickman yang ekspresif',
    'stickman vector clean dengan gesture kuat',
    'simple stick figure dengan outline tebal',
  ],
  doodle: [
    'doodle lucu seperti gambar tangan',
    'hand-drawn doodle dengan garis spontan',
  ],
  anime: [
    'chibi anime original dengan outline bersih',
    'anime mascot brand-safe yang cute',
  ],
  cartoon: [
    'kartun flat vector yang bersih',
    'cartoon mascot dengan bentuk sederhana',
  ],
};

const STYLE_DIRECTIONS_BY_THEME: Partial<Record<DesignTheme, string[]>> = {
  minimalist: [
    'minimalis clean dengan sedikit elemen',
    'simple vector dengan ruang kosong luas',
    'karakter fokus tanpa detail berlebihan',
  ],
  'simple-cute': [
    'simple cute dengan bentuk rounded',
    'cute vector ringan dan mudah dibaca',
  ],
  'controlled-accessories': [
    'full acc terkontrol dengan 2-4 aksesori pilihan',
    'karakter beraksesori rapi tanpa clutter',
  ],
  'kawaii-pastel': [
    'kawaii pastel dengan warna lembut',
    'soft pastel cartoon dengan tekstur halus',
  ],
  'bold-vector': [
    'bold vector dengan outline tebal',
    'warna kontras dan bentuk print-ready',
  ],
  'retro-90s': [
    'retro mascot 90-an yang lembut',
    'nostalgia sticker 90s yang playful',
  ],
  streetwear: [
    'streetwear mascot dengan hoodie dan pose urban',
    'casual urban vector untuk merchandise',
  ],
  'goth-cute': [
    'goth cute dengan aksen dark ringan',
    'cute spooky dengan kontras lembut',
  ],
  'decorative-pattern': [
    'pattern dekoratif dengan motif berulang',
    'komposisi decorative repeat yang rapi',
  ],
  'premium-mascot': [
    'premium mascot polished untuk merchandise',
    'commercial mascot dengan finishing clean',
  ],
};

const MERCH_ANGLES = [
  'cocok untuk sticker die-cut',
  'cocok untuk phone case pattern vertikal',
  'cocok untuk desain baju dengan quote pendek',
  'cocok untuk koleksi karakter original Redbubble',
  'cocok untuk desain humor relatable tanpa merek terkenal',
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeGenerationOptions(options?: Partial<GenerationOptions>): GenerationOptions {
  return {
    characterForm: options?.characterForm ?? DEFAULT_GENERATION_OPTIONS.characterForm,
    textMode: options?.textMode ?? DEFAULT_GENERATION_OPTIONS.textMode,
    theme: options?.theme ?? DEFAULT_GENERATION_OPTIONS.theme,
    customText: options?.customText ?? DEFAULT_GENERATION_OPTIONS.customText,
  };
}

function getSubjectPool(characterForm: CharacterForm): string[] {
  if (characterForm === 'auto') return SUBJECTS;
  return SUBJECTS_BY_FORM[characterForm] ?? [
    `karakter ${CHARACTER_FORM_OPTIONS[characterForm].label.toLowerCase()} original`,
  ];
}

function getStylePool(characterForm: CharacterForm, theme: DesignTheme = 'auto'): string[] {
  if (theme !== 'auto') {
    return STYLE_DIRECTIONS_BY_THEME[theme] ?? [DESIGN_THEME_OPTIONS[theme].label.toLowerCase()];
  }
  return STYLE_DIRECTIONS_BY_FORM[characterForm] ?? STYLE_DIRECTIONS;
}

function buildCharacterFormHint(characterForm: CharacterForm): string {
  if (characterForm === 'auto') return '';
  const label = CHARACTER_FORM_OPTIONS[characterForm].label.toLowerCase();
  return `bentuk karakter wajib ${label}`;
}

function buildTextHint(options: GenerationOptions): string {
  if (options.textMode === 'auto') {
    return 'sertakan tulisan otomatis pendek 1-5 kata yang sesuai ekspresi';
  }

  if (options.textMode === 'custom') {
    const customText = options.customText?.trim();
    return customText ? `sertakan tulisan persis "${customText}"` : '';
  }

  return 'tanpa tulisan, tanpa lettering, tanpa caption, tanpa speech bubble';
}

function buildThemeHint(theme: DesignTheme): string {
  if (theme === 'auto') return '';
  if (theme === 'minimalist') {
    return 'tema minimalis, sedikit elemen, fokus karakter';
  }
  if (theme === 'controlled-accessories') {
    return 'tema full acc terkontrol, gunakan 2-4 aksesori saja';
  }
  return `tema ${DESIGN_THEME_OPTIONS[theme].label.toLowerCase()}`;
}

function composeIdea(options?: GenerationOptions): string {
  const subject = pick(options ? getSubjectPool(options.characterForm) : SUBJECTS);
  const role = pick(ROLES);
  const quirk = pick(QUIRKS);
  const hook = pick(VISUAL_HOOKS);
  const style = pick(options ? getStylePool(options.characterForm, options.theme) : STYLE_DIRECTIONS);
  const angle = pick(MERCH_ANGLES);
  const optionHints = options
    ? [buildCharacterFormHint(options.characterForm), buildTextHint(options), buildThemeHint(options.theme)].filter(Boolean)
    : [];

  return `${subject} ${role} yang ${quirk}, memakai ${hook}; gaya ${style}; ${angle}${optionHints.length ? `; ${optionHints.join('; ')}` : ''}`;
}

export function getRandomIdea(currentIdea?: string, options?: Partial<GenerationOptions>): string {
  const normalizedOptions = options ? normalizeGenerationOptions(options) : undefined;

  for (let i = 0; i < 30; i++) {
    const idea = normalizedOptions
      ? composeIdea(normalizedOptions)
      : Math.random() < 0.25
        ? pick(RANDOM_IDEAS)
        : composeIdea();
    if (idea !== currentIdea) return idea;
  }
  return composeIdea(normalizedOptions);
}
