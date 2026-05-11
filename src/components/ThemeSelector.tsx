"use client";

import { clsx } from 'clsx';
import { DESIGN_THEME_OPTIONS, DESIGN_THEME_ORDER } from '@/lib/constants';
import type { DesignTheme } from '@/types';

interface ThemeSelectorProps {
  value: DesignTheme;
  onChange: (value: DesignTheme) => void;
  disabled?: boolean;
}

export function ThemeSelector({
  value,
  onChange,
  disabled = false,
}: ThemeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Pilih tema desain" className="space-y-2">
      <p className="font-display font-semibold text-kawaii-text text-sm">
        Tema desain
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {DESIGN_THEME_ORDER.map((theme) => {
          const meta = DESIGN_THEME_OPTIONS[theme];
          const isSelected = value === theme;

          return (
            <button
              key={theme}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => !disabled && onChange(theme)}
              disabled={disabled}
              title={meta.description}
              className={clsx(
                'min-h-11 px-3 py-2 rounded-kawaii-sm border-2 text-left',
                'font-body text-sm font-semibold transition-all',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'bg-accent-100 border-accent-300 text-green-700 shadow-kawaii'
                  : 'bg-white border-kawaii-border text-kawaii-muted hover:border-accent-200 hover:bg-accent-50'
              )}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
