// frontend/shared/accessibility/useAnnounce.ts
// Reusable Live Region Announcer for Assistive Technology (WCAG 4.1.3 Status Messages)

export type Politeness = 'polite' | 'assertive';

let liveRegion: HTMLElement | null = null;

function ensureLiveRegion(): HTMLElement {
  if (typeof document === 'undefined') {
    return {} as HTMLElement;
  }

  if (!liveRegion || !document.body.contains(liveRegion)) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'enl-global-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }

  return liveRegion;
}

export function announceMessage(message: string, politeness: Politeness = 'polite'): void {
  if (typeof document === 'undefined' || !message) return;

  const region = ensureLiveRegion();
  region.setAttribute('aria-live', politeness);

  // Clear and update with slight delay to ensure assistive technology perceives DOM mutation
  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

export function useAnnounce() {
  return {
    announce: announceMessage,
    announcePolite: (msg: string) => announceMessage(msg, 'polite'),
    announceAssertive: (msg: string) => announceMessage(msg, 'assertive'),
  };
}

export default useAnnounce;
