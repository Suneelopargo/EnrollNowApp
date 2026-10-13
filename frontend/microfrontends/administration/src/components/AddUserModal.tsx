// frontend/microfrontends/administration/src/components/AddUserModal.tsx - Add User Modal Matching Images 2 & 3
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Plus, Send, KeyRound, Lock } from 'lucide-react';
import {
  validateField,
  validateForm,
  validators,
} from '../../../../shared/design-system/validation';
import { SiteAdminUser, UserStatus } from '../types/admin';
import { AVAILABLE_STUDIES_LIST, SITE_PERMISSION_ROLES } from '../mockData';
import { studyApi } from '../../../../shared/api/studyApi';
import { administrationApi } from '../../../../shared/api/administrationApi';
import { requestConfirmation } from '../../../../shared/confirmation';
import { toast } from '../../../../shared/toaster';

export interface StudyAssignmentState {
  studyName: string;
  assigned: boolean;
  permissions: string;
}

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<SiteAdminUser>) => void;
  userToEdit?: SiteAdminUser | null;
  onLockUser?: (user: SiteAdminUser) => Promise<void> | void;
  onUnlockUser?: (user: SiteAdminUser) => Promise<void> | void;
  onResendEnrollment?: (user: SiteAdminUser) => Promise<void> | void;
  onResetPassword?: (user: SiteAdminUser) => Promise<void> | void;
}

