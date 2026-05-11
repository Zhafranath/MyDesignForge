"use client";

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Sparkles } from 'lucide-react';
import { getRandomIdea } from '@/lib/randomIdeas';
import { MAX_DESC_LENGTH, MIN_DESC_LENGTH } from '@/lib/constants';
import { clsx } from 'clsx';
import type { GenerationOptions } from '@/types';

interface CharacterInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationOptions?: GenerationOptions;
}

export function CharacterInput({
  value,
  onChange,
  onGenerate,
  isGenerating,
  generationOptions,
}: CharacterInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = value.length;
  const canGenerate = charCount >= MIN_DESC_LENGTH && !isGenerating;
  const isNearLimit = charCount > MAX_DESC_LENGTH * 0.85;

  const handleShuffle = useCallback(() => {
    const idea = getRandomIdea(value, generationOptions);
    onChange(idea);
    textareaRef.current?.focus();
  }, [value, onChange, generationOptions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl/Cmd+Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (canGenerate) onGenerate();
      }
    },
    [canGenerate, onGenerate]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="character-description"
          className="font-display font-semibold text-kawaii-text"
        >
          🎨 Deskripsikan Ide Desainmu
        </label>
        <span
          className={clsx(
            'text-xs font-body font-semibold tabular-nums',
            isNearLimit ? 'text-secondary-500' : 'text-kawaii-muted'
          )}
          aria-live="polite"
          aria-label={`${charCount} dari ${MAX_DESC_LENGTH} karakter`}
        >
          {charCount}/{MAX_DESC_LENGTH}
        </span>
      </div>

      <div className="relative">
        <textarea
          id="character-description"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_DESC_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder="Contoh: Axolotl pink gamer yang lucu, pakai hoodie oversized, ekspresi deadpan, suka snack malam, gaya kawaii vector dengan outline tebal..."
          rows={4}
          disabled={isGenerating}
          className="kawaii-input resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          aria-describedby="desc-hint"
        />
      </div>

      <p id="desc-hint" className="text-xs text-kawaii-muted font-body">
        💡 Tulis karakter, mood, warna, quote singkat, atau target pembeli. •{' '}
        <kbd className="font-mono bg-primary-50 px-1 rounded text-primary-600 text-xs">
          Ctrl+Enter
        </kbd>{' '}
        untuk generate
      </p>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleShuffle}
          disabled={isGenerating}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-2.5 rounded-kawaii-sm',
            'bg-kawaii-yellow border-2 border-yellow-200 text-kawaii-text',
            'font-body font-semibold text-sm transition-all',
            'hover:bg-yellow-100 hover:scale-105 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2'
          )}
          aria-label="Acak ide karakter"
        >
          <Shuffle className="w-4 h-4" aria-hidden="true" />
          Acak Ide
        </button>

        <motion.button
          onClick={onGenerate}
          disabled={!canGenerate}
          whileTap={canGenerate ? { scale: 0.95 } : {}}
          animate={isGenerating ? { scale: [1, 1.02, 1] } : {}}
          transition={isGenerating ? { repeat: Infinity, duration: 1.2 } : {}}
          className={clsx(
            'flex-1 flex items-center justify-center gap-2',
            'px-6 py-2.5 rounded-kawaii-sm font-display font-semibold text-sm',
            'transition-all focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            canGenerate
              ? 'bg-primary-300 text-primary-700 hover:bg-primary-400 hover:shadow-kawaii'
              : 'bg-kawaii-border text-kawaii-muted cursor-not-allowed'
          )}
          aria-label={isGenerating ? 'Sedang generate...' : 'Generate prompt desain'}
          aria-busy={isGenerating}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          {isGenerating ? 'Generating...' : 'Generate Prompt ✨'}
        </motion.button>
      </div>
    </div>
  );
}
