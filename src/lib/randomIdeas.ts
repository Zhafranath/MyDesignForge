// Idea engine: combines subjects, personalities, jobs, and merch angles so the
// Shuffle button does not feel like a static template list.

import type { CharacterForm, DesignTheme, GenerationOptions } from '@/types';
import { CHARACTER_FORM_OPTIONS, DEFAULT_GENERATION_OPTIONS, DESIGN_THEME_OPTIONS } from './constants';

function buildCombinations(starts: string[], endings: string[], limit: number): string[] {
  const results: string[] = [];
  for (const start of starts) {
    for (const ending of endings) {
      results.push(`${start} ${ending}`);
      if (results.length >= limit) return results;
    }
  }
  return results;
}

function mergePools<K extends string>(
  base: Partial<Record<K, string[]>>,
  extra: Partial<Record<K, string[]>>
): Partial<Record<K, string[]>> {
  const merged: Partial<Record<K, string[]>> = { ...base };
  for (const [key, values] of Object.entries(extra) as Array<[K, string[]]>) {
    merged[key] = [...(merged[key] ?? []), ...values];
  }
  return merged;
}

function countPoolValues<K extends string>(record: Partial<Record<K, string[]>>): number {
  return (Object.values(record) as string[][]).reduce((sum, values) => sum + values.length, 0);
}

