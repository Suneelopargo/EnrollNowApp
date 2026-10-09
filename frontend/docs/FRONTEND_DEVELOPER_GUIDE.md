# EnrollNow Frontend Developer Guide

## Find the code for a screen

1. Match the URL to a route in `shell/src/routing/ShellRouter.tsx`.
2. Follow the workspace route into `shell/src/routing/WorkspaceScreenHost.tsx` and its `renderModuleContent` switch.
3. Follow the selected module to its lazy registration in `shell/src/modules/index.tsx` and then to that MFE's `src/remoteEntry.tsx`.
4. Find the screen component and its data-loading effect or event handler.
5. Follow the request to the feature API module, or directly to the shared client if the MFE uses it directly.
6. Follow `shared/api-client/index.ts` to its request/response interceptors and `shared/api-config.ts` for base URL/mode selection.
7. In mock mode, inspect `shared/mock-api/mockAdapter.ts`; in real mode, the configured Axios adapter sends the HTTP request.

## Real code trace: Dashboard

The dashboard route is declared in `shell/src/routing/ShellRouter.tsx`. The keep-alive workspace maps the `dashboard` tab to `DashboardModule` in `shell/src/routing/WorkspaceScreenHost.tsx`. The shell lazily imports `microfrontends/dashboard/src/remoteEntry.tsx` from `shell/src/modules/index.tsx`. That remote currently requests `/api/v1/dashboard/overview` directly through `shared/api-client` (rather than `shared/api/dashboardApi.ts`). Continue into `shared/api-client/index.ts`, its request interceptor, and `shared/api-config.ts`. `shared/mock-api/mockAdapter.ts` handles that endpoint in mock mode; real mode uses the configured backend base URL.

```text
shell/src/routing/ShellRouter.tsx
  -> shell/src/routing/WorkspaceScreenHost.tsx
  -> shell/src/modules/index.tsx
  -> microfrontends/dashboard/src/remoteEntry.tsx
  -> shared/api-client/index.ts
  -> request interceptor
  -> shared/api-config.ts
  -> shared/mock-api/mockAdapter.ts or configured backend
```

## Trace login and session state

The public `/login` route renders `IdentityModule` from `shell/src/modules/index.tsx`. The screen is `microfrontends/identity/src/remoteEntry.tsx`; it calls `shared/api/authApi.ts`. The API module calls the singleton `apiClient` from `shared/api-client/index.ts`. A successful result is sent through the MFE context to `shell/src/auth/AuthContext.tsx`, which persists `enrollnow_token` and `enrollnow_user` in `localStorage`. At startup, `AuthContext` restores the cached session and verifies it with `authApi.getCurrentUser()`. The request interceptor adds the bearer token. A non-login 401 clears the session and emits the auth-change event; `ProtectedRoute` in `shell/src/routing/ProtectedRoute.tsx` then routes the user to login. Logout clears storage, calls the auth logout API, and navigates to `/login`.

```text
microfrontends/identity/src/remoteEntry.tsx
  -> shell/src/auth/AuthContext.tsx
  -> shared/api/authApi.ts
  -> shared/api-client/index.ts
  -> request interceptor
  -> shared/mock-api/mockAuthApi.ts or backend
  -> AuthContext session storage
  -> shell/src/routing/ProtectedRoute.tsx
```

## Add or update an API call

1. Confirm the endpoint and request/response shape with the backend contract.
2. Add or update the feature API module under `shared/api/` (or the MFE's existing API module where it is intentionally feature-local).
3. Use the shared `apiClient` from `shared/api-client`; do not create another Axios instance or add `Authorization` manually.
4. Add/update mock behavior in `shared/mock-api/mockAdapter.ts` and its supporting mock modules when local development needs the endpoint.
5. Add or update a test for the API behavior.
6. Connect the UI component and represent loading/error states using the established UI patterns.

## Trace UI styling

```text
React component -> className -> SCSS selector -> shared token/mixin
```

The shared SCSS entry is `shared/design-system/styles/index.scss`; application-wide styles, including feature styles that must be available consistently across shell and microfrontend entry points, belong in `shared/design-system/styles/` and should be registered there. Keep styles that are intentionally isolated to a single MFE in that MFE's `.scss` files. Reusable components are exported from `shared/design-system/components/index.ts`. Do not use inline styles for normal application styling or add CSS files/CSS Modules/CSS-in-JS.

### Shared AG Grid

Use `DataGrid` from `shared/design-system/components` for AG Grid tables. Pass `rowData` and `columnDefs` as props; the component applies the shared Quartz theme, community modules, and default resizable, sortable, filterable columns. Override `defaultColDef` or pass standard AG Grid props when a particular grid needs different behavior. Global grid styling lives in `shared/design-system/styles/_ag-grid.scss`.

```tsx
import { DataGrid, type ColDef } from '../../../shared/design-system/components';

const columns: ColDef<Study>[] = [
  { field: 'protocolId', headerName: 'Protocol ID' },
  { field: 'title', headerName: 'Study Title', flex: 1 },
];

<DataGrid rowData={studies} columnDefs={columns} pagination />
```

## Shared services

- API configuration and client: `shared/api-config.ts`, `shared/api-client/index.ts`, `shared/api/`
- Mock backend: `shared/mock-api/`
- Auth and protected routes: `shell/src/auth/AuthContext.tsx`, `shell/src/routing/ProtectedRoute.tsx`
- Runtime settings: `shared/runtime-config/index.ts`, `shell/public/runtime-config.json`
- Confirmation: `shared/confirmation/`
- Toast notifications: `shared/toaster/`
- Telemetry: `shared/telemetry/`
- Design system: `shared/design-system/components/`, `shared/design-system/styles/`
- Remote metadata and module loading: `shell/src/remotes/`, `shell/src/modules/index.tsx`

The shell keeps `TopNavigation` as its only workspace header. The **HOME** item uses a home icon and opens the executive dashboard at `/dashboard`. The client-facing module labels map `admin` to **SITE ADMIN** (`/admin`), `participants` to **REGISTRY** (`/participants`), and `communications` to **SUPPORT** (`/communications`). Clicking each label activates the corresponding workspace tab and route. Other module entries and the AI shortcut are temporarily commented out of navigation; their routes and MFE implementations remain. Account and sign-out controls remain in the same top navigation.


## Check whether code or an asset is safe to remove

1. Search all source, tests, package exports, and consumers for references.
2. Check dynamic imports, MFE registrations, and public package exports.
3. Check runtime configuration and remote definitions.
4. For public assets, search HTML, CSS/SCSS `url()`, manifests, and URL strings.
5. Check tests and package build/distribution references.
6. Run typecheck, tests, and production build after a cleanup.

Never infer that an asset is unused only because there is no TypeScript import. Check public URLs and build configuration first. The shell's `packages/administrator-ui/dist/` file dependency is a distribution artifact; retain it unless its package contract changes.

## Validation commands

Run from the frontend workspace root:

```bash
npm test
npm run typecheck
npm run build
```

Additional useful source checks include searching for inline `style=`, application-owned `.css`/`.module.css`, old service-port URLs, duplicate Axios clients, dead comments, and public asset references. `npm run typecheck` currently invokes each workspace's configured TypeScript check; a temporary `--noUnusedLocals --noUnusedParameters` scan can reveal candidates without changing production compiler settings.