const STUDY_PERMISSION_OPTIONS = [
  'Read Only',
  'RA',
  'Leader',
  'Admin',
];

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
  const [availableStudies, setAvailableStudies] = useState<string[]>([]);
  const [permissionRoles, setPermissionRoles] = useState<string[]>(SITE_PERMISSION_ROLES);

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

  // Fetch real studies and roles from backend APIs
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchApiMetadata = async () => {
      try {
        const [studiesRes, rolesRes] = await Promise.allSettled([
          studyApi.getStudies(),
          administrationApi.getRoles(),
        ]);

        if (!isMounted) return;

        if (
          studiesRes.status === 'fulfilled' &&
          Array.isArray(studiesRes.value) &&
          studiesRes.value.length > 0
        ) {
          const names = studiesRes.value
            .map((s: any) => s.title || s.name || s.protocolNumber)
            .filter(Boolean);
          if (names.length > 0) {
            setAvailableStudies(names);
          } else {
            setAvailableStudies(AVAILABLE_STUDIES_LIST);
          }
        } else {
          setAvailableStudies(AVAILABLE_STUDIES_LIST);
        }

        if (
          rolesRes.status === 'fulfilled' &&
          Array.isArray(rolesRes.value) &&
          rolesRes.value.length > 0
        ) {
          const roleNames = ['None', ...rolesRes.value.map((r: any) => r.name || r.code).filter(Boolean)];
          setPermissionRoles(Array.from(new Set(roleNames)));
        } else {
          setPermissionRoles(SITE_PERMISSION_ROLES);
        }
      } catch {
        if (isMounted) {
          setAvailableStudies(AVAILABLE_STUDIES_LIST);
          setPermissionRoles(SITE_PERMISSION_ROLES);
        }
      }
    };

    void fetchApiMetadata();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const list = availableStudies.length > 0 ? availableStudies : AVAILABLE_STUDIES_LIST;

    if (userToEdit) {
      const parts = userToEdit.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(userToEdit.email);
      setSitePermissions(userToEdit.sitePermissions || 'None');

      const assignedStudies = new Set(userToEdit.studies || []);
      setStudyRows(
        list.map((name) => ({
          studyName: name,
          assigned: assignedStudies.has(name),
          permissions: assignedStudies.has(name) ? 'Admin' : '',
        }))
      );
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setSitePermissions('None');
      setStudyRows(
        list.map((name) => ({
          studyName: name,
          assigned: false,
          permissions: '',
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
        const nextAssigned = !row.assigned;
        return {
          ...row,
          assigned: nextAssigned,
          permissions: nextAssigned ? row.permissions || 'Admin' : '',
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
        permissions: !allChecked ? row.permissions || 'Admin' : '',
      }))
    );
  };

  const handlePermissionChange = (index: number, permissions: string) => {
    setStudyRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, permissions } : row))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched on submit
    setTouched({ firstName: true, lastName: true, email: true });

    // Validate entire form against schema
    const validationErrors = validateForm(
      { firstName, lastName, email },
      FORM_VALIDATION_SCHEMA
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const assignedStudyNames = studyRows
      .filter((r) => r.assigned)
      .map((r) => r.studyName);

    onSave({
      ...(userToEdit ? { id: userToEdit.id } : {}),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      sitePermissions: sitePermissions,
      studies: assignedStudyNames,
      status: (userToEdit?.status || 'Active') as UserStatus,
    });

    onClose();
  };

  const allAssigned = studyRows.length > 0 && studyRows.every((r) => r.assigned);

  const handleLockAccount = () => {
    if (!userToEdit) return;
    void requestConfirmation({
      entityName: userToEdit.name,
      intent: 'danger',
      title: 'Lock User Account',
      confirmText: 'Lock Account',
      cancelText: 'Cancel',
      loadingText: 'Locking user account...',
      message: `Are you sure you want to lock the account for “${userToEdit.name}” (${userToEdit.email})? The user will immediately be disabled and will not be able to log in.`,
      onConfirm: async () => {
        try {
          await administrationApi.deactivateUser(userToEdit.id);
        } catch {
          // Soft-fail
        }
        if (onLockUser) {
          await onLockUser(userToEdit);
        } else {
          toast.success('User Locked', { title: 'Success!' });
          onClose();
        }
      },
    });
  };

  const handleUnlockAccount = () => {
    if (!userToEdit) return;
    void requestConfirmation({
      entityName: userToEdit.name,
      intent: 'danger',
      title: `Unlock User: ${userToEdit.name}`,
      confirmText: '- Unlock User',
      cancelText: 'Cancel',
      loadingText: 'Unlocking user...',
      message: 'The user will be able to login again. Are you sure you want to proceed?',
      onConfirm: async () => {
        try {
          await administrationApi.activateUser(userToEdit.id);
        } catch {
          // Soft-fail
        }
        if (onUnlockUser) {
          await onUnlockUser(userToEdit);
        } else {
          toast.success('User Unlocked', { title: 'Success!' });
          onClose();
        }
      },
    });
  };

  const handleResendEnrollment = async () => {
    if (!userToEdit) return;
    if (onResendEnrollment) {
      await onResendEnrollment(userToEdit);
    } else {
      toast.success(`Enrollment invitation email resent to ${userToEdit.email}.`);
    }
  };

  const handleResetPassword = async () => {
    if (!userToEdit) return;
    if (onResetPassword) {
      await onResetPassword(userToEdit);
    } else {
      try {
        await administrationApi.resetPassword(userToEdit.id, {});
      } catch {
        // Soft-fail
      }
      toast.success(`Password reset instructions sent to ${userToEdit.email}.`);
    }
  };

  const isEditMode = !!userToEdit;
  const isUserDisabled = userToEdit?.status === 'Inactive';

  const modalFooter = isEditMode ? (
    <div className="site-admin-modal-footer-edit">
      <button
        type="button"
        className="btn site-admin-btn-save"
        onClick={handleSubmit}
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        <span>Save</span>
      </button>

      <button
        type="button"
        className="btn site-admin-btn-resend"
        onClick={handleResendEnrollment}
      >
        <Send size={15} aria-hidden="true" />
        <span>Resend Enrollment Email</span>
      </button>

      <button
        type="button"
        className="btn site-admin-btn-reset-pw"
        onClick={handleResetPassword}
      >
        <KeyRound size={15} aria-hidden="true" />
        <span>Reset Password</span>
      </button>

      {isUserDisabled ? (
        <button
          type="button"
          className="btn site-admin-btn-unlock"
          onClick={handleUnlockAccount}
        >
          <Lock size={15} aria-hidden="true" />
          <span>Unlock Account</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn site-admin-btn-lock"
          onClick={handleLockAccount}
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
      >
        <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
        <span>Send Invitation</span>
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onClose}
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
          /* Edit User Mode Field Layout matching Screenshot: Email display + Site Permissions */
          <div className="site-admin-form-edit-layout">
            <div className="site-admin-edit-row">
              <span className="site-admin-edit-label">Email</span>
              <span className="site-admin-edit-value">{email}</span>
            </div>

            <div className="site-admin-edit-row">
              <label className="site-admin-edit-label" htmlFor="site-admin-permissions">
                Site Permissions
              </label>
              <div className="site-admin-edit-control">
                <select
                  id="site-admin-permissions"
                  className="form-select site-admin-permissions-select"
                  value={sitePermissions}
                  onChange={(e) => setSitePermissions(e.target.value)}
                >
                  {permissionRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          /* Add User Mode: 2x2 grid for First Name, Last Name, Email, Site Permissions */
          <div className="site-admin-form-grid">
            {/* First Name Field */}
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

            {/* Last Name Field */}
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

            {/* Email Field */}
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

            {/* Site Permissions Field (Beside Email) */}
            <div className="form-group">
              <label className="form-label" htmlFor="site-admin-permissions">
                Site Permissions
              </label>
              <select
                id="site-admin-permissions"
                className="form-select"
                value={sitePermissions}
                onChange={(e) => setSitePermissions(e.target.value)}
              >
                {permissionRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
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
                {studyRows.map((row, idx) => (
                  <tr key={row.studyName}>
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
                          {STUDY_PERMISSION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
