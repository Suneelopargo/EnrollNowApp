// frontend/microfrontends/administration/src/components/AddUserModal.tsx - Add/Edit User Modal
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  normalizeSiteRoleCode,
  ROLE_CODE_TO_STUDY_PERMISSION,
  ROLE_CODE_TO_SITE_PERMISSION,
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
  loadingStudies?: boolean;
  siteRoles?: RoleOption[] | RoleResponse[];
  studyRoles?: RoleOption[] | RoleResponse[];
  canManageSiteAdmins?: boolean;
  currentUserId?: string | number | null;
  currentUserEmail?: string | null;
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

const SITE_ROLE_SORT_ORDER: Record<string, number> = {
  SITE_ADMIN: 1,
  SITE_MANAGER: 2,
  SITE_REGISTRY: 3,
};

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  availableStudies,
  loadingStudies = false,
  siteRoles,
  studyRoles,
  canManageSiteAdmins = true,
  currentUserId,
  currentUserEmail,
  onLockUser,
  onUnlockUser,
  onResendEnrollment,
  onResetPassword,
}) => {
  const resolvedSiteRoles: RoleOption[] =
    siteRoles && siteRoles.length > 0 ? siteRoles : [];

  const resolvedStudyRoles: RoleOption[] =
    studyRoles && studyRoles.length > 0 ? studyRoles : [];

  const [firstName, setFirstName] = useState(() => {
    if (!userToEdit) return '';
    const parts = (userToEdit.name || '').trim().split(/\s+/);
    return parts[0] || userToEdit.firstName || '';
  });
  const [lastName, setLastName] = useState(() => {
    if (!userToEdit) return '';
    const parts = (userToEdit.name || '').trim().split(/\s+/);
    return parts.slice(1).join(' ') || userToEdit.lastName || '';
  });
  const [email, setEmail] = useState(() => userToEdit?.email || '');
  const [sitePermissions, setSitePermissions] = useState<string>(() => {
    if (!userToEdit) return 'None';
    const rawSite = userToEdit.sitePermissionCode || userToEdit.sitePermissions;
    return toSitePermissionLabel(rawSite) || 'None';
  });
  const [studyRows, setStudyRows] = useState<StudyAssignmentState[]>(() => {
    if (!isOpen) return [];
    const studyList = Array.isArray(availableStudies) ? availableStudies : [];
    if (userToEdit) {
      const assignmentsByStudyId = new Map<string, { role?: string | null; permission?: string | null }>();
      const assignmentsByStudyName = new Map<string, { role?: string | null; permission?: string | null }>();
      if (Array.isArray(userToEdit.studyAssignments)) {
        for (const sa of userToEdit.studyAssignments) {
          assignmentsByStudyId.set(sa.id, { role: sa.studyRole, permission: sa.studyPermission });
          assignmentsByStudyName.set(sa.name, { role: sa.studyRole, permission: sa.studyPermission });
        }
      }
      const assignedNameSet = new Set(userToEdit.studies || []);
      return studyList.map((study) => {
        const match = assignmentsByStudyId.get(study.id) || assignmentsByStudyName.get(study.name);
        const isAssigned = !!match || assignedNameSet.has(study.name);
        const rawPerm = match?.permission;
        const uiPerm = rawPerm ? toStudyPermissionLabel(rawPerm) : 'RA';
        return {
          studyId: study.id,
          studyName: study.name,
          assigned: isAssigned,
          permissions: uiPerm,
        };
      });
    }
    return studyList.map((study) => ({
      studyId: study.id,
      studyName: study.name,
      assigned: false,
      permissions: 'RA',
    }));
  });

  const sitePermissionOptions = useMemo(() => {
    return [...resolvedSiteRoles]
      .sort(
        (a, b) =>
          (SITE_ROLE_SORT_ORDER[a.code?.toUpperCase()] ?? 99) -
          (SITE_ROLE_SORT_ORDER[b.code?.toUpperCase()] ?? 99)
      )
      .map((r) => ({
        code: r.code,
        label:
          ROLE_CODE_TO_SITE_PERMISSION[r.code?.toUpperCase()] ||
          toSitePermissionLabel(r.code || r.name),
        name: r.name,
      }));
  }, [resolvedSiteRoles]);

  const studyPermissionOptions =
    resolvedStudyRoles.length > 0
      ? resolvedStudyRoles.map((r) => ({
          code: r.code,
          label: ROLE_CODE_TO_STUDY_PERMISSION[r.code] || r.name,
          name: r.name,
        }))
      : [
          { code: 'STUDY_RA', label: 'RA', name: 'RA' },
          { code: 'STUDY_LEADER', label: 'Leader', name: 'Leader' },
          { code: 'STUDY_ADMIN', label: 'Admin', name: 'Admin' },
          { code: 'STUDY_READ_ONLY', label: 'Read Only', name: 'Read Only' },
        ];

  const targetEditingSiteRoleCode = useMemo(() => {
    if (!userToEdit) return 'NONE';
    return normalizeSiteRoleCode(userToEdit.sitePermissionCode || userToEdit.sitePermissions);
  }, [userToEdit]);

  const isEditingSelf = useMemo(() => {
    if (!userToEdit) return false;
    if (currentUserId && String(userToEdit.id) === String(currentUserId)) {
      return true;
    }
    if (
      currentUserEmail &&
      userToEdit.email &&
      userToEdit.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase()
    ) {
      return true;
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('enrollnow_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id && String(userToEdit.id) === String(parsed.id)) return true;
          if (
            parsed?.email &&
            userToEdit.email &&
            userToEdit.email.trim().toLowerCase() === parsed.email.trim().toLowerCase()
          ) {
            return true;
          }
        }
      } catch {
        // ignore
      }
    }
    return false;
  }, [userToEdit, currentUserId, currentUserEmail]);

  const isSitePermissionSelectDisabled =
    Boolean(userToEdit) &&
    (isEditingSelf || (!canManageSiteAdmins && targetEditingSiteRoleCode === 'SITE_ADMIN'));

  const selectedSitePermissionValue = useMemo(() => {
    if (!sitePermissions || sitePermissions === 'NONE' || sitePermissions === 'None') {
      return 'None';
    }
    const canonicalLabel = toSitePermissionLabel(sitePermissions);
    const match = sitePermissionOptions.find(
      (r) =>
        r.code.toUpperCase() === sitePermissions.toUpperCase() ||
        r.label.toLowerCase() === canonicalLabel.toLowerCase() ||
        r.name.toLowerCase() === sitePermissions.toLowerCase()
    );
    return match ? match.label : canonicalLabel;
  }, [sitePermissions, sitePermissionOptions]);

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
  const prevIsOpenRef = useRef(false);
  const prevUserToEditIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      prevUserToEditIdRef.current = undefined;
      setFirstName('');
      setLastName('');
      setEmail('');
      setSitePermissions('None');
      setStudyRows([]);
      setErrors({});
      setTouched({});
      return;
    }

    const currentUserId = userToEdit ? userToEdit.id : null;
    const isModalOpeningOrSwitchingMode =
      !prevIsOpenRef.current || prevUserToEditIdRef.current !== currentUserId;

    prevIsOpenRef.current = true;
    prevUserToEditIdRef.current = currentUserId;

    setIsSubmitting(false);
    const studyList = Array.isArray(availableStudies) ? availableStudies : [];

    if (isModalOpeningOrSwitchingMode) {
      if (userToEdit) {
        const parts = (userToEdit.name || '').trim().split(/\s+/);
        setFirstName(parts[0] || userToEdit.firstName || '');
        setLastName(parts.slice(1).join(' ') || userToEdit.lastName || '');
        setEmail(userToEdit.email || '');

        const rawSite = userToEdit.sitePermissionCode || userToEdit.sitePermissions;
        const resolvedLabel = toSitePermissionLabel(rawSite);
        setSitePermissions(resolvedLabel || 'None');
      } else {
        setFirstName('');
        setLastName('');
        setEmail('');
        setSitePermissions('None');
      }
      setErrors({});
      setTouched({});
    }

    if (userToEdit) {
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
          const uiPerm = rawPerm ? toStudyPermissionLabel(rawPerm) : 'RA';
          return {
            studyId: study.id,
            studyName: study.name,
            assigned: isAssigned,
            permissions: uiPerm,
          };
        })
      );
    } else {
      // In Add User mode: if fresh opening or switching mode, all studies must be unassigned
      if (isModalOpeningOrSwitchingMode) {
        setStudyRows(
          studyList.map((study) => ({
            studyId: study.id,
            studyName: study.name,
            assigned: false,
            permissions: 'RA',
          }))
        );
      } else {
        setStudyRows((prevRows) => {
          const prevMap = new Map(prevRows.map((r) => [r.studyId, r]));
          return studyList.map((study) => {
            const existing = prevMap.get(study.id);
            return {
              studyId: study.id,
              studyName: study.name,
              assigned: existing ? existing.assigned : false,
              permissions: existing ? (existing.permissions || 'RA') : 'RA',
            };
          });
        });
      }
    }
  }, [userToEdit, isOpen, availableStudies, resolvedSiteRoles]);

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
        const willBeAssigned = !row.assigned;
        if (!willBeAssigned) {
          toast.warning(
            `The user will be unassigned from all tasks, events, and sites in ${row.studyName}.`
          );
        }
        return {
          ...row,
          assigned: willBeAssigned,
          permissions: row.permissions || 'RA',
        };
      })
    );
  };

  const handleToggleAll = () => {
    const allChecked = studyRows.every((r) => r.assigned);
    if (allChecked) {
      studyRows.forEach((row) => {
        if (row.assigned) {
          toast.warning(
            `The user will be unassigned from all tasks, events, and sites in ${row.studyName}.`
          );
        }
      });
    }
    setStudyRows((prev) =>
      prev.map((row) => ({
        ...row,
        assigned: !allChecked,
        permissions: row.permissions || 'RA',
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
        // Move focus to first invalid field per WCAG 2.4.3 Focus Order & 3.3.1 Error Identification
        const fieldIds: Record<string, string> = {
          firstName: 'site-admin-first-name',
          lastName: 'site-admin-last-name',
          email: 'site-admin-email',
        };
        const firstInvalid = ['firstName', 'lastName', 'email'].find(
          (k) => validationErrors[k as keyof typeof validationErrors]
        );
        if (firstInvalid && fieldIds[firstInvalid]) {
          const el = document.getElementById(fieldIds[firstInvalid]);
          el?.focus();
        }
        return;
      }
    }

    const assigned = studyRows
      .filter((r) => r.assigned)
      .map((r) => ({
        studyId: r.studyId,
        studyName: r.studyName,
        permission: r.permissions || 'RA',
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
        className="btn site-admin-btn-save site-admin-tooltip-btn"
        onClick={handleSubmit}
        disabled={isSubmitting}
        data-tooltip="Save"
        aria-label="Save"
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
      </button>

      <button
        type="button"
        className="btn site-admin-btn-resend site-admin-tooltip-btn"
        onClick={handleResendEnrollment}
        disabled={isSubmitting}
        data-tooltip="Resend Enroll Email"
        aria-label="Resend Enroll Email"
      >
        <Send size={15} aria-hidden="true" />
        <span>Resend Enrollment Email</span>
      </button>

      <button
        type="button"
        className="btn site-admin-btn-reset-pw site-admin-tooltip-btn"
        onClick={handleResetPassword}
        disabled={isSubmitting}
        data-tooltip="Reset the user's password"
        aria-label="Reset the user's password"
      >
        <KeyRound size={15} aria-hidden="true" />
        <span>Reset Password</span>
      </button>

      {isUserDisabled ? (
        <button
          type="button"
          className="btn site-admin-btn-unlock site-admin-tooltip-btn"
          onClick={handleUnlockAccount}
          disabled={isSubmitting}
          data-tooltip="Unlock account"
          aria-label="Unlock account"
        >
          <Lock size={15} aria-hidden="true" />
          <span>Unlock Account</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn site-admin-btn-lock site-admin-tooltip-btn"
          onClick={handleLockAccount}
          disabled={isSubmitting}
          data-tooltip="Lock account"
          aria-label="Lock account"
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
          /* Edit User Mode Field Layout: Email (Static), Site Permissions (No First Name / Last Name) */
          <div className="site-admin-form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-email-static">
                Email
              </label>
              <input
                id="site-admin-email-static"
                type="email"
                placeholder="Enter Email"
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
                disabled={isSitePermissionSelectDisabled}
                title={
                  isEditingSelf
                    ? 'Users cannot modify their own site permissions'
                    : isSitePermissionSelectDisabled
                    ? 'Site Managers cannot modify a Site Admin role'
                    : undefined
                }
                aria-label="Site Permissions"
              >
                <option value="None">None</option>
                {selectedSitePermissionValue !== 'None' &&
                  !sitePermissionOptions.some((r) => r.label === selectedSitePermissionValue) && (
                    <option value={selectedSitePermissionValue}>
                      {selectedSitePermissionValue}
                    </option>
                  )}
                {sitePermissionOptions.map((role) => (
                  <option
                    key={role.code}
                    value={role.label}
                    disabled={!canManageSiteAdmins && role.code?.toUpperCase() === 'SITE_ADMIN'}
                  >
                    {role.label}
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
                placeholder={!firstName && errors.firstName ? errors.firstName : 'Enter First Name'}
                className="form-input"
                value={firstName}
                onChange={(e) => handleChange('firstName', e.target.value, setFirstName)}
                onBlur={() => handleBlur('firstName')}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'site-admin-first-name-error' : undefined}
                required
                aria-required="true"
              />
              {errors.firstName && (
                <div id="site-admin-first-name-error" className="sr-only" role="alert">
                  {errors.firstName}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-last-name">
                Last Name <span className="form-required-marker" aria-hidden="true">*</span>
              </label>
              <input
                id="site-admin-last-name"
                type="text"
                placeholder={!lastName && errors.lastName ? errors.lastName : 'Enter Last Name'}
                className="form-input"
                value={lastName}
                onChange={(e) => handleChange('lastName', e.target.value, setLastName)}
                onBlur={() => handleBlur('lastName')}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'site-admin-last-name-error' : undefined}
                required
                aria-required="true"
              />
              {errors.lastName && (
                <div id="site-admin-last-name-error" className="sr-only" role="alert">
                  {errors.lastName}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-email">
                Email <span className="form-required-marker" aria-hidden="true">*</span>
              </label>
              <input
                id="site-admin-email"
                type="email"
                placeholder={!email && errors.email ? errors.email : 'Enter Email'}
                className="form-input"
                value={email}
                onChange={(e) => handleChange('email', e.target.value, setEmail)}
                onBlur={() => handleBlur('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'site-admin-email-error' : undefined}
                required
                aria-required="true"
              />
              {errors.email && (
                <div id="site-admin-email-error" className="sr-only" role="alert">
                  {errors.email}
                </div>
              )}
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
                {sitePermissionOptions.map((role) => (
                  <option
                    key={role.code}
                    value={role.label}
                    disabled={!canManageSiteAdmins && role.code?.toUpperCase() === 'SITE_ADMIN'}
                  >
                    {role.label}
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
                  <th scope="col" className="site-admin-studies-th-checkbox">
                    <input
                      type="checkbox"
                      checked={allAssigned}
                      onChange={handleToggleAll}
                      className="site-admin-study-checkbox"
                      aria-label="Select or deselect all studies"
                    />
                  </th>
                  <th scope="col">Study Name</th>
                  <th scope="col">Study Permissions</th>
                </tr>
              </thead>
              <tbody>
                {loadingStudies ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      Loading latest studies...
                    </td>
                  </tr>
                ) : studyRows.length === 0 ? (
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
                          value={row.permissions || 'RA'}
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
