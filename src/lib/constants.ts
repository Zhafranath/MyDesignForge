import type { CharacterForm, DesignTheme, Expression, GenerationOptions, Platform, ProductType, TextMode } from '@/types';

export const EXPRESSIONS: Record<Expression, { label: string; emoji: string; description: string }> = {
  happy:  { label: 'Joy',       emoji: '😊', description: 'Ceria, friendly, mudah disukai' },
  cry:    { label: 'Drama',     emoji: '😭', description: 'Lucu lebay, relatable' },
  sleepy: { label: 'Cozy',      emoji: '😴', description: 'Santai, soft, comforting' },
  hype:   { label: 'Energy',    emoji: '🔥', description: 'Dinamis, penuh gerakan' },
  blush:  { label: 'Cute',      emoji: '🥺', description: 'Menggemaskan dan manis' },
  angry:  { label: 'Spicy',     emoji: '😤', description: 'Ekspresif, sassy, berani' },
  poker:  { label: 'Deadpan',   emoji: '😑', description: 'Absurd, dry humor, minimalis' },
  love:   { label: 'Love',      emoji: '🥰', description: 'Heartwarming, positif' },
  panic:  { label: 'Chaos',     emoji: '😱', description: 'Komedi panik, eye-catching' },
} as const;

export const EXPRESSION_ORDER: Expression[] = [
  'happy', 'cry', 'sleepy', 'hype', 'blush', 'angry', 'poker', 'love', 'panic',
];

export const PRODUCTS: Record<ProductType, { label: string; emoji: string; description: string; shortName: string }> = {
  sticker: {
    label: 'Sticker',
    emoji: '🏷️',
    description: 'Desain die-cut/transparent PNG dengan outline tebal dan bentuk jelas.',
    shortName: 'Sticker',
  },
  'phone-case': {
    label: 'Phone Case',
    emoji: '📱',
    description: 'Komposisi vertikal, full-bleed atau pattern, aman dari area kamera.',
    shortName: 'Case',
  },
  't-shirt': {
    label: 'Desain Baju',
    emoji: '👕',
    description: 'Artwork tengah dada, background transparan, readable di kain terang/gelap.',
    shortName: 'Baju',
  },
} as const;

export const PRODUCT_ORDER: ProductType[] = ['sticker', 'phone-case', 't-shirt'];

export const CHARACTER_FORM_OPTIONS: Record<CharacterForm, { label: string; description: string }> = {
  auto: {
    label: 'AI pilih',
    description: 'Biarkan AI memilih bentuk paling cocok dari ide kamu.',
  },
  animal: {
    label: 'Hewan',
    description: 'Karakter hewan lucu, maskot binatang, atau creature berbasis fauna.',
  },
  human: {
    label: 'Manusia',
    description: 'Karakter manusia original dengan pose dan ekspresi kuat.',
  },
  cartoon: {
    label: 'Cartoon',
    description: 'Bentuk kartun ekspresif dengan garis bersih dan mudah dibaca.',
  },
  doodle: {
    label: 'Doodle',
    description: 'Gaya gambar tangan sederhana, spontan, dan playful.',
  },
  anime: {
    label: 'Anime',
    description: 'Karakter anime original tanpa meniru IP atau karakter terkenal.',
  },
  'living-object': {
    label: 'Benda hidup',
    description: 'Objek sehari-hari yang dibuat hidup sebagai karakter.',
  },
  stickman: {
    label: 'Stickman',
    description: 'Figur sederhana yang kuat di gesture dan ekspresi.',
  },
  'fantasy-creature': {
    label: 'Makhluk fantasi',
    description: 'Creature khayalan original seperti sprite, peri mini, atau monster mungil.',
  },
  robot: {
    label: 'Robot',
    description: 'Robot original yang lucu, futuristik, atau retro.',
  },
  'living-food': {
    label: 'Makanan hidup',
    description: 'Makanan atau minuman yang dijadikan karakter ekspresif.',
  },
  'living-plant': {
    label: 'Tanaman hidup',
    description: 'Tanaman, bunga, jamur, atau daun sebagai karakter original.',
  },
  'cute-monster': {
    label: 'Monster lucu',
    description: 'Monster imut, tidak menyeramkan, dan cocok untuk merchandise.',
  },
  'original-mascot': {
    label: 'Maskot original',
    description: 'Maskot brand-safe dengan bentuk unik dan mudah diingat.',
  },
} as const;

