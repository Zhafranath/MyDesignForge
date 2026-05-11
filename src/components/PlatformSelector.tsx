"use client";

import { PLATFORMS, PLATFORM_ORDER } from '@/lib/constants';
import type { Platform } from '@/types';
import { clsx } from 'clsx';

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
  disabled?: boolean;
}

export function PlatformSelector({ value, onChange, disabled = false }: PlatformSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Pilih AI image tool" className="space-y-2">
      <p className="font-display font-semibold text-kawaii-text text-sm">
        🎯 AI Image Tool
      </p>
      <div className="flex flex-wrap gap-2">
        {PLATFORM_ORDER.map((platform) => {
          const meta = PLATFORMS[platform];
          const isSelected = value === platform;
          return (
            <button
              key={platform}
              role="radio"
              aria-checked={isSelected}
              onClick={() => !disabled && onChange(platform)}
              disabled={disabled}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 rounded-kawaii-sm border-2',
                'font-body text-sm font-semibold transition-all',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'bg-primary-100 border-primary-400 text-primary-600 shadow-kawaii'
                  : 'bg-white border-kawaii-border text-kawaii-muted hover:border-primary-300 hover:bg-primary-50'
              )}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
