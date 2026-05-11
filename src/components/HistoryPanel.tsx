"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { PLATFORMS, PRODUCTS } from '@/lib/constants';
import type { StickerPack } from '@/types';

interface HistoryPanelProps {
  history: StickerPack[];
  onLoad: (pack: StickerPack) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({ history, onLoad, onDelete, onClear }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-kawaii-sm bg-kawaii-bg border border-kawaii-border hover:bg-primary-50 transition-all font-body font-semibold text-sm text-kawaii-muted focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-controls="history-list"
      >
        <span className="flex items-center gap-2">
          <History className="w-4 h-4" aria-hidden="true" />
          Riwayat Pack ({history.length}/20)
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="history-list"
            key="history"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            role="list"
            aria-label="Riwayat stiker pack"
          >
            <div className="pt-1 space-y-2 max-h-72 overflow-y-auto pr-1">
              {/* Clear all */}
              <div className="flex justify-end">
                <button
                  onClick={onClear}
                  className="text-xs text-secondary-500 hover:text-secondary-600 font-body font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary-50 transition-all"
                  aria-label="Hapus semua riwayat"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Hapus Semua
                </button>
              </div>

              {history.map((pack) => {
                const platformMeta = PLATFORMS[pack.platform];
                const productMeta = PRODUCTS[pack.targetProduct ?? 'sticker'];
                const date = new Date(pack.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div
                    key={pack.id}
                    role="listitem"
                    className="flex items-center gap-2 p-3 rounded-kawaii-sm bg-white border border-kawaii-border hover:border-primary-300 hover:shadow-kawaii transition-all group"
                  >
                    <button
                      onClick={() => onLoad(pack)}
                      className="flex-1 text-left min-w-0 focus-visible:outline-none"
                      aria-label={`Muat kembali pack ${pack.concept.name}`}
                    >
                      <p className="font-body font-semibold text-sm text-kawaii-text truncate">
                        {pack.concept.name}
                      </p>
                      <p className="text-xs text-kawaii-muted truncate">
                        {productMeta.emoji} {productMeta.label} · {platformMeta.emoji} {platformMeta.label} · {date}
                      </p>
                    </button>

                    {/* Color dots */}
                    <div className="flex gap-1 flex-shrink-0" aria-hidden="true">
                      {pack.concept.colors.slice(0, 3).map((c, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => onDelete(pack.id)}
                      className="flex-shrink-0 p-1 rounded text-kawaii-border hover:text-secondary-500 hover:bg-secondary-50 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-1"
                      aria-label={`Hapus pack ${pack.concept.name}`}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
