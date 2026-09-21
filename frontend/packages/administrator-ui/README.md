# @aiventrahealth/administrator-ui

Production-grade, reusable enterprise System Administration & RBAC frontend package for AiventraHealth HMIS, healthcare ecosystems, and independent enterprise applications (HR, Finance, Operations, Corporate Portals).

---

## 1. What This Package Is

`@aiventrahealth/administrator-ui` provides a self-contained, fully configurable, modern administration interface for:
- **Administrative Dashboard & KPIs** (User statistics, role distribution, facility/office access, recent security activity).
- **User Management** (Authentication accounts, activation/deactivation, password resets, facility assignments, dynamic multi-role assignment with validity dates).
- **Dynamic Roles & Permission Matrix** (Granular screen and action-level permissions: View, Create, Edit, Delete, Export across hierarchical application modules).
- **Optional Provider Mapping** (Authoritative binding of user accounts to clinical Doctor/Provider master records — toggleable per application).
- **Optional Multi-Facility Location Scopes** (Configurable multi-facility or multi-site permissions — toggleable per application).
- **Security Audit Ledger** (Tamper-evident logs of administrative actions and security events).

---

## 2. Multi-Project Adaptability & Architectural Isolation

The package is designed with **zero hardcoded dependencies on HMIS backend structures**:
- **Explicit Feature Toggles**: Features like `providerMapping` and `locationAccess` are strictly opt-in. When disabled, their tabs, KPI cards, form fields, table columns, and API calls are completely removed.
- **Configurable Terminology**: The UI labels dynamically adapt (e.g. "Doctor" vs "Clinical Provider" vs "Account Executive", or "Hospital Facility" vs "Branch Office").
- **Configurable Provider Roles**: Provider-eligibility is configured via `config.providerRoleCodes` or custom predicate rather than hardcoding `ROLE_DOCTOR`.
- **Pure Client Contract**: The package does NOT make HTTP requests or hold Axios/Fetch instances. Host applications provide API and Auth adapters conforming to TypeScript interfaces.

---

## 3. Host Integration Examples

### Scenario A: AiventraHealth HMIS (Healthcare Application)

In HMIS, provider mapping and location scoping are enabled, and terminology is set to "Doctor":

```tsx
import React, { useMemo } from 'react';
import {
  AdministratorProvider,
  Administrator,
  AdministratorConfig,
} from '@aiventrahealth/administrator-ui';
import { hmisAdministratorApi } from './adapters/hmisAdministratorApi';
import { createHmisAdministratorAuthAdapter } from './adapters/hmisAdministratorAuthAdapter';
import { useAuth } from './contexts/AuthContext';

export const HmisAdminPage: React.FC = () => {
  const auth = useAuth();
  const authAdapter = useMemo(() => createHmisAdministratorAuthAdapter(auth), [auth]);

  const config: AdministratorConfig = {
    title: 'Hospital System Administration',
    subtitle: 'Centralized identity, role assignments, doctor mapping, facility scopes, and security audit logs.',
    features: {
      dashboard: true,
      users: true,
      roles: true,
      providerMapping: true, // Enabled for HMIS
      locationAccess: true,  // Enabled for HMIS
      auditTrail: true,
    },
    terminology: {
      provider: 'Doctor',
      providers: 'Doctors',
      providerCode: 'Doctor Code',
      location: 'Hospital Facility',
      locations: 'Hospital Facilities',
    },
    providerRoleCodes: ['ROLE_DOCTOR', 'DOCTOR'],
  };

  return (
    <AdministratorProvider api={hmisAdministratorApi} auth={authAdapter} config={config}>
      <Administrator />
    </AdministratorProvider>
  );
};
```

---

### Scenario B: Non-Healthcare Corporate Application (HR / Finance)

In an HR or Finance portal, provider mapping and facility access are disabled. The host adapter only needs to implement core user and role methods — no doctor or location APIs required:

```tsx
import React from 'react';
import {
  AdministratorProvider,
  Administrator,
  AdministratorConfig,
} from '@aiventrahealth/administrator-ui';
import { corporateApiAdapter } from './adapters/corporateApiAdapter';
import { corporateAuthAdapter } from './adapters/corporateAuthAdapter';

export const CorporateAdminPage: React.FC = () => {
  const config: AdministratorConfig = {
    title: 'Enterprise Identity & Access Management',
    subtitle: 'Manage company employee logins and access control roles.',
    features: {
      dashboard: true,
      users: true,
      roles: true,
      providerMapping: false, // Disabled: No provider tabs, columns, or API calls
      locationAccess: false,  // Disabled: No facility tabs or location filters
      auditTrail: false,
    },
  };

  return (
    <AdministratorProvider api={corporateApiAdapter} auth={corporateAuthAdapter} config={config}>
      <Administrator />
    </AdministratorProvider>
  );
};
```

---

## 4. Configuration Reference

```typescript
export interface AdministratorConfig {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  features?: AdministratorFeaturesConfig;
  terminology?: AdministratorTerminologyConfig;
  providerRoleCodes?: string[];
  isProviderRole?: (roleCode: string) => boolean;
}

export interface AdministratorFeaturesConfig {
  dashboard?: boolean;       // default: true
  users?: boolean;           // default: true
  roles?: boolean;           // default: true
  providerMapping?: boolean; // default: false (opt-in)
  locationAccess?: boolean;  // default: false (opt-in)
  auditTrail?: boolean;      // default: false (opt-in)
}

export interface AdministratorTerminologyConfig {
  provider?: string;         // default: 'Provider'
  providers?: string;        // default: 'Providers'
  providerCode?: string;     // default: 'Provider Code'
  location?: string;         // default: 'Location'
  locations?: string;        // default: 'Locations'
}
```

---

## 5. Peer Dependencies

Ensure the host application provides React 18 and MUI v5:

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0"
  }
}
```

---

## 6. Building and Packaging

```bash
# Type check and build package bundle (.js + .d.ts)
npm run build

# Run multi-project architectural simulation tests
node verify-simulation.mjs

# Pack package into a distributable .tgz archive
npm pack
```
