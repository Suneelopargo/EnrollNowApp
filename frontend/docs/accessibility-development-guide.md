# EnrollNow Accessibility Development Guide

Target Standard: **WCAG 2.2 Level AA** & applicable **ADA Title III** accessibility standards.

---

## 1. Core Principles

All screens and microfrontends in EnrollNow must adhere to the four accessibility principles:

1. **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive (contrast, text resizing, alternative text, captions).
2. **Operable**: User interface components and navigation must be operable using a keyboard alone without mouse reliance.
3. **Understandable**: Information and the operation of the user interface must be understandable (clear validation errors, consistent navigation, explicit labels).
4. **Robust**: Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.

---

## 2. Approved Shared Components & Utilities

Always use approved components from `@enrollnow/shared` rather than writing custom one-offs:

| Component / Utility | Package Path | Purpose |
|---|---|---|
| `Modal` | `@enrollnow/shared` | WAI-ARIA modal dialog with focus trap and Escape key dismissal |
| `ConfirmationContainer` / `requestConfirmation` | `@enrollnow/shared` | Accessible asynchronous confirmation alertdialogs |
| `Tabs` | `@enrollnow/shared` | Accessible tablist widget with roving tabindex and Arrow key navigation |
| `DataTable` | `@enrollnow/shared` | Semantic data tables with `scope="col"`, region landmarks, and status announcements |
| `DataGrid` | `@enrollnow/shared` | AG Grid wrapper with standardized contrast and pagination |
| `AccessibleField` | `@enrollnow/shared` | Form field wrapper binding labels, `aria-describedby`, errors, and required states |
| `SkipLink` | `@enrollnow/shared` | "Skip to main content" link for keyboard users (WCAG 2.4.1) |
| `useFocusTrap` | `@enrollnow/shared` | Hook to trap keyboard focus inside custom dialogs and return focus on close |
| `useRovingTabIndex` | `@enrollnow/shared` | Hook for arrow-key navigation in composite widgets |
| `useEscapeKey` | `@enrollnow/shared` | Hook to dismiss menus and overlays on Escape key press |
| `announceMessage` | `@enrollnow/shared` | Live-region announcements for screen readers (`polite` / `assertive`) |
| `acquireScrollLock` | `@enrollnow/shared` | Reference-counted document scroll lock preventing background scrolling |
| `acquireInertBackground` | `@enrollnow/shared` | Ancestor-safe native `inert` and `aria-hidden` background isolation |
| `KeyboardShortcutsModal` | `@enrollnow/shared` | Centralized keyboard shortcuts help dialog accessible from header |

---

## 3. Keyboard Navigation Requirements

- **All interactive elements** must be reachable and activatable via keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`).
- **Focus Order**: Tab order must follow the visual and logical reading sequence (WCAG 2.4.3). Never use `tabindex > 0`.
- **Focus Appearance**: All interactive controls must show a visible focus indicator with at least 3:1 contrast against adjacent colors (WCAG 2.4.7, WCAG 2.2 2.4.11).
- **Escape Key**: All dismissible overlays (modals, alertdialogs, user menus, dropdown popups) must close on `Escape` and restore focus to the triggering element.
- **Composite Widgets**: Tab lists, menu bars, and listboxes should support arrow keys (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, `End`) using roving tabindex.
- **No Keyboard Traps**: Focus must never become trapped in any element or widget unless inside an active modal dialog (WCAG 2.1.2).

### 3.1 Modal Dialog Keyboard & Background Isolation
- **Focus Containment**: When a modal opens, focus moves to the first interactive element or container. `Tab` and `Shift+Tab` wrap within the active dialog controls.
- **Background Interactivity (`inert`)**: All background siblings across the DOM tree receive the native `inert` attribute and `aria-hidden="true"`. Ancestors of the active dialog are NEVER made inert, ensuring child and portaled modals remain fully interactive.
- **Background Scrolling Lock**: Document body scrolling is locked using reference counting (`acquireScrollLock`). Scrollbar width is compensated to prevent desktop layout shift. Internal modal content scrolling is fully preserved.
- **Focus Restoration**: Upon modal closure via close button, Cancel, or `Escape`, focus is restored to the triggering element. If the original trigger was removed from the DOM, focus falls back safely to `#main-content`.

### 3.2 Global Keyboard Shortcuts Help
- A dedicated keyboard shortcuts help icon (`Keyboard` icon) is positioned in the global application header.
- Accessible name: `"Keyboard shortcuts help"`.
- Opens an accessible `KeyboardShortcutsModal` displaying verified, currently supported shortcuts categorized into General Navigation, Workspace Screen Tabs, Dialogs, and Forms.

### 3.3 Professional Accessible Toast Notifications
- **Solid Colored Visual Architecture**: Toasts render with solid, fully colored backgrounds and pure white (`#FFFFFF`) typography and icons for immediate cognitive recognition without relying on color alone:
  - **Success (`#15803D`)**: CheckCircle icon (`size={22}`), 5.02:1 contrast ratio against white text. Default duration: 4 seconds.
  - **Error (`#B91C1C`)**: AlertCircle icon (`size={22}`), 6.47:1 contrast ratio against white text. Default duration: 7 seconds (recoverable) or permanent until dismissed (`critical: true`).
  - **Warning (`#92400E`)**: AlertTriangle icon (`size={22}`), 7.09:1 contrast ratio against white text. Default duration: 6 seconds.
  - **Information (`#1D4ED8`)**: Info icon (`size={22}`), 6.70:1 contrast ratio against white text. Default duration: 5 seconds.
