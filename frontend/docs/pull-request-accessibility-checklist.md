# Pull Request Accessibility Checklist (WCAG 2.2 AA)

Before submitting or merging any pull request affecting UI components, verify that all applicable accessibility criteria are met:

- [ ] **Keyboard Accessible**: All new or modified interactive elements can be operated using `Tab`, `Shift+Tab`, `Enter`, `Space`, and arrow keys.
- [ ] **Visible Focus Indicator**: Focus rings are visible on every focusable control with at least 3:1 contrast against adjacent background colors.
- [ ] **No Positive TabIndex**: No elements use `tabIndex > 0`.
- [ ] **Dialogs & Overlays**: Modals and alertdialogs use `role="dialog"` / `role="alertdialog"`, trap focus while open, close on `Escape`, and return focus to the trigger upon closing.
- [ ] **Accessible Names**: All buttons, links, icon controls, and form inputs have descriptive accessible names (`aria-label`, visible text, or associated `<label>`).
- [ ] **Forms & Validation**:
  - Every input has an associated `<label htmlFor="...">` or `<AccessibleField>`.
  - Required fields are indicated programmatically (`aria-required="true"` / `required`).
  - Validation errors are linked via `aria-describedby` and marked with `role="alert"`.
  - Invalid inputs expose `aria-invalid="true"`.
- [ ] **Tables & Lists**: Data tables have `<th scope="col">` and regions/captions where applicable.
- [ ] **Color Contrast**: Normal text satisfies at least 4.5:1 contrast; large text and UI boundaries satisfy at least 3:1.
- [ ] **Color Independence**: Information is not conveyed exclusively through color.
- [ ] **Automated Tests Pass**: All unit and accessibility tests pass:
  ```bash
  npm --prefix frontend run test
  npm --prefix frontend run typecheck
  npm --prefix frontend run build
  ```
- [ ] **No Regression**: Existing workflows, authentication, API requests, and business logic remain undisturbed.
