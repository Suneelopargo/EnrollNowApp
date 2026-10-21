// frontend/microfrontends/administration/src/components/SiteAdminViews.tsx - Sub-views for Site Administration Dashboard
import React from 'react';
import { BookOpen, Upload, Download, Shield } from 'lucide-react';
import { ExportSubOption } from '../types/admin';
import { ComingSoon } from '../../../../shared/design-system/components/ComingSoon';

// ---------------------------------------------------------------------------
// Studies View
// ---------------------------------------------------------------------------
export const StudiesView: React.FC = () => {
  return (
    <ComingSoon
      title="Site Studies Configuration"
      subtitle="Clinical trial allocations, coordinator role assignments, and protocol milestone coordination"
      description="Site study management workflows are currently scheduled for upcoming Sprint deployment. Live study protocols are accessible from the top navigation Studies workspace."
      targetRelease="Scheduled Sprint Release"
      icon={BookOpen}
    />
  );
};

// ---------------------------------------------------------------------------
// Import View
// ---------------------------------------------------------------------------
export const ImportView: React.FC = () => {
  return (
    <ComingSoon
      title="Data Intake & Batch Import"
      subtitle="Bulk provisioning of site accounts, clinical protocol parameters, and participant screening data"
      description="Batch data intake capabilities via CSV/Excel are in active development. No simulated import actions are performed without an active backend endpoint."
      targetRelease="Scheduled Sprint Release"
      icon={Upload}
    />
  );
};

// ---------------------------------------------------------------------------
// Export View
// ---------------------------------------------------------------------------
export interface ExportViewProps {
  selectedSubOption?: ExportSubOption;
}

export const ExportView: React.FC<ExportViewProps> = () => {
  return (
    <ComingSoon
      title="Export Configurations & Compliance Artifacts"
      subtitle="Automated regulatory packages, customized PHI de-identification filters, and shared data archives"
      description="Scheduled data delivery and export pipeline configurations are in active development. No simulated archive downloads or fake records are presented."
      targetRelease="Scheduled Sprint Release"
      icon={Download}
    />
  );
};

// ---------------------------------------------------------------------------
// Audit Log View
// ---------------------------------------------------------------------------
export const AuditLogView: React.FC = () => {
  return (
    <ComingSoon
      title="System & Security Audit Ledger"
      subtitle="Tamper-evident logs of administrative access, user role modifications, and authentication events"
      description="21 CFR Part 11 compliant audit trail aggregation is in active development. No fabricated security log records are displayed."
      targetRelease="Scheduled Sprint Release"
      icon={Shield}
    />
  );
};

// ---------------------------------------------------------------------------
// Security View
// ---------------------------------------------------------------------------
export { SecurityView } from './SecurityView';
export type { SecurityViewProps } from './SecurityView';

// ---------------------------------------------------------------------------
// General Settings View
// ---------------------------------------------------------------------------
export { GeneralSettingsView } from './GeneralSettingsView';
export type { GeneralSettingsViewProps } from './GeneralSettingsView';
