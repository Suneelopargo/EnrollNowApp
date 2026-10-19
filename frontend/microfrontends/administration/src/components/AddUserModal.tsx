// frontend/microfrontends/administration/src/components/AddUserModal.tsx - Add/Edit User Modal
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Plus, Send, KeyRound, Lock } from 'lucide-react';
import {
  validateField,
  validateForm,
  validators,
} from '../../../../shared/design-system/validation';
import { SiteAdminUser } from '../types/admin';
import { requestConfirmation } from '../../../../shared/confirmation';
import { toast } from '../../../../shared/toaster';
import {
  toStudyPermissionLabel,
  toSitePermissionLabel,
  ROLE_CODE_TO_STUDY_PERMISSION,
  RoleResponse,
} from '../../../../shared/api/administrationApi';

export interface AvailableStudy {
  id: string;
  name: string;
  studyCode?: string;
  description?: string;
}

export interface RoleOption {
  code: string;
  name: string;
  scopeType?: string;
  description?: string | null;
  [key: string]: any;
}

export const DEFAULT_SITE_ROLES: RoleOption[] = [
  { code: 'SITE_REGISTRY', name: 'Registry Access', scopeType: 'SITE' },
  { code: 'SITE_MANAGER', name: 'Site Manager', scopeType: 'SITE' },
  { code: 'SITE_ADMIN', name: 'Site Admin', scopeType: 'SITE' },
];

export const DEFAULT_STUDY_ROLES: RoleOption[] = [
  { code: 'STUDY_ADMIN', name: 'Study Admin', scopeType: 'STUDY' },
  { code: 'STUDY_LEADER', name: 'Study Leader', scopeType: 'STUDY' },
  { code: 'STUDY_RA', name: 'Study Restricted Access', scopeType: 'STUDY' },
  { code: 'STUDY_READ_ONLY', name: 'Study Read-Only', scopeType: 'STUDY' },
];

export interface StudyAssignmentState {
  studyId: string;
  studyName: string;
  assigned: boolean;
  permissions: string;
}

export interface UserFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  sitePermissions?: string;
  assignedStudies: Array<{ studyId: string; studyName: string; permission: string }>;
  unassignedStudies: Array<{ studyId: string; studyName: string }>;
}

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: UserFormData) => Promise<void> | void;
  userToEdit?: SiteAdminUser | null;
  availableStudies?: AvailableStudy[];
  siteRoles?: RoleOption[] | RoleResponse[];
  studyRoles?: RoleOption[] | RoleResponse[];
  onLockUser?: (user: SiteAdminUser) => Promise<void> | void;
  onUnlockUser?: (user: SiteAdminUser) => Promise<void> | void;
  onResendEnrollment?: (user: SiteAdminUser) => Promise<void> | void;
  onResetPassword?: (user: SiteAdminUser) => Promise<void> | void;
}

