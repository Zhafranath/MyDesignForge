"use client";

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw, Pencil } from 'lucide-react';
import { clsx } from 'clsx';
import { useCopy } from '@/hooks/useCopy';
import { EXPRESSIONS } from '@/lib/constants';
import type { StickerPrompt, Expression } from '@/types';

interface StickerCardProps {
  sticker: StickerPrompt;
  onRegenerate: (expression: Expression) => void;
  isRegenerating: boolean;
  index: number;
}

export function StickerCard({
  sticker,
  onRegenerate,
  isRegenerating,
  index,
}: StickerCardProps) {
  const { copied, copy } = useCopy();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(sticker.prompt);

  const meta = EXPRESSIONS[sticker.expression];
  const displayTitle = sticker.title ?? meta.label;

  const handleCopy = useCallback(() => {
    copy(isEditing ? editedPrompt : sticker.prompt);
  }, [copy, isEditing, editedPrompt, sticker.prompt]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // Confirm edit — keep edited version
      setIsEditing(false);
    } else {
      setEditedPrompt(sticker.prompt);
      setIsEditing(true);
    }
  }, [isEditing, sticker.prompt]);

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
      {/* Header */}
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

      {/* Prompt display / edit */}
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

      {/* Tips */}
      {sticker.tips && (
        <p className="text-xs text-kawaii-muted font-body italic leading-snug">
          💡 {sticker.tips}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {/* Copy */}
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

        {/* Edit / Confirm */}
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

        {/* Regenerate */}
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