export const CHARACTER_FORM_ORDER: CharacterForm[] = [
  'auto',
  'animal',
  'human',
  'cartoon',
  'doodle',
  'anime',
  'living-object',
  'stickman',
  'fantasy-creature',
  'robot',
  'living-food',
  'living-plant',
  'cute-monster',
  'original-mascot',
];

export const TEXT_MODE_OPTIONS: Record<TextMode, { label: string; description: string }> = {
  none: {
    label: 'Tanpa tulisan',
    description: 'Prompt melarang teks, lettering, caption, dan speech bubble.',
  },
  auto: {
    label: 'Tulisan otomatis',
    description: 'AI menambahkan kata pendek yang sesuai ekspresi, seperti hello, boo, sorry.',
  },
  custom: {
    label: 'Tulisan custom',
    description: 'Gunakan teks pilihan kamu di semua variasi prompt.',
  },
} as const;

export const TEXT_MODE_ORDER: TextMode[] = ['none', 'auto', 'custom'];

export const DESIGN_THEME_OPTIONS: Record<DesignTheme, { label: string; description: string }> = {
  auto: {
    label: 'AI pilih',
    description: 'Biarkan AI memilih tema visual paling cocok untuk ide dan produk.',
  },
  minimalist: {
    label: 'Minimalis',
    description: 'Clean, sedikit elemen, fokus karakter, dan minim detail kecil.',
  },
  'simple-cute': {
    label: 'Simple cute',
    description: 'Lucu, ringan, mudah dibaca, dengan detail sederhana.',
  },
  'controlled-accessories': {
    label: 'Full acc terkontrol',
    description: 'Gunakan beberapa aksesori relevan saja, sekitar 2-4 item, tetap rapi.',
  },
  'kawaii-pastel': {
    label: 'Kawaii pastel',
    description: 'Warna pastel lembut, cute, rounded, dan friendly.',
  },
  'bold-vector': {
    label: 'Bold vector',
    description: 'Garis tebal, bentuk kuat, warna kontras, cocok untuk print.',
  },
  'retro-90s': {
    label: 'Retro 90s',
    description: 'Nuansa 90-an, playful, sticker nostalgia, tapi tetap original.',
  },
  streetwear: {
    label: 'Streetwear',
    description: 'Casual urban, hoodie, sneakers, pose keren, dan graphic detail.',
  },
  'goth-cute': {
    label: 'Goth cute',
    description: 'Cute dengan aksen dark, spooky ringan, dan kontras lembut.',
  },
  'decorative-pattern': {
    label: 'Pattern dekoratif',
    description: 'Motif berulang, elemen dekoratif, cocok untuk case dan apparel.',
  },
  'premium-mascot': {
    label: 'Premium mascot',
    description: 'Maskot polished, komersial, kuat untuk branding dan merchandise.',
  },
} as const;

export const DESIGN_THEME_ORDER: DesignTheme[] = [
  'auto',
  'minimalist',
  'simple-cute',
  'controlled-accessories',
  'kawaii-pastel',
  'bold-vector',
  'retro-90s',
  'streetwear',
  'goth-cute',
  'decorative-pattern',
  'premium-mascot',
];

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  characterForm: 'auto',
  textMode: 'none',
  theme: 'auto',
  customText: '',
};

export const MAX_CUSTOM_TEXT_LENGTH = 30;

export const PLATFORMS: Record<Platform, { label: string; emoji: string; color: string }> = {
  midjourney:       { label: 'Midjourney',       emoji: '🌌', color: '#6E4FE0' },
  dalle:            { label: 'DALL·E',           emoji: '🎨', color: '#10A37F' },
  'stable-diffusion': { label: 'Stable Diffusion', emoji: '🖼️', color: '#E67E22' },
  kling:            { label: 'Kling',            emoji: '🎬', color: '#E74C3C' },
  runway:           { label: 'Runway',           emoji: '🚀', color: '#1A1A2E' },
} as const;

export const PLATFORM_ORDER: Platform[] = [
  'midjourney', 'dalle', 'stable-diffusion', 'kling', 'runway',
];

export const MAX_HISTORY = 20;
export const STORAGE_KEY = 'stickerforge_history';
export const MAX_DESC_LENGTH = 700;
export const MIN_DESC_LENGTH = 5;
