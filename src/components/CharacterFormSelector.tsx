"use client";

import { clsx } from 'clsx';
import { CHARACTER_FORM_OPTIONS, CHARACTER_FORM_ORDER } from '@/lib/constants';
import type { CharacterForm } from '@/types';

interface CharacterFormSelectorProps {
  value: CharacterForm;
  onChange: (value: CharacterForm) => void;
  disabled?: boolean;
}

export function CharacterFormSelector({
  value,
  onChange,
  disabled = false,
}: CharacterFormSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Pilih bentuk karakter" className="space-y-2">
      <p className="font-display font-semibold text-kawaii-text text-sm">
        Bentuk karakter
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {CHARACTER_FORM_ORDER.map((form) => {
          const meta = CHARACTER_FORM_OPTIONS[form];
          const isSelected = value === form;

          return (
            <button
              key={form}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => !disabled && onChange(form)}
              disabled={disabled}
              title={meta.description}
              className={clsx(
                'min-h-11 px-3 py-2 rounded-kawaii-sm border-2 text-left',
                'font-body text-sm font-semibold transition-all',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'bg-primary-100 border-primary-400 text-primary-700 shadow-kawaii'
                  : 'bg-white border-kawaii-border text-kawaii-muted hover:border-primary-300 hover:bg-primary-50'
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
