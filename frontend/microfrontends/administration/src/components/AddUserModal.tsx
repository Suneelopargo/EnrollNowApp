// frontend/microfrontends/administration/src/components/AddUserModal.tsx - Add/Edit User Modal
import React, { useState, useEffect, useCallback } from 'react';
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

export interface AvailableStudy {
  id: string;
  name: string;
}

export const BACKEND_STUDIES: AvailableStudy[] = [
  { id: '77777777-7777-7777-7777-777777777701', name: 'REG - HIV' },
  { id: '77777777-7777-7777-7777-777777777702', name: 'REG - AD/MCI' },
  { id: '77777777-7777-7777-7777-777777777703', name: 'Cognitive Aging Study' },
  { id: '77777777-7777-7777-7777-777777777704', name: 'Memory Research Program' },
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
  onLockUser?: (user: SiteAdminUser) => Promise<void> | void;
  onUnlockUser?: (user: SiteAdminUser) => Promise<void> | void;
  onResendEnrollment?: (user: SiteAdminUser) => Promise<void> | void;
  onResetPassword?: (user: SiteAdminUser) => Promise<void> | void;
}

const STUDY_PERMISSION_OPTIONS = [
  'Admin',
  'Leader',
  'RA',
  'Read Only',
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
  const [title, setTitle] = useState('Study Coordinator');
  const [sitePermissions, setSitePermissions] = useState('None');
  const [studyRows, setStudyRows] = useState<StudyAssignmentState[]>([]);

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

  useEffect(() => {
    if (userToEdit) {
      const parts = (userToEdit.name || '').trim().split(/\s+/);
      setFirstName(parts[0] || userToEdit.firstName || '');
      setLastName(parts.slice(1).join(' ') || userToEdit.lastName || '');
      setEmail(userToEdit.email || '');
      setTitle(userToEdit.title || 'Study Coordinator');
      setSitePermissions(userToEdit.sitePermissions || 'None');

      const assignedStudies = new Set(userToEdit.studies || []);
      setStudyRows(
        BACKEND_STUDIES.map((study) => ({
          studyId: study.id,
          studyName: study.name,
          assigned: assignedStudies.has(study.name),
          permissions: assignedStudies.has(study.name) ? 'Admin' : 'Admin',
        }))
      );
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setTitle('Study Coordinator');
      setSitePermissions('None');
      setStudyRows(
        BACKEND_STUDIES.map((study) => ({
          studyId: study.id,
          studyName: study.name,
          assigned: false,
          permissions: 'Admin',
        }))
      );
    }
    setErrors({});
    setTouched({});
  }, [userToEdit, isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    void onSave({
      ...(userToEdit ? { id: userToEdit.id } : {}),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      title: title.trim(),
      sitePermissions,
      assignedStudies: assigned,
      unassignedStudies: unassigned,
    });
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
        if (onLockUser) {
          await onLockUser(userToEdit);
        }
      },
    });
  };

  const handleUnlockAccount = () => {
    if (!userToEdit) return;
    if (onUnlockUser) {
      void onUnlockUser(userToEdit);
    }
  };

  const handleResendEnrollment = async () => {
    if (!userToEdit) return;
    if (onResendEnrollment) {
      await onResendEnrollment(userToEdit);
    }
  };

  const handleResetPassword = async () => {
    if (!userToEdit) return;
    if (onResetPassword) {
      await onResetPassword(userToEdit);
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
          /* Edit User Mode Field Layout */
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
              <label className="form-label" htmlFor="site-admin-title">
                Title / Role
              </label>
              <input
                id="site-admin-title"
                type="text"
                className="form-input"
                placeholder="Study Coordinator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
        ) : (
          /* Add User Mode: 2x2 grid for First Name, Last Name, Email, Title */
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
              <label className="form-label" htmlFor="site-admin-title">
                Title / Role
              </label>
              <input
                id="site-admin-title"
                type="text"
                className="form-input"
                placeholder="Study Coordinator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
                          {STUDY_PERMISSION_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
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