- **Typography & Compact Sizing**:
  - **Heading**: 16px (1rem), font-weight 600 (semibold), line-height 1.4, margin 0.
  - **Message**: 16px (1rem), font-weight 400 (regular), line-height 1.5, margin 0.
  - **Heading-to-Message Gap**: 4px.
  - **Status & Close Icons**: 22px with consistent 2.2 stroke width.
  - **Container Dimensions**: Compact responsive width `min(400px, calc(100vw - 32px))` with `max-width: 420px` on desktop and full-width padding on mobile devices.
  - **Padding**: 16px consistent padding.
- **Screen Reader Announcements**:
  - Urgent error messages utilize `role="alert"` and `aria-live="assertive"`.
  - Routine notifications (Success, Warning, Info) utilize `role="status"` and `aria-live="polite"`.
  - Outer container defines `role="region"` with `aria-label="Notifications"`.
  - Icons marked with `aria-hidden="true"` to prevent redundant speech synthesizer announcements.
- **Keyboard & Focus Safety**:
  - Toast appearances **never** hijack keyboard focus away from the user's active workflow.
  - Close buttons are standard keyboard-operable native `<button>` elements (`Tab` -> `Enter` / `Space`) with `aria-label="Dismiss [type] notification"` and visible high-contrast focus rings (`outline: 2px solid #ffffff`).
- **Timing, Deduplication & Stacking**:
  - Hovering or focusing a toast pauses its auto-dismiss timer, ensuring sufficient reading time.
  - Identical rapid notifications within 1.5 seconds are deduplicated.
  - Up to 4 notifications stack cleanly in the top-right viewport without overlapping page controls.
  - Windows High Contrast (Forced Colors) and `prefers-reduced-motion` are fully supported.

---

## 4. Forms, Validation & Error Handling

1. **Every Input Must Have an Accessible Name**:
   - Use `<label htmlFor="id">` or the `<AccessibleField>` component.
   - Do not rely solely on `placeholder` as a label; persistent visible labels must always be placed above or beside the input (WCAG 3.3.2).
2. **Required Fields**:
   - Indicate required status programmatically with `required` and `aria-required="true"`.
   - Provide a visual indicator with `<span className="form-required-marker" aria-hidden="true">*</span>`.
3. **Inline Validation Errors (Inside-Input Placement)**:
   - When a field is invalid and empty, display the validation error message **inside** the input field by replacing the placeholder.
   - Set `aria-invalid="true"` to render the error border (`border-color: $color-danger`) and high-contrast red placeholder styling (`color: $color-danger; opacity: 1; font-weight: 500`).
   - Remove separate visible error blocks below inputs to prevent layout shifts.
   - **Critical Input Value Rule**: NEVER replace or overwrite user-entered text with an error message. If the user has entered text that remains invalid, preserve their entered text, maintain `aria-invalid="true"`, and provide the error description accessibly.
   - Associate the error with the input via `aria-describedby="[input-id]-error"`.
   - Render the error text in a visually hidden element (`.sr-only`) with `role="alert"` so screen readers receive the description and live alert without a separate visible element below the field.
   - When the field becomes valid, restore the standard placeholder and clear `aria-invalid`.
4. **Form Submission**:
   - When form submission fails, move focus to the first invalid field or display a top-level alert.

---

## 5. Visual, Perceivable & Contrast Standards

- **Text Contrast**: Normal text (< 18pt or < 14pt bold) must meet at least **4.5:1** contrast ratio against its background. Large text must meet at least **3:1** (WCAG 1.4.3).
- **Non-Text Contrast**: Visual boundaries of interactive controls, checkboxes, radio buttons, and focus indicators must achieve at least **3:1** against adjacent backgrounds (WCAG 1.4.11).
- **Zoom & Reflow**: Layouts must support 200% browser zoom without loss of content and 400% zoom (320px viewport width) without horizontal scrolling (WCAG 1.4.4, 1.4.10).
- **Color Independence**: Never use color alone to convey meaning, status, or errors (WCAG 1.4.1). Always pair color with text, icons, or badges.
- **Reduced Motion**: Respect user OS motion preferences via `@media (prefers-reduced-motion: reduce)` (WCAG 2.3.3).

---

## 6. Testing Instructions

### Automated Testing
Run the shared test suite including accessibility checks:
```bash
npm --prefix frontend run test
```

### Manual Keyboard Testing Checklist
1. Unplug or disable mouse and navigate the screen using only `Tab`, `Shift+Tab`, `Enter`, `Space`, `Arrow keys`, and `Escape`.
2. Confirm the focus indicator is always clearly visible and never clipped.
3. Open any modal or dropdown:
   - Does focus move inside?
   - Does Tab stay inside the modal?
   - Does pressing Escape close it?
   - Does focus return to the button that opened it?
4. Submit forms with empty/invalid inputs:
   - Are error messages clearly visible and linked to inputs?
   - Is `aria-invalid="true"` set on failing fields?
5. Test with Screen Reader (NVDA on Windows, VoiceOver on macOS):
   - Are headings announced in a logical hierarchy (`<h1>` through `<h3>`)?
   - Are buttons and links announced with descriptive names (not "Click here" or icon-only)?
