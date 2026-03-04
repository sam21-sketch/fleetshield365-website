import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface ShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcut = (
  key: string,
  callback: KeyHandler,
  options: ShortcutOptions = {}
) => {
  const { ctrl = false, shift = false, alt = false, meta = false, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;
      const metaMatch = meta ? event.metaKey : true; // Don't require meta to be false

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [key, callback, ctrl, shift, alt, meta, preventDefault]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

// Pre-defined shortcuts
export const SHORTCUTS = {
  NEW: 'n',           // Press N to add new item
  SEARCH: '/',        // Press / to focus search
  ESCAPE: 'Escape',   // Press Escape to close modals/panels
  SAVE: 's',          // Ctrl+S to save
  DELETE: 'Delete',   // Delete key
  REFRESH: 'r',       // Press R to refresh
} as const;
