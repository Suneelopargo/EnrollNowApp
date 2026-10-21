// frontend/shared/accessibility/useRovingTabIndex.ts
// Reusable Roving TabIndex Hook for WAI-ARIA Composite Widgets (Tabs, Menus, Toolbars)

import { useCallback } from 'react';

export interface UseRovingTabIndexOptions {
  itemIds: string[];
  activeId: string;
  onActivate: (id: string) => void;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
}

export function useRovingTabIndex({
  itemIds,
  activeId,
  onActivate,
  orientation = 'horizontal',
  loop = true,
}: UseRovingTabIndexOptions) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = itemIds.indexOf(activeId);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      let handled = false;

      const isHorizontal = orientation === 'horizontal' || orientation === 'both';
      const isVertical = orientation === 'vertical' || orientation === 'both';

      if (isHorizontal && e.key === 'ArrowRight') {
        nextIndex = currentIndex + 1;
        handled = true;
      } else if (isHorizontal && e.key === 'ArrowLeft') {
        nextIndex = currentIndex - 1;
        handled = true;
      } else if (isVertical && e.key === 'ArrowDown') {
        nextIndex = currentIndex + 1;
        handled = true;
      } else if (isVertical && e.key === 'ArrowUp') {
        nextIndex = currentIndex - 1;
        handled = true;
      } else if (e.key === 'Home') {
        nextIndex = 0;
        handled = true;
      } else if (e.key === 'End') {
        nextIndex = itemIds.length - 1;
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();

        if (loop) {
          if (nextIndex < 0) nextIndex = itemIds.length - 1;
          if (nextIndex >= itemIds.length) nextIndex = 0;
        } else {
          nextIndex = Math.max(0, Math.min(nextIndex, itemIds.length - 1));
        }

        const nextId = itemIds[nextIndex];
        if (nextId && nextId !== activeId) {
          onActivate(nextId);
        }
      }
    },
    [itemIds, activeId, onActivate, orientation, loop]
  );

  const getTabIndex = useCallback(
    (id: string): number => {
      return id === activeId ? 0 : -1;
    },
    [activeId]
  );

  return {
    handleKeyDown,
    getTabIndex,
  };
}

export default useRovingTabIndex;
