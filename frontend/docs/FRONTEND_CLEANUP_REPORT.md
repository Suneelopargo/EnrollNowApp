# Frontend Cleanup Report

## Scope reviewed

Reviewed the npm workspace structure, shell routing and auth, all 11 MFE entrypoints, shared API client/configuration/mock API, shared design system and styles, runtime configuration, public assets, package metadata, and tests.

## Changes made

### Imports and unused code

- Removed unused imports from the shared error boundary and footer, shell tab/navigation components, the identity MFE, survey MFE, and shared API client tests.
- Removed the unused `Bell` import and its commented-out notification button JSX from `shell/src/navigation/TopNavigation.tsx`.
- Removed unreferenced Microsoft and Google SVG logo components and the unused `rememberMe` state from `microfrontends/identity/src/remoteEntry.tsx`.
- Kept the exported `LoginMarketingPanelProps.statistics` field for compatibility; the current component does not render that field.

### Comments and styling

- Removed one confirmed commented-out JSX block. Retained explanatory JSX and API comments.
- No application-owned `.css` or `.module.css` files were found. SCSS remains the styling source; all shared design-system partials are wired through `shared/design-system/styles/index.scss`.
- No application inline `style=` attributes were found; the only `style` matches were inside a bundled vendor asset.

### Assets

- No assets were deleted. `shell/index.html` references favicon SVG/PNG/ICO and apple touch icon URLs; `microfrontends/identity/src/components/LoginMarketingPanel.tsx` references `/assets/login-researcher.png`. `shell/public/runtime-config.json` is fetched by `shared/runtime-config/index.ts`.
- `shell/public/vite.svg`, `shell/public/enrollnowfavicon.svg`, `shell/public/favicon.png`, and `shell/public/assets/login-bg-clean-2k.png` had no references in the searched source/configuration. They are retained pending confirmation of deployment, browser, or external references.

### APIs, configuration, and packages

- No old `localhost:8081` through `localhost:8092` service URLs or `DEFAULT_BACKEND_URLS` were found. The single `axios.create(...)` lives in `shared/api-client/index.ts`; `shared/mock-api/mockResponse.ts` constructs Axios error objects, not clients.
- `localhost:8080` is the current gateway default in runtime and API configuration, and in the shell's Vite `/api` proxy.
- The shell references `packages/administrator-ui` as a local file dependency. Its `dist/` is a precompiled package artifact and was retained.
- The existing root test run passed (all workspace test files); `npm run typecheck` passed across configured workspaces.

## Remaining exceptions

- A temporary TypeScript unused-symbol scan (`npx tsc --noEmit --noUnusedLocals --noUnusedParameters -p shell/tsconfig.json`) was rerun after cleanup. It still identifies unused `context` parameters and unread `loading` state in several MFE remotes, plus unread `isSubmitting` state in `microfrontends/survey/src/views/MySurveysView.tsx`. The MFE context props are part of the remote component contract; the loading state deserves a UI/behavior review before removal. The production TypeScript config was not changed.
- Development standalone MFE entrypoints contain `console.log` navigation/event stubs. Shared telemetry uses `console.info` as its configured event sink. These were retained because they are development wiring/telemetry, not arbitrary application debug calls.
- No SCSS files or selectors were removed: all shared partials are imported by the design-system entrypoint, and dynamic/public class usage makes a safe selector deletion require a more complete selector-level audit.
- Post-cleanup validation passed: `npm test`, `npm run typecheck`, and `npm run build`.
