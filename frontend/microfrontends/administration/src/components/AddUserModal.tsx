// frontend/microfrontends/administration/src/components/AddUserModal.tsx - Add User Modal Matching Images 2 & 3
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { Plus } from 'lucide-react';
import {
  validateField,
  validateForm,
  validators,
} from '../../../../shared/design-system/validation';
import { SiteAdminUser, UserStatus } from '../types/admin';
import { AVAILABLE_STUDIES_LIST, SITE_PERMISSION_ROLES } from '../mockData';

export interface StudyAssignmentState {
  studyName: string;
  assigned: boolean;
  role: string;
  permissions: string;
}

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<SiteAdminUser>) => void;
  userToEdit?: SiteAdminUser | null;
}

const STUDY_ROLE_OPTIONS = [
  'RA',
  'PI',
  'Co-PI',
  'Coordinator',
  'Data Manager',
  'Nurse',
  'Other',
];

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
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
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
      const parts = userToEdit.name.split(' ');
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(userToEdit.email);
      setSitePermissions(userToEdit.sitePermissions || 'None');

      const assignedStudies = new Set(userToEdit.studies || []);
      setStudyRows(
        AVAILABLE_STUDIES_LIST.map((name) => ({
          studyName: name,
          assigned: assignedStudies.has(name),
          role: assignedStudies.has(name) ? 'RA' : '',
          permissions: assignedStudies.has(name) ? 'RA' : '',
        }))
      );
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setSitePermissions('None');
      setStudyRows(
        AVAILABLE_STUDIES_LIST.map((name) => ({
          studyName: name,
          assigned: false,
          role: '',
          permissions: '',
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
        const nextAssigned = !row.assigned;
        return {
          ...row,
          assigned: nextAssigned,
          role: nextAssigned ? row.role || 'RA' : '',
          permissions: nextAssigned ? row.permissions || 'RA' : '',
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
        role: !allChecked ? row.role || 'RA' : '',
        permissions: !allChecked ? row.permissions || 'RA' : '',
      }))
    );
  };

  const handleRoleChange = (index: number, role: string) => {
    setStudyRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, role } : row))
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

  const modalFooter = (
    <>
      <button
        type="button"
        className="btn btn-primary"
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
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add User"
      footer={modalFooter}
      className="site-admin-add-user-modal"
    >
      <form onSubmit={handleSubmit} className="site-admin-modal-form" noValidate>
        {/* Top 2x2 Field Grid: First Name & Last Name in Row 1, Email & Site Permissions in Row 2 */}
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
              {SITE_PERMISSION_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

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
                  <th>Study Role</th>
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
                          value={row.role || 'RA'}
                          onChange={(e) => handleRoleChange(idx, e.target.value)}
                          aria-label={`Study role for ${row.studyName}`}
                        >
                          {STUDY_ROLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </td>
                    <td>
                      {row.assigned ? (
                        <select
                          className="site-admin-study-select"
                          value={row.permissions || 'RA'}
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
