"use client";

import { clsx } from 'clsx';
import { MAX_CUSTOM_TEXT_LENGTH, TEXT_MODE_OPTIONS, TEXT_MODE_ORDER } from '@/lib/constants';
import type { TextMode } from '@/types';

interface TextOptionsSelectorProps {
  textMode: TextMode;
  customText: string;
  onTextModeChange: (value: TextMode) => void;
  onCustomTextChange: (value: string) => void;
  disabled?: boolean;
}

export function TextOptionsSelector({
  textMode,
  customText,
  onTextModeChange,
  onCustomTextChange,
  disabled = false,
}: TextOptionsSelectorProps) {
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Pilih tulisan di desain" className="space-y-2">
        <p className="font-display font-semibold text-kawaii-text text-sm">
          Tulisan di desain
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TEXT_MODE_ORDER.map((mode) => {
            const meta = TEXT_MODE_OPTIONS[mode];
            const isSelected = textMode === mode;

            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => !disabled && onTextModeChange(mode)}
                disabled={disabled}
                className={clsx(
                  'min-h-16 px-3 py-3 rounded-kawaii-sm border-2 text-left',
                  'font-body text-sm transition-all',
                  'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isSelected
                    ? 'bg-secondary-50 border-secondary-300 text-secondary-700 shadow-kawaii'
                    : 'bg-white border-kawaii-border text-kawaii-muted hover:border-secondary-200 hover:bg-secondary-50'
                )}
              >
                <span className="block font-semibold text-kawaii-text">
                  {meta.label}
                </span>
                <span className="block mt-1 text-xs leading-snug text-kawaii-muted">
                  {meta.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {textMode === 'custom' ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="custom-text" className="font-display font-semibold text-kawaii-text text-sm">
              Teks custom
            </label>
            <span className="font-body text-xs text-kawaii-muted">
              {customText.length}/{MAX_CUSTOM_TEXT_LENGTH}
            </span>
          </div>
          <input
            id="custom-text"
            type="text"
            value={customText}
            maxLength={MAX_CUSTOM_TEXT_LENGTH}
            onChange={(event) => onCustomTextChange(event.target.value)}
            disabled={disabled}
            placeholder="contoh: hello, boo, sorry"
            className={clsx(
              'w-full px-3 py-2 rounded-kawaii-sm border-2 border-kawaii-border',
              'font-body text-sm text-kawaii-text bg-white outline-none transition-all',
              'placeholder:text-kawaii-muted/70',
              'focus:border-secondary-300 focus:ring-2 focus:ring-secondary-100',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