const FORM_VALIDATION_SCHEMA = {
  firstName: [validators.required('First Name'), validators.personName('First Name')],
  lastName: [validators.required('Last Name'), validators.personName('Last Name')],
  email: [validators.required('Email'), validators.email('Email')],
};

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  availableStudies,
  siteRoles,
  studyRoles,
  onLockUser,
  onUnlockUser,
  onResendEnrollment,
  onResetPassword,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [sitePermissions, setSitePermissions] = useState('None');
  const [studyRows, setStudyRows] = useState<StudyAssignmentState[]>([]);

  const resolvedSiteRoles: RoleOption[] =
    siteRoles && siteRoles.length > 0 ? siteRoles : DEFAULT_SITE_ROLES;

  const resolvedStudyRoles: RoleOption[] =
    studyRoles && studyRoles.length > 0 ? studyRoles : DEFAULT_STUDY_ROLES;

  const studyPermissionOptions = resolvedStudyRoles.map((r) => ({
    code: r.code,
    label: ROLE_CODE_TO_STUDY_PERMISSION[r.code] || r.name,
    name: r.name,
  }));

  const selectedSitePermissionValue = useMemo(() => {
    if (!sitePermissions || sitePermissions === 'NONE' || sitePermissions === 'None') {
      return 'None';
    }
    const match = resolvedSiteRoles.find(
      (r) =>
        r.code.toUpperCase() === sitePermissions.toUpperCase() ||
        r.name.toLowerCase() === sitePermissions.toLowerCase()
    );
    return match ? match.name : toSitePermissionLabel(sitePermissions);
  }, [sitePermissions, resolvedSiteRoles]);

  // Field-level error state
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({});

  // Field-level touched state
  const [touched, setTouched] = useState<{
    firstName?: boolean;
    lastName?: boolean;
    email?: boolean;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
    const studyList = Array.isArray(availableStudies) ? availableStudies : [];

    if (userToEdit) {
      const parts = (userToEdit.name || '').trim().split(/\s+/);
      setFirstName(parts[0] || userToEdit.firstName || '');
      setLastName(parts.slice(1).join(' ') || userToEdit.lastName || '');
      setEmail(userToEdit.email || '');

      const rawSite = userToEdit.sitePermissionCode || userToEdit.sitePermissions;
      const resolvedLabel = toSitePermissionLabel(rawSite);
      const matchedRole = resolvedSiteRoles.find(
        (r) =>
          (rawSite && r.code.toUpperCase() === String(rawSite).toUpperCase()) ||
          (rawSite && r.name.toLowerCase() === String(rawSite).toLowerCase()) ||
          (resolvedLabel && r.name.toLowerCase() === resolvedLabel.toLowerCase())
      );
      setSitePermissions(matchedRole ? matchedRole.name : (resolvedLabel || 'None'));

      const assignmentsByStudyId = new Map<string, { role?: string | null; permission?: string | null }>();
      const assignmentsByStudyName = new Map<string, { role?: string | null; permission?: string | null }>();
      if (userToEdit.studyAssignments) {
        for (const sa of userToEdit.studyAssignments) {
          assignmentsByStudyId.set(sa.id, { role: sa.studyRole, permission: sa.studyPermission });
          assignmentsByStudyName.set(sa.name, { role: sa.studyRole, permission: sa.studyPermission });
        }
      }
      const assignedNameSet = new Set(userToEdit.studies || []);

      setStudyRows(
        studyList.map((study) => {
          const match = assignmentsByStudyId.get(study.id) || assignmentsByStudyName.get(study.name);
          const isAssigned = !!match || assignedNameSet.has(study.name);
          const rawPerm = match?.permission;
          const uiPerm = rawPerm ? toStudyPermissionLabel(rawPerm) : 'Admin';
          return {
            studyId: study.id,
            studyName: study.name,
            assigned: isAssigned,
            permissions: uiPerm,
          };
        })
      );
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setSitePermissions('None');
      setStudyRows(
        studyList.map((study) => ({
          studyId: study.id,
          studyName: study.name,
          assigned: false,
          permissions: 'Admin',
        }))
      );
    }
    setErrors({});
    setTouched({});
  }, [userToEdit, isOpen, availableStudies]);

  // Field-level validation on blur
  const handleBlur = useCallback(
    (field: 'firstName' | 'lastName' | 'email') => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const valueMap = { firstName, lastName, email };
      const fieldError = validateField(valueMap[field], FORM_VALIDATION_SCHEMA[field]);
      setErrors((prev) => ({ ...prev, [field]: fieldError || undefined }));
    },
    [firstName, lastName, email]
  );

  // Field-level validation on change
  const handleChange = (
    field: 'firstName' | 'lastName' | 'email',
    val: string,
    setter: (v: string) => void
  ) => {
    setter(val);
    if (touched[field]) {
      const fieldError = validateField(val, FORM_VALIDATION_SCHEMA[field]);
      setErrors((prev) => ({ ...prev, [field]: fieldError || undefined }));
    }
  };

  const handleToggleStudy = (index: number) => {
    setStudyRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        return {
          ...row,
          assigned: !row.assigned,
        };
      })
    );
  };

  const handleToggleAll = () => {
    const allChecked = studyRows.every((r) => r.assigned);
    setStudyRows((prev) =>
      prev.map((row) => ({
        ...row,
        assigned: !allChecked,
      }))
    );
  };

  const handlePermissionChange = (index: number, permissions: string) => {
    setStudyRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, permissions } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!isEditMode) {
      // Mark all as touched on submit
      setTouched({ firstName: true, lastName: true, email: true });

      // Validate form against schema
      const validationErrors = validateForm(
        { firstName, lastName, email },
        FORM_VALIDATION_SCHEMA
      );

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    const assigned = studyRows
      .filter((r) => r.assigned)
      .map((r) => ({
        studyId: r.studyId,
        studyName: r.studyName,
        permission: r.permissions || 'Admin',
      }));

    const unassigned = studyRows
      .filter((r) => !r.assigned)
      .map((r) => ({
        studyId: r.studyId,
        studyName: r.studyName,
      }));

    setIsSubmitting(true);
    try {
      await onSave({
        ...(userToEdit ? { id: userToEdit.id } : {}),
        firstName: (firstName || userToEdit?.firstName || '').trim(),
        lastName: (lastName || userToEdit?.lastName || '').trim(),
        email: (email || userToEdit?.email || '').trim(),
        sitePermissions: selectedSitePermissionValue,
        assignedStudies: assigned,
        unassignedStudies: unassigned,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAssigned = studyRows.length > 0 && studyRows.every((r) => r.assigned);

  const handleLockAccount = () => {
    if (!userToEdit) return;
    void requestConfirmation({
      intent: 'danger',
      title: `Temporarily Lock User: ${userToEdit.name}`,
      confirmText: 'Lock User',
      cancelText: 'Cancel',
      loadingText: 'Locking user...',
      message:
        "A locked account won't be able to log in until it is manually unlocked. Only an admin will be able to unlock the user later. Are you sure you want to proceed?",
      onConfirm: async () => {
        if (onLockUser) {
          await onLockUser(userToEdit);
        }
      },
    });
  };

  const handleUnlockAccount = () => {
    if (!userToEdit) return;
    void requestConfirmation({
      intent: 'danger',
      title: `Unlock User: ${userToEdit.name}`,
      confirmText: 'Unlock User',
      cancelText: 'Cancel',
      loadingText: 'Unlocking user...',
      message:
        'The user will be able to login again. Are you sure you want to proceed?',
      onConfirm: async () => {
        if (onUnlockUser) {
          await onUnlockUser(userToEdit);
        }
      },
    });
  };

  const handleResendEnrollment = async () => {
    if (!userToEdit) return;
    if (onResendEnrollment) {
      await onResendEnrollment(userToEdit);
    }
  };

  const handleResetPassword = () => {
    if (!userToEdit) return;
    void requestConfirmation({
      title: `Reset Password for: ${userToEdit.name}`,
      intent: 'danger',
      confirmText: 'Reset Password',
      cancelText: 'Cancel',
      loadingText: 'Resetting password...',
      message:
        "The user's current password will expire immediately. The user will receive an email with a link to reset his or her password. Are you sure you want to proceed?",
      onConfirm: async () => {
        if (onResetPassword) {
          await onResetPassword(userToEdit);
        }
      },
    });
  };

  const isEditMode = !!userToEdit;
  const isUserDisabled = userToEdit?.status === 'Inactive';

  const modalFooter = isEditMode ? (
    <div className="site-admin-modal-footer-edit">
      <button
        type="button"
        className="btn site-admin-btn-save"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
      </button>

      <button
        type="button"
        className="btn site-admin-btn-resend"
        onClick={handleResendEnrollment}
        disabled={isSubmitting}
      >
        <Send size={15} aria-hidden="true" />
        <span>Resend Enrollment Email</span>
      </button>

      <button
        type="button"
        className="btn site-admin-btn-reset-pw"
        onClick={handleResetPassword}
        disabled={isSubmitting}
      >
        <KeyRound size={15} aria-hidden="true" />
        <span>Reset Password</span>
      </button>

      {isUserDisabled ? (
        <button
          type="button"
          className="btn site-admin-btn-unlock"
          onClick={handleUnlockAccount}
          disabled={isSubmitting}
        >
          <Lock size={15} aria-hidden="true" />
          <span>Unlock Account</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn site-admin-btn-lock"
          onClick={handleLockAccount}
          disabled={isSubmitting}
        >
          <Lock size={15} aria-hidden="true" />
          <span>Lock Account</span>
        </button>
      )}
    </div>
  ) : (
    <div className="site-admin-modal-footer-add">
      <button
        type="button"
        className="btn btn-primary site-admin-btn-send-invitation"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        <span>{isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}</span>
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
        disabled={isSubmitting}
      >
        <span>Cancel</span>
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit ${userToEdit?.name} User` : 'Add User'}
      footer={modalFooter}
      className="site-admin-add-user-modal"
    >
      <form onSubmit={handleSubmit} className="site-admin-modal-form" noValidate>
        {isEditMode ? (
          /* Edit User Mode Field Layout: First Name, Last Name, Email (Static), Site Permissions */
          <div className="site-admin-form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-first-name">
                First Name <span className="form-required-marker" aria-hidden="true">*</span>
              </label>
              <input
                id="site-admin-first-name"
                type="text"
                placeholder={errors.firstName || 'Enter First Name'}
                className="form-input"
                value={firstName}
                onChange={(e) => handleChange('firstName', e.target.value, setFirstName)}
                onBlur={() => handleBlur('firstName')}
                aria-invalid={!!errors.firstName}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-last-name">
                Last Name <span className="form-required-marker" aria-hidden="true">*</span>
              </label>
              <input
                id="site-admin-last-name"
                type="text"
                placeholder={errors.lastName || 'Enter Last Name'}
                className="form-input"
                value={lastName}
                onChange={(e) => handleChange('lastName', e.target.value, setLastName)}
                onBlur={() => handleBlur('lastName')}
                aria-invalid={!!errors.lastName}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-email-static">
                Email <small className="text-muted">(Immutable per contract)</small>
              </label>
              <input
                id="site-admin-email-static"
                type="email"
                className="form-input"
                value={email}
                disabled
                readOnly
                title="Email is not mutable through the backend user update API"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-site-permissions">
                Site Permissions
              </label>
              <select
                id="site-admin-site-permissions"
                className="form-select"
                value={selectedSitePermissionValue}
                onChange={(e) => setSitePermissions(e.target.value)}
                aria-label="Site Permissions"
              >
                <option value="None">None</option>
                {resolvedSiteRoles.map((role) => (
                  <option key={role.code} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Add User Mode: First Name, Last Name, Email, Site Permissions */
          <div className="site-admin-form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-first-name">
                First Name <span className="form-required-marker" aria-hidden="true">*</span>
              </label>
              <input
                id="site-admin-first-name"
                type="text"
                placeholder={errors.firstName || 'Enter First Name'}
                className="form-input"
                value={firstName}
                onChange={(e) => handleChange('firstName', e.target.value, setFirstName)}
                onBlur={() => handleBlur('firstName')}
                aria-invalid={!!errors.firstName}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-last-name">
                Last Name <span className="form-required-marker" aria-hidden="true">*</span>
              </label>
              <input
                id="site-admin-last-name"
                type="text"
                placeholder={errors.lastName || 'Enter Last Name'}
                className="form-input"
                value={lastName}
                onChange={(e) => handleChange('lastName', e.target.value, setLastName)}
                onBlur={() => handleBlur('lastName')}
                aria-invalid={!!errors.lastName}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-email">
                Email <span className="form-required-marker" aria-hidden="true">*</span>
              </label>
              <input
                id="site-admin-email"
                type="email"
                placeholder={errors.email || 'Enter Email'}
                className="form-input"
                value={email}
                onChange={(e) => handleChange('email', e.target.value, setEmail)}
                onBlur={() => handleBlur('email')}
                aria-invalid={!!errors.email}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-site-permissions">
                Site Permissions
              </label>
              <select
                id="site-admin-site-permissions"
                className="form-select"
                value={selectedSitePermissionValue}
                onChange={(e) => setSitePermissions(e.target.value)}
                aria-label="Site Permissions"
              >
                <option value="None">None</option>
                {resolvedSiteRoles.map((role) => (
                  <option key={role.code} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Studies Table Box with blue left accent border & dark blue table header */}
        <div className="site-admin-studies-frame">
          <div className="site-admin-studies-scroll">
            <table className="site-admin-studies-table">
              <thead>
                <tr>
                  <th className="site-admin-studies-th-checkbox">
                    <input
                      type="checkbox"
                      checked={allAssigned}
                      onChange={handleToggleAll}
                      className="site-admin-study-checkbox"
                      aria-label="Select or deselect all studies"
                    />
                  </th>
                  <th>Study Name</th>
                  <th>Study Permissions</th>
                </tr>
              </thead>
              <tbody>
                {studyRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      No studies configured for this site.
                    </td>
                  </tr>
                ) : (
                  studyRows.map((row, idx) => (
                    <tr key={row.studyId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.assigned}
                        onChange={() => handleToggleStudy(idx)}
                        className="site-admin-study-checkbox"
                        aria-label={`Assign study ${row.studyName}`}
                      />
                    </td>
                    <td>{row.studyName}</td>
                    <td>
                      {row.assigned ? (
                        <select
                          className="site-admin-study-select"
                          value={row.permissions || 'Admin'}
                          onChange={(e) => handlePermissionChange(idx, e.target.value)}
                          aria-label={`Study permissions for ${row.studyName}`}
                        >
                          {studyPermissionOptions.map((opt) => (
                            <option key={opt.code || opt.label} value={opt.label || opt.name}>
                              {opt.label || opt.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
