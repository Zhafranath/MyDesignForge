"use client";

import { PRODUCTS, PRODUCT_ORDER } from '@/lib/constants';
import type { ProductType } from '@/types';
import { clsx } from 'clsx';

interface ProductSelectorProps {
  value: ProductType;
  onChange: (product: ProductType) => void;
  disabled?: boolean;
}

export function ProductSelector({ value, onChange, disabled = false }: ProductSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Pilih produk Redbubble" className="space-y-2">
      <p className="font-display font-semibold text-kawaii-text text-sm">
        🛍️ Mau dijual sebagai apa?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PRODUCT_ORDER.map((product) => {
          const meta = PRODUCTS[product];
          const isSelected = value === product;
          return (
            <button
              key={product}
              role="radio"
              aria-checked={isSelected}
              onClick={() => !disabled && onChange(product)}
              disabled={disabled}
              className={clsx(
                'text-left px-3 py-3 rounded-kawaii-sm border-2',
                'font-body text-sm transition-all',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'bg-primary-100 border-primary-400 text-primary-700 shadow-kawaii'
                  : 'bg-white border-kawaii-border text-kawaii-muted hover:border-primary-300 hover:bg-primary-50'
              )}
            >
              <span className="flex items-center gap-2 font-semibold text-kawaii-text">
                <span aria-hidden="true">{meta.emoji}</span>
                <span>{meta.label}</span>
              </span>
              <span className="block mt-1 text-xs leading-snug text-kawaii-muted">
                {meta.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
