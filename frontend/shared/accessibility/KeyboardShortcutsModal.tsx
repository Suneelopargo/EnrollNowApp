// frontend/shared/accessibility/KeyboardShortcutsModal.tsx
// Global Accessible Keyboard Shortcuts & Navigation Help Modal
// WCAG 2.2 AA (2.1.1 Keyboard, 2.4.3 Focus Order, 1.4.3 Contrast) & ADA Title III

import React from 'react';
import { Modal } from '../design-system/components/Modal';
import {
  SHORTCUT_CATEGORIES,
  getShortcutsByCategory,
} from './shortcutRegistry';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Navigation & Shortcuts Help"
      size="wide"
      className="enl-shortcuts-modal"
      footer={
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
        >
          Close Help
        </button>
      }
    >
      <div className="enl-shortcuts-container">
        <p className="enl-shortcuts-intro text-secondary">
          EnrollNow supports complete keyboard accessibility targeting <strong>WCAG 2.2 Level AA</strong> standards.
          Below is a guide to the keyboard interactions and shortcuts supported across the application.
        </p>

        {SHORTCUT_CATEGORIES.map((category) => {
          const shortcuts = getShortcutsByCategory(category.id);
          if (shortcuts.length === 0) return null;

          return (
            <section
              key={category.id}
              className="enl-shortcuts-section"
              aria-labelledby={`shortcuts-cat-${category.id}`}
            >
              <h4 id={`shortcuts-cat-${category.id}`} className="enl-shortcuts-heading">
                {category.title}
              </h4>
              <p className="enl-shortcuts-desc text-muted">{category.description}</p>

              <table className="enl-shortcuts-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '28%' }}>Shortcut Keys</th>
                    <th scope="col" style={{ width: '27%' }}>Action</th>
                    <th scope="col" style={{ width: '45%' }}>Behavior & Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {shortcuts.map((sc) => (
                    <tr key={sc.id}>
                      <td className="enl-shortcuts-keys">
                        <div className="enl-keys-group">
                          {sc.keys.map((key, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className="enl-key-plus" aria-hidden="true">+</span>}
                              <kbd className="enl-kbd">{key}</kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </td>
                      <td className="enl-shortcuts-label font-medium">{sc.label}</td>
                      <td className="enl-shortcuts-description">
                        {sc.description}
                        {sc.scope && (
                          <span className="enl-shortcuts-scope-badge">
                            {sc.scope}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsModal;
