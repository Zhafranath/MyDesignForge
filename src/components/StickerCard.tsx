"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, Pencil, ImagePlus, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { useCopy } from '@/hooks/useCopy';
import { EXPRESSIONS } from '@/lib/constants';
import type { StickerPrompt, Expression, ProductType } from '@/types';

interface StickerCardProps {
  sticker: StickerPrompt;
  onRegenerate: (expression: Expression) => void;
  isRegenerating: boolean;
  index: number;
  targetProduct: ProductType;
}

type ImageStatus = 'idle' | 'generating' | 'done' | 'error';

export function StickerCard({
  sticker,
  onRegenerate,
  isRegenerating,
  index,
  targetProduct,
}: StickerCardProps) {
  const { copied, copy } = useCopy();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(sticker.prompt);
  const [imageStatus, setImageStatus] = useState<ImageStatus>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const meta = EXPRESSIONS[sticker.expression];
  const displayTitle = sticker.title ?? meta.label;
  const activePrompt = isEditing ? editedPrompt : sticker.prompt;
  const showImageControls = targetProduct === 'sticker';

  const handleCopy = useCallback(() => {
    copy(activePrompt);
  }, [copy, activePrompt]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditedPrompt(sticker.prompt);
      setIsEditing(true);
    }
  }, [isEditing, sticker.prompt]);

  const handleGenerateImage = useCallback(async () => {
    setImageStatus('generating');
    setImageError(null);

    try {
      const response = await fetch('/api/sticker-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          expression: sticker.expression,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload.message === 'string'
            ? payload.message
            : 'Gagal generate image sticker.'
        );
      }

      if (typeof payload.imageUrl !== 'string' || payload.imageUrl.trim().length === 0) {
        throw new Error('Response image tidak valid.');
      }

      setImageUrl(payload.imageUrl);
      setImageStatus('done');
    } catch (err) {
      setImageStatus('error');
      setImageError((err as Error).message || 'Gagal generate image sticker.');
    }
  }, [activePrompt, sticker.expression]);

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.07,
        type: 'spring',
        stiffness: 280,
        damping: 22,
      }}
      className="kawaii-card p-4 flex flex-col gap-3"
      aria-label={`Prompt ${displayTitle}: ${meta.description}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={displayTitle}>
            {sticker.emoji}
          </span>
          <div>
            <p className="font-display font-bold text-sm text-kawaii-text leading-tight">
              {displayTitle}
            </p>
            <p className="font-body text-xs text-kawaii-muted">{meta.description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {isEditing ? (
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="w-full text-xs font-mono bg-primary-50 border border-primary-200 rounded-kawaii-sm p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 text-kawaii-text"
            rows={5}
            aria-label={`Edit prompt untuk ${displayTitle}`}
          />
        ) : (
          <p className="text-xs font-mono text-kawaii-text bg-kawaii-bg rounded-kawaii-sm p-2.5 leading-relaxed break-words select-all cursor-text border border-kawaii-border">
            {sticker.prompt}
          </p>
        )}
      </div>

      {showImageControls && (
        <div className="rounded-kawaii-sm border border-kawaii-border bg-white/70 p-2.5 space-y-2">
          <div className="aspect-square rounded-kawaii-sm bg-kawaii-bg border border-kawaii-border overflow-hidden flex items-center justify-center">
            {imageStatus === 'generating' && (
              <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" aria-hidden="true" />
            )}
            {imageStatus === 'done' && imageUrl && (
              <img
                src={imageUrl}
                alt={`Generated sticker image for ${displayTitle}`}
                className="w-full h-full object-contain"
              />
            )}
            {(imageStatus === 'idle' || imageStatus === 'error') && (
              <ImagePlus className="w-5 h-5 text-kawaii-muted" aria-hidden="true" />
            )}
          </div>

          {imageStatus === 'error' && imageError && (
            <p className="text-xs font-body text-secondary-600 leading-snug" role="alert">
              {imageError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerateImage}
              disabled={imageStatus === 'generating'}
              className={clsx(
                'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
                'text-xs font-body font-semibold transition-all flex-1 justify-center',
                'bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200 active:scale-95',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={`Generate image ${displayTitle}`}
            >
              <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
              {imageStatus === 'generating' ? 'Generating...' : 'Generate Image'}
            </button>

            {imageUrl && (
              <a
                href={imageUrl}
                download={`stickerforge-${sticker.expression}.png`}
                className={clsx(
                  'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
                  'text-xs font-body font-semibold transition-all',
                  'bg-accent-200 text-green-700 border border-accent-300 hover:bg-accent-300 active:scale-95',
                  'focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1'
                )}
                aria-label={`Download image ${displayTitle}`}
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}

      {sticker.tips && (
        <p className="text-xs text-kawaii-muted font-body italic leading-snug">
          {sticker.tips}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCopy}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
            'text-xs font-body font-semibold transition-all flex-1 justify-center',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            copied
              ? 'bg-accent-200 text-green-700 border border-accent-300'
              : 'bg-primary-100 text-primary-700 border border-primary-200 hover:bg-primary-200 active:scale-95'
          )}
          aria-label={copied ? 'Tersalin!' : `Salin prompt ${displayTitle}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {copied ? 'Tersalin!' : 'Salin'}
        </button>

        <button
          onClick={handleEditToggle}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
            'text-xs font-body font-semibold transition-all',
            'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
            isEditing
              ? 'bg-accent-200 text-green-700 border border-accent-300 hover:bg-accent-300'
              : 'bg-kawaii-bg text-kawaii-muted border border-kawaii-border hover:bg-primary-50 active:scale-95'
          )}
          aria-label={isEditing ? 'Simpan perubahan' : `Edit prompt ${displayTitle}`}
        >
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          {isEditing ? 'OK' : 'Edit'}
        </button>

        <button
          onClick={() => onRegenerate(sticker.expression)}
          disabled={isRegenerating}
          className={clsx(
            'flex items-center gap-1 px-3 py-1.5 rounded-kawaii-sm',
            'text-xs font-body font-semibold transition-all',
            'focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-1',
            'bg-secondary-100 text-secondary-500 border border-secondary-200',
            'hover:bg-secondary-200 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={`Regenerate prompt ${displayTitle}`}
          aria-busy={isRegenerating}
        >
          <RefreshCw
            className={clsx('w-3.5 h-3.5', isRegenerating && 'animate-spin')}
            aria-hidden="true"
          />
        </button>
      </div>
    </motion.article>
  );
}
