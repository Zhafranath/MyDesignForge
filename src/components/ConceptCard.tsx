"use client";

import { motion, AnimatePresence } from 'framer-motion';
import type { CharacterConcept } from '@/types';

interface ConceptCardProps {
  concept: CharacterConcept | null;
  isLoading: boolean;
}

export function ConceptCard({ concept, isLoading }: ConceptCardProps) {
  if (!isLoading && !concept) return null;

  return (
    <AnimatePresence mode="wait">
      {isLoading && !concept ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="kawaii-card p-5 space-y-3"
          aria-busy="true"
          aria-label="Merancang konsep karakter..."
        >
          <div className="skeleton h-6 w-40 rounded-full" />
          <div className="skeleton h-4 w-56 rounded-full" />
          <div className="skeleton h-4 w-full rounded-full" />
          <div className="skeleton h-4 w-3/4 rounded-full" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton w-8 h-8 rounded-full" />
            ))}
          </div>
        </motion.div>
      ) : concept ? (
        <motion.div
          key="concept"
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="kawaii-card p-5 space-y-3"
          role="region"
          aria-label={`Konsep karakter: ${concept.name}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display font-bold text-xl text-kawaii-text">
                ✨ {concept.name}
              </h2>
              <p className="font-body text-sm text-kawaii-muted italic">
                {concept.tagline}
              </p>
            </div>
            {/* Color palette chips */}
            <div className="flex gap-1.5 flex-shrink-0" aria-label="Warna karakter">
              {concept.colors.slice(0, 4).map((color, idx) => (
                <div
                  key={idx}
                  className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          <p className="font-body text-sm text-kawaii-text leading-relaxed">
            {concept.description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-full font-body font-semibold border border-primary-200">
              🎨 {concept.style}
            </span>
            {concept.characterType ? (
              <span className="text-xs bg-secondary-50 text-secondary-700 px-3 py-1 rounded-full font-body font-semibold border border-secondary-200">
                🧩 {concept.characterType}
              </span>
            ) : null}
            {concept.tags?.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-kawaii-bg text-kawaii-muted px-2.5 py-1 rounded-full font-body border border-kawaii-border"
              >
                #{tag}
              </span>
            ))}
          </div>

          {concept.productFit && (
            <p className="font-body text-xs text-kawaii-muted leading-relaxed bg-kawaii-bg border border-kawaii-border rounded-kawaii-sm p-3">
              🛍️ {concept.productFit}
            </p>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
