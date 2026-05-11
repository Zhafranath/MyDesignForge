import { useState, useCallback, useRef } from 'react';

interface UseCopyReturn {
  copied: boolean;
  copy: (text: string) => Promise<void>;
}

/** Copies text to clipboard and shows a "copied" state for 2 seconds */
export function useCopy(): UseCopyReturn {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  return { copied, copy };
}
