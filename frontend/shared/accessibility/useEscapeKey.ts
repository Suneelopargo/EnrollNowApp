// frontend/shared/accessibility/useEscapeKey.ts
// Universal Escape Key Handler Hook (WCAG 2.1.1 Keyboard)

import { useEffect } from 'react';

export function useEscapeKey(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handler, active]);
}

export default useEscapeKey;