const BASE_RANDOM_IDEAS: string[] = [
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

const EXTRA_RANDOM_IDEAS = buildCombinations(
  [
    'Kaktus kecil penjaga toko teh',
    'Donat hidup pekerja kantoran',
    'Robot mini penjual bunga',
    'Stickman dramatic yang suka overthinking',
    'Bintang kecil kurir malam',
    'Mug kopi hidup yang gampang gugup',
    'Naga bayi kolektor perangko',
    'Jam alarm pemalas yang ingin libur',
    'Maskot awan pembawa kabar baik',
    'Croissant hidup pemilik toko buku',
  ],
  [
    'dengan ekspresi super bangga dan pose sticker die-cut',
    'yang panik membawa properti raksasa terlalu besar',
    'dengan gaya kawaii pastel dan outline tebal',
    'yang mencoba terlihat profesional tapi tetap lucu',
    'dalam adegan mini komedi tanpa merek terkenal',
    'dengan quote pendek original yang mudah dibaca',
    'sebagai maskot merchandise lucu untuk koleksi sticker',
    'dengan pose ekspresif dan bentuk sederhana print-ready',
    'yang membawa satu prop kecil sesuai karakternya',
    'dengan cerita visual relatable untuk desain Redbubble',
  ],
  100
);

export const RANDOM_IDEAS: string[] = [...BASE_RANDOM_IDEAS, ...EXTRA_RANDOM_IDEAS];

const BASE_SUBJECTS = [
  'kucing montok', 'anak anjing corgi', 'axolotl pink', 'capybara tenang',
  'panda mungil', 'kelinci floppy-ear', 'bebek kuning', 'hamster bulat',
  'koala sleepy', 'rubah kecil', 'penguin pendek', 'kodok hijau',
  'dinosaurus bayi', 'gurita mini', 'kura-kura pemalu', 'kelelawar kecil',
  'monster marshmallow', 'hantu pemalu', 'robot bulat', 'stickman kikuk',
  'awan hidup', 'jamur hutan', 'roti panggang hidup', 'bintang kecil',
];

const EXTRA_SUBJECTS = buildCombinations(
  [
    'mug kopi hidup', 'donat sleepy', 'kaktus introvert', 'robot kasir mini',
    'maskot awan pastel', 'bintang jatuh pemalu', 'jam alarm panik', 'tas ransel hidup',
    'naga bayi ramah', 'stickman overthinking',
  ],
  [
    'dengan bentuk bulat lucu', 'bergaya sticker die-cut', 'berpose sangat ekspresif',
    'dengan siluet sederhana', 'untuk karakter merchandise', 'dengan wajah deadpan',
    'memakai detail minimal', 'bernuansa kawaii bersih', 'dengan outline tebal',
    'sebagai mascot original',
  ],
  100
);

const SUBJECTS = [...BASE_SUBJECTS, ...EXTRA_SUBJECTS];

const BASE_SUBJECTS_BY_FORM: Partial<Record<CharacterForm, string[]>> = {
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

const EXTRA_SUBJECTS_BY_FORM: Partial<Record<CharacterForm, string[]>> = {
  animal: buildCombinations(
    ['kucing susu', 'corgi mini', 'panda mochi', 'bebek sweater'],
    ['pemalu', 'ceria'],
    8
  ),
  human: buildCombinations(
    ['penjaga toko original', 'murid seni original', 'barista mungil', 'kurir kecil'],
    ['ekspresif', 'mudah panik'],
    8
  ),
  cartoon: buildCombinations(
    ['cartoon mascot jelly', 'cartoon buddy bulat', 'karakter cartoon pastel', 'maskot cartoon komedi'],
    ['brand-safe', 'print-ready'],
    7
  ),
  doodle: buildCombinations(
    ['doodle garis satu', 'doodle blob lucu', 'coretan hidup kecil', 'doodle mascot santai'],
    ['ekspresif', 'minimalis'],
    7
  ),
  anime: buildCombinations(
    ['chibi anime baker', 'anime mascot sleepy', 'chibi original painter', 'anime buddy pastel'],
    ['brand-safe', 'cute'],
    7
  ),
  'living-object': buildCombinations(
    ['mug kopi hidup', 'jam alarm hidup', 'tas ransel hidup', 'lampu meja hidup'],
    ['gugup', 'ceria'],
    8
  ),
  stickman: buildCombinations(
    ['stickman dramatis', 'stickman overthinking', 'stickman kasir', 'stickman sleepy'],
    ['dengan pose kuat', 'bergaya minimalist'],
    8
  ),
  'fantasy-creature': buildCombinations(
    ['naga bayi pastel', 'sprite jamur', 'peri teh', 'creature bulan'],
    ['mungil', 'brand-safe'],
    8
  ),
  robot: buildCombinations(
    ['robot kasir mini', 'robot gardener', 'robot sleepy', 'robot painter'],
    ['bulat', 'retro'],
    7
  ),
  'living-food': buildCombinations(
    ['donat hidup', 'croissant hidup', 'boba cup hidup', 'pancake hidup'],
    ['ceria', 'panik'],
    8
  ),
  'living-plant': buildCombinations(
    ['kaktus hidup', 'bunga pot hidup', 'bonsai kecil hidup', 'daun maple hidup'],
    ['pemalu', 'ceria'],
    8
  ),
  'cute-monster': buildCombinations(
    ['monster jelly', 'monster bulu pastel', 'monster marshmallow', 'monster kecil sleepy'],
    ['imut', 'pura-pura galak'],
    8
  ),
  'original-mascot': buildCombinations(
    ['maskot awan', 'maskot toko teh', 'brand-safe buddy', 'mascot charm kecil'],
    ['ekspresif', 'print-ready'],
    8
  ),
};

const SUBJECTS_BY_FORM = mergePools(BASE_SUBJECTS_BY_FORM, EXTRA_SUBJECTS_BY_FORM);

const BASE_ROLES = [
  'barista', 'astronot', 'detektif', 'chef ramen', 'skater', 'pustakawan',
  'penjual bunga', 'musisi jazz', 'penyihir pemula', 'petualang peta',
  'gamer malam', 'pelukis watercolor', 'tukang kebun', 'kurir yang tersesat',
  'pilot pesawat kertas', 'kolektor stiker', 'DJ lo-fi', 'penjaga toko kaset',
];

const EXTRA_ROLES = buildCombinations(
  [
    'penjaga toko teh', 'kurator museum mini', 'pembuat roti pagi', 'pemandu wisata bulan',
    'operator mesin stiker', 'penata tanaman meja', 'penjual balon pastel', 'arsiparis mimpi',
    'pemburu diskon lucu', 'perancang kostum mungil',
  ],
  [
    'pemula', 'malam hari', 'yang mudah panik', 'dengan misi rahasia', 'di kota kecil',
    'untuk festival mini', 'yang terlalu serius', 'dengan gaya retro', 'di toko mungil',
    'untuk koleksi merchandise',
  ],
  100
);

const ROLES = [...BASE_ROLES, ...EXTRA_ROLES];

const BASE_QUIRKS = [
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

const EXTRA_QUIRKS = buildCombinations(
  [
    'selalu membawa catatan kecil',
    'mudah panik saat dipuji',
    'terlalu bangga dengan hal sederhana',
    'suka menyusun rencana yang berantakan',
    'punya ekspresi serius yang lucu',
    'selalu mencoba terlihat keren',
    'gampang terdistraksi benda berkilau',
    'suka membantu dengan cara absurd',
    'percaya semua masalah butuh snack',
    'mudah terharu oleh pujian kecil',
  ],
  [
    'tapi tetap menggemaskan',
    'dan cocok jadi sticker ekspresif',
    'dengan energi chaotic good',
    'tanpa terlihat seperti karakter terkenal',
    'dalam adegan merchandise lucu',
    'dengan gestur tubuh dramatis',
    'yang mudah dibaca dari jauh',
    'dengan komedi visual sederhana',
    'untuk prompt karakter original',
    'dengan vibe giftable dan relatable',
  ],
  100
);

const QUIRKS = [...BASE_QUIRKS, ...EXTRA_QUIRKS];

const VISUAL_HOOKS = [
  'topi kecil miring', 'hoodie oversized', 'kacamata bulat besar', 'syal pastel',
  'tas selempang mungil', 'sepatu roda neon', 'payung transparan', 'mug kopi raksasa',
  'bunga daisy di kepala', 'bintang kecil berkilau', 'patch berbentuk hati', 'sarung tangan lucu',
];

const BASE_STYLE_DIRECTIONS = [
  'kawaii chibi dengan outline tebal',
  'kartun flat vector yang bersih',
  'doodle lucu seperti gambar tangan',
  'retro mascot 90-an yang lembut',
  'minimalist stickman yang ekspresif',
  'soft pastel cartoon dengan tekstur halus',
  'bold cute mascot untuk merchandise',
];

const EXTRA_STYLE_DIRECTIONS = buildCombinations(
  [
    'clean vector sticker', 'soft kawaii mascot', 'chunky outline cartoon',
    'minimalist merchandise icon', 'pastel flat illustration', 'bold die-cut style',
    'cute commercial mascot', 'simple print-ready graphic', 'rounded chibi sticker',
    'polished character badge',
  ],
  [
    'dengan detail rendah', 'dengan siluet jelas', 'dengan warna terbatas',
    'untuk Redbubble', 'tanpa clutter visual', 'dengan prop minimal',
    'yang mudah dibaca', 'dengan outline tebal', 'dengan pose ekspresif',
    'untuk koleksi sticker',
  ],
  100
);

const STYLE_DIRECTIONS = [...BASE_STYLE_DIRECTIONS, ...EXTRA_STYLE_DIRECTIONS];

const BASE_STYLE_DIRECTIONS_BY_FORM: Partial<Record<CharacterForm, string[]>> = {
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

const EXTRA_STYLE_DIRECTIONS_BY_FORM: Partial<Record<CharacterForm, string[]>> = {
  stickman: buildCombinations(
    ['stickman clean', 'stick figure comic', 'minimal line character', 'gesture-first stickman', 'deadpan stickman'],
    ['dengan pose kuat', 'untuk sticker', 'gesture dramatis', 'tanpa detail rumit', 'mudah dibaca'],
    25
  ),
  doodle: buildCombinations(
    ['hand-drawn doodle', 'loose sketch mascot', 'wobbly line cartoon', 'simple ink doodle', 'cute scribble style'],
    ['dengan energi playful', 'print-ready', 'garis spontan', 'outline bersih', 'komposisi ringan'],
    25
  ),
  anime: buildCombinations(
    ['chibi anime clean', 'soft anime mascot', 'rounded anime sticker', 'anime-inspired buddy', 'kawaii chibi icon'],
    ['brand-safe', 'dengan outline bersih', 'warna lembut', 'pose ekspresif', 'tanpa fan art'],
    25
  ),
  cartoon: buildCombinations(
    ['flat cartoon mascot', 'chunky cartoon sticker', 'rounded cartoon buddy', 'simple cartoon icon', 'expressive cartoon figure'],
    ['dengan warna solid', 'untuk merchandise', 'shape sederhana', 'siluet jelas', 'print-ready'],
    25
  ),
};

const STYLE_DIRECTIONS_BY_FORM = mergePools(
  BASE_STYLE_DIRECTIONS_BY_FORM,
  EXTRA_STYLE_DIRECTIONS_BY_FORM
);

const BASE_STYLE_DIRECTIONS_BY_THEME: Partial<Record<DesignTheme, string[]>> = {
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

const EXTRA_STYLE_DIRECTIONS_BY_THEME: Partial<Record<DesignTheme, string[]>> = {
  minimalist: buildCombinations(['minimal clean mascot', 'simple shape sticker'], ['tanpa clutter', 'dengan ruang kosong luas', 'fokus siluet', 'warna terbatas', 'print-ready'], 10),
  'simple-cute': buildCombinations(['simple cute vector', 'rounded kawaii buddy'], ['soft outline', 'prop minimal', 'warna lembut', 'ekspresi jelas', 'sticker-ready'], 10),
  'controlled-accessories': buildCombinations(['costume sticker set', 'accessory-controlled mascot'], ['2-4 aksesori', 'tema rapi', 'tanpa prop ekstra', 'role jelas', 'koleksi mini'], 10),
  'kawaii-pastel': buildCombinations(['pastel kawaii sticker', 'soft candy mascot'], ['warna lembut', 'rounded shape', 'sparkle minimal', 'clean edge', 'cute mood'], 10),
  'bold-vector': buildCombinations(['bold vector mascot', 'thick outline sticker'], ['kontras tinggi', 'flat fill', 'siluet kuat', 'print-ready', 'detail rendah'], 10),
  'retro-90s': buildCombinations(['retro 90s mascot', 'nostalgic sticker graphic'], ['chunky outline', 'palette nostalgia', 'shape playful', 'vibe kaset', 'print-ready'], 10),
  streetwear: buildCombinations(['urban mascot sticker', 'streetwear vector buddy'], ['hoodie clean', 'pose cool', 'tanpa clutter', 'warna solid', 'merch-ready'], 10),
  'goth-cute': buildCombinations(['goth cute mascot', 'soft spooky sticker'], ['aksen dark ringan', 'tetap imut', 'kontras lembut', 'shape rounded', 'brand-safe'], 10),
  'decorative-pattern': buildCombinations(['repeat motif sticker', 'decorative icon pattern'], ['rapi', 'seamless feel', 'motif kecil', 'warna konsisten', 'print-ready'], 10),
  'premium-mascot': buildCombinations(['premium mascot polish', 'commercial character sticker'], ['finishing rapi', 'subtle shading', 'brand-safe', 'detail terkontrol', 'merch-ready'], 10),
};

const STYLE_DIRECTIONS_BY_THEME = mergePools(
  BASE_STYLE_DIRECTIONS_BY_THEME,
  EXTRA_STYLE_DIRECTIONS_BY_THEME
);

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

export function getRandomIdeaPoolStats() {
  return {
    randomIdeas: RANDOM_IDEAS.length,
    subjects: SUBJECTS.length,
    subjectsByForm: countPoolValues(SUBJECTS_BY_FORM),
    roles: ROLES.length,
    quirks: QUIRKS.length,
    styleDirections: STYLE_DIRECTIONS.length,
    styleDirectionsByForm: countPoolValues(STYLE_DIRECTIONS_BY_FORM),
    styleDirectionsByTheme: countPoolValues(STYLE_DIRECTIONS_BY_THEME),
  };
}
