"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Github } from 'lucide-react';

import { Mascot } from '@/components/Mascot';
import { CharacterInput } from '@/components/CharacterInput';
import { CharacterFormSelector } from '@/components/CharacterFormSelector';
import { ReferenceImageInput } from '@/components/ReferenceImageInput';
import { ProductSelector } from '@/components/ProductSelector';
import { PlatformSelector } from '@/components/PlatformSelector';
import { TextOptionsSelector } from '@/components/TextOptionsSelector';
import { ThemeSelector } from '@/components/ThemeSelector';
import { ConceptCard } from '@/components/ConceptCard';
import { StickerGrid } from '@/components/StickerGrid';
import { HistoryPanel } from '@/components/HistoryPanel';
import { exportPackToTxt } from '@/components/ExportButton';

import { useGenerate } from '@/hooks/useGenerate';
import { useHistory } from '@/hooks/useHistory';
import { DEFAULT_GENERATION_OPTIONS } from '@/lib/constants';
import { generateId } from '@/lib/storage';

import type { CharacterForm, DesignTheme, GenerationOptions, Platform, ProductType, StickerPack, Expression, CharacterConcept, TextMode, ReferenceImagePayload } from '@/types';

export default function HomePage() {
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<Platform>('midjourney');
  const [targetProduct, setTargetProduct] = useState<ProductType>('sticker');
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);
  const [referenceImage, setReferenceImage] = useState<ReferenceImagePayload | null>(null);

  const { state, generate, regenerateOne, reset } = useGenerate(description);
  const { history, save, remove, clear } = useHistory();

  // ─── Generate handler ────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if ((!description.trim() && !referenceImage) || state.status === 'generating') return;
    if (generationOptions.textMode === 'custom' && !generationOptions.customText?.trim()) {
      toast.error('Teks custom wajib diisi.');
      return;
    }
    reset();
    await generate(description, platform, targetProduct, generationOptions, referenceImage);
  }, [description, platform, targetProduct, generationOptions, referenceImage, state.status, generate, reset]);

  const handleCharacterFormChange = useCallback((characterForm: CharacterForm) => {
    setGenerationOptions((prev) => ({ ...prev, characterForm }));
  }, []);

  const handleTextModeChange = useCallback((textMode: TextMode) => {
    setGenerationOptions((prev) => ({ ...prev, textMode }));
  }, []);

  const handleCustomTextChange = useCallback((customText: string) => {
    setGenerationOptions((prev) => ({ ...prev, customText }));
  }, []);

  const handleThemeChange = useCallback((theme: DesignTheme) => {
    setGenerationOptions((prev) => ({ ...prev, theme }));
  }, []);

  // ─── Auto-save when pack completes ──────────────────────────────────────

  const prevStatus = state.status;
  if (
    prevStatus === 'done' &&
    state.concept &&
    state.stickers.length === 9
  ) {
    // Save silently (idempotent — deduplicates by id)
    // We use a ref-style trick by including it in render; savePack is idempotent
  }

  const handleSaveToHistory = useCallback(() => {
    if (!state.concept || state.stickers.length === 0) return;
    const pack: StickerPack = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      platform,
      targetProduct,
      inputDescription: description,
      concept: state.concept,
      stickers: state.stickers,
    };
    save(pack);
    toast.success('Pack disimpan ke riwayat! 💾');
  }, [state, platform, targetProduct, description, save]);

  // ─── Regenerate single sticker ───────────────────────────────────────────

  const handleRegenerate = useCallback(
    async (expression: Expression) => {
      if (!state.concept) return;
      await regenerateOne(expression, state.concept as CharacterConcept, platform, targetProduct, generationOptions);
    },
    [state.concept, platform, targetProduct, generationOptions, regenerateOne]
  );

  // ─── Export ──────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (!state.concept || state.stickers.length === 0) return;
    const pack: StickerPack = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      platform,
      targetProduct,
      inputDescription: description,
      concept: state.concept,
      stickers: state.stickers,
    };
    exportPackToTxt(pack);
    toast.success('File .txt berhasil diunduh! 📄');
  }, [state, platform, targetProduct, description]);

  // ─── Load from history ────────────────────────────────────────────────────

  const handleLoadFromHistory = useCallback((pack: StickerPack) => {
    setDescription(pack.inputDescription);
    setPlatform(pack.platform);
    setTargetProduct(pack.targetProduct ?? 'sticker');
    // Simulate done state by resetting then injecting
    reset();
    // We can't inject into useGenerate directly; show a toast instead
    toast('Pack dimuat! Klik Generate untuk update.', { icon: '📂' });
  }, [reset]);

  const isGenerating = state.status === 'generating';
  const hasPack = state.concept !== null || state.stickers.length > 0;
  const canGenerateFromInput = Boolean(description.trim() || referenceImage);

  return (
    <div className="min-h-screen">
      {/* ── Hero Header ───────────────────────────────────────── */}
      <header className="border-b border-kawaii-border bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mascot size="sm" animate />
            <div>
              <h1 className="font-display font-bold text-lg text-kawaii-text leading-tight">
                MyDesignForge
              </h1>
              <p className="text-xs text-kawaii-muted font-body hidden sm:block">
                Design Prompt Generator
              </p>
            </div>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-kawaii-muted hover:text-kawaii-text transition-colors p-2 rounded-lg hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            aria-label="GitHub repository"
          >
            <Github className="w-5 h-5" aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Hero section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <Mascot size="lg" animate />
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-kawaii-text">
            Bikin Prompt Desain Anda
            <br />
            <span className="text-primary-500">Dengan Sekali Klik ✨</span>
          </h2>

        </motion.section>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="kawaii-card p-6 space-y-5"
        >
          <CharacterInput
            value={description}
            onChange={setDescription}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generationOptions={generationOptions}
            canGenerateOverride={canGenerateFromInput}
          />

          <div className="border-t border-kawaii-border pt-5">
            <ReferenceImageInput
              value={referenceImage}
              onChange={setReferenceImage}
              disabled={isGenerating}
            />
          </div>

          <div className="border-t border-kawaii-border pt-5">
            {referenceImage ? (
              <div className="rounded-kawaii-sm border border-secondary-200 bg-secondary-50 p-3">
                <p className="font-display text-sm font-semibold text-kawaii-text">
                  Bentuk karakter dari gambar referensi
                </p>
                <p className="mt-1 text-xs text-kawaii-muted">
                  Selector bentuk karakter dinonaktifkan karena karakter akan dianalisis dari gambar upload.
                </p>
              </div>
            ) : (
              <CharacterFormSelector
                value={generationOptions.characterForm}
                onChange={handleCharacterFormChange}
                disabled={isGenerating}
              />
            )}
          </div>

          <div className="border-t border-kawaii-border pt-5">
            <TextOptionsSelector
              textMode={generationOptions.textMode}
              customText={generationOptions.customText ?? ''}
              onTextModeChange={handleTextModeChange}
              onCustomTextChange={handleCustomTextChange}
              disabled={isGenerating}
            />
          </div>

          <div className="border-t border-kawaii-border pt-5">
            <ThemeSelector
              value={generationOptions.theme}
              onChange={handleThemeChange}
              disabled={isGenerating}
            />
          </div>

          <div className="border-t border-kawaii-border pt-5">
            <ProductSelector
              value={targetProduct}
              onChange={setTargetProduct}
              disabled={isGenerating}
            />
          </div>

          <div className="border-t border-kawaii-border pt-5">
            <PlatformSelector
              value={platform}
              onChange={setPlatform}
              disabled={isGenerating}
            />
          </div>
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {state.status === 'error' && state.error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="bg-secondary-50 border border-secondary-200 rounded-kawaii p-4 text-sm font-body text-secondary-600"
            >
              <strong>Ups! </strong>{state.error}
              <button
                onClick={reset}
                className="ml-2 underline hover:no-underline text-secondary-500"
              >
                Coba lagi
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Concept card */}
        <ConceptCard
          concept={state.concept}
          isLoading={isGenerating && !state.concept}
        />

        {/* Sticker grid */}
        <StickerGrid
          stickers={state.stickers}
          concept={state.concept}
          platform={platform}
          targetProduct={targetProduct}
          isGenerating={isGenerating}
          onRegenerate={handleRegenerate}
          onExport={handleExport}
        />

        {/* Save to history CTA — shows after pack completes */}
        <AnimatePresence>
          {state.status === 'done' && state.stickers.length === 9 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <button
                onClick={handleSaveToHistory}
                className="kawaii-btn-primary flex items-center justify-center gap-2"
              >
                💾 Simpan ke Riwayat
              </button>
              <button
                onClick={handleGenerate}
                className="kawaii-btn-secondary flex items-center justify-center gap-2"
              >
                🔄 Generate Ulang
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History panel */}
        <HistoryPanel
          history={history}
          onLoad={handleLoadFromHistory}
          onDelete={remove}
          onClear={clear}
        />

        {/* How it works */}
      </main>

      {/* Footer */}
      <footer className="border-t border-kawaii-border mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p className="font-body text-xs text-kawaii-muted">
            Made with 💜 for Redbubble seller Indonesia ·{' '}
            <span className="font-semibold">MyDesignForge</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
