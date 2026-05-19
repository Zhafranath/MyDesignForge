// ═══════════════════════════════════════════════════
// StickerForge — Domain Types
// ═══════════════════════════════════════════════════

export type Platform =
  | 'midjourney'
  | 'dalle'
  | 'stable-diffusion'
  | 'kling'
  | 'runway';

export type ProductType =
  | 'sticker'
  | 'phone-case'
  | 't-shirt';

export type CharacterForm =
  | 'auto'
  | 'animal'
  | 'human'
  | 'cartoon'
  | 'doodle'
  | 'anime'
  | 'living-object'
  | 'stickman'
  | 'fantasy-creature'
  | 'robot'
  | 'living-food'
  | 'living-plant'
  | 'cute-monster'
  | 'original-mascot';

export type TextMode = 'none' | 'auto' | 'custom';

export interface ReferenceImagePayload {
  dataUrl: string;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  name?: string;
}

export interface ReferenceImageContext {
  description: string;
}

export type DesignTheme =
  | 'auto'
  | 'minimalist'
  | 'simple-cute'
  | 'controlled-accessories'
  | 'kawaii-pastel'
  | 'bold-vector'
  | 'retro-90s'
  | 'streetwear'
  | 'goth-cute'
  | 'decorative-pattern'
  | 'premium-mascot';

export interface GenerationOptions {
  characterForm: CharacterForm;
  textMode: TextMode;
  theme: DesignTheme;
  customText?: string;
  referenceImageContext?: ReferenceImageContext;
}

export type Expression =
  | 'happy'
  | 'cry'
  | 'sleepy'
  | 'hype'
  | 'blush'
  | 'angry'
  | 'poker'
  | 'love'
  | 'panic';

export interface CharacterConcept {
  name: string;
  tagline: string;
  characterType?: string;
  description: string;
  colors: string[];
  style: string;
  productFit?: string;
  tags?: string[];
}

export interface StickerPrompt {
  expression: Expression;
  title?: string;
  emoji: string;
  prompt: string;
  tips: string;
}

export interface StickerPack {
  id: string;
  createdAt: string;
  platform: Platform;
  targetProduct: ProductType;
  inputDescription: string;
  concept: CharacterConcept;
  stickers: StickerPrompt[];
}

export interface ConceptStreamEvent {
  type: 'concept';
  name: string;
  tagline: string;
  characterType?: string;
  description: string;
  colors: string[];
  style: string;
  productFit?: string;
  tags?: string[];
}

export interface DesignStreamEvent {
  type: 'design' | 'sticker';
  expression: Expression;
  title?: string;
  emoji: string;
  prompt: string;
  tips: string;
}

export interface ErrorStreamEvent {
  type: 'error';
  message: string;
}

export type StreamEvent =
  | ConceptStreamEvent
  | DesignStreamEvent
  | ErrorStreamEvent;

export type GenerateStatus =
  | 'idle'
  | 'generating'
  | 'done'
  | 'error';

export interface GenerateState {
  status: GenerateStatus;
  concept: CharacterConcept | null;
  stickers: StickerPrompt[];
  error: string | null;
}
