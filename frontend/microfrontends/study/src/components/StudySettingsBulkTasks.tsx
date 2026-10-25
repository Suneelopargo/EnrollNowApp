// frontend/microfrontends/study/src/components/StudySettingsBulkTasks.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  studyApi,
  BulkTaskGroup,
  BulkTask,
  StudyEventOption,
  BulkTaskTeamMember,
  SaveBulkTaskGroupPayload,
  StudyBulkTasksData,
} from '../../../../shared/api/studyApi';
import {
  ListChecks,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  X,
  Edit3,
  Zap,
} from 'lucide-react';

export interface StudySettingsBulkTasksProps {
  studyId: string;
  studyName?: string;
  isArchived?: boolean;
  canManageSettings?: boolean;
  onStudyUpdated?: () => void;
}

export const StudySettingsBulkTasks: React.FC<StudySettingsBulkTasksProps> = ({
  studyId,
  isArchived = false,
  canManageSettings = true,
  onStudyUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const [groups, setGroups] = useState<BulkTaskGroup[]>([]);
  const [studyEvents, setStudyEvents] = useState<StudyEventOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<BulkTaskTeamMember[]>([]);
  const [serverCanManage, setServerCanManage] = useState<boolean>(true);

  // Group Modal state
  const [groupModalOpen, setGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<BulkTaskGroup | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [groupDescription, setGroupDescription] = useState<string>('');
  const [groupTriggerActive, setGroupTriggerActive] = useState<boolean>(false);
  const [groupTriggerEventId, setGroupTriggerEventId] = useState<string>('');
  const [groupTriggerAction, setGroupTriggerAction] = useState<'completed' | 'scheduled'>('completed');
  const [groupModalError, setGroupModalError] = useState<string | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<boolean>(false);

  // Task Modal state
  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [activeGroupIdForTask, setActiveGroupIdForTask] = useState<string>('');
  const [editingTask, setEditingTask] = useState<BulkTask | null>(null);
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskAssignedTo, setTaskAssignedTo] = useState<string[]>([]);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<boolean>(false);

  // Drag reorder state
  const [draggedTaskInfo, setDraggedTaskInfo] = useState<{ groupId: string; index: number } | null>(null);

  const groupNameInputRef = useRef<HTMLInputElement | null>(null);
  const taskNameInputRef = useRef<HTMLInputElement | null>(null);

  const canEdit = canManageSettings && serverCanManage && !isArchived;

  const applySnapshot = useCallback((data: StudyBulkTasksData) => {
    setGroups(Array.isArray(data?.bulkTaskGroups) ? data.bulkTaskGroups : []);
    setStudyEvents(Array.isArray(data?.events) ? data.events : []);
    setTeamMembers(Array.isArray(data?.teamMembers) ? data.teamMembers : []);
    setServerCanManage(data?.canManage !== undefined ? data.canManage : true);
  }, []);

  const fetchBulkTasks = useCallback(async () => {
    if (!studyId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await studyApi.getStudyBulkTasks(studyId);
      applySnapshot(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load study bulk tasks.';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [studyId, applySnapshot]);

  useEffect(() => {
    fetchBulkTasks();
  }, [fetchBulkTasks]);

  // Focus first input on modal open & Escape key handler
  useEffect(() => {
    if (groupModalOpen) {
      setTimeout(() => groupNameInputRef.current?.focus(), 0);
    }
  }, [groupModalOpen]);

  useEffect(() => {
    if (taskModalOpen) {
      setTimeout(() => taskNameInputRef.current?.focus(), 0);
    }
  }, [taskModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (groupModalOpen && !submitting) {
          setGroupModalOpen(false);
          setConfirmDeleteGroup(false);
        }
        if (taskModalOpen && !submitting) {
          setTaskModalOpen(false);
          setConfirmDeleteTask(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [groupModalOpen, taskModalOpen, submitting]);

  const openAddGroupModal = () => {
    if (!canEdit) return;
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupTriggerActive(false);
    setGroupTriggerEventId(studyEvents.length > 0 ? studyEvents[0]._id : '');
    setGroupTriggerAction('completed');
    setGroupModalError(null);
    setConfirmDeleteGroup(false);
    setGroupModalOpen(true);
  };

  const openEditGroupModal = (group: BulkTaskGroup) => {
    if (!canEdit) return;
    setEditingGroup(group);
    setGroupName(group.name || '');
    setGroupDescription(group.description || '');
    const isTrigActive = Boolean(group.triggerActive && group.trigger);
    setGroupTriggerActive(isTrigActive);
    setGroupTriggerEventId(
      group.trigger?.eventId || (studyEvents.length > 0 ? studyEvents[0]._id : '')
    );
    setGroupTriggerAction(
      group.trigger?.action === 'scheduled' ? 'scheduled' : 'completed'
    );
    setGroupModalError(null);
    setConfirmDeleteGroup(false);
    setGroupModalOpen(true);
  };

  const closeGroupModal = () => {
    if (submitting) return;
    setGroupModalOpen(false);
    setEditingGroup(null);
    setGroupModalError(null);
    setConfirmDeleteGroup(false);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setGroupModalError(null);
    setBannerError(null);
    setBannerSuccess(null);

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setGroupModalError('Bulk task group name is required.');
      return;
    }

    if (groupTriggerActive) {
      if (!groupTriggerEventId) {
        setGroupModalError('Trigger event is required when trigger is active.');
        return;
      }
    }

    const payload: SaveBulkTaskGroupPayload = {
      name: trimmedName,
      description: groupDescription.trim(),
      triggerActive: groupTriggerActive,
      trigger: groupTriggerActive
        ? {
            eventId: groupTriggerEventId,
            action: groupTriggerAction,
          }
        : null,
    };

    setSubmitting(true);
    try {
      if (editingGroup) {
        applySnapshot(await studyApi.updateBulkTaskGroup(studyId, editingGroup._id, payload));
        setBannerSuccess(`Bulk task group "${trimmedName}" updated.`);
      } else {
        applySnapshot(await studyApi.createBulkTaskGroup(studyId, payload));
        setBannerSuccess(`Bulk task group "${trimmedName}" created.`);
      }
      setGroupModalOpen(false);
      setEditingGroup(null);
      onStudyUpdated?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save bulk task group.';
      setGroupModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!canEdit || !editingGroup) return;
    setSubmitting(true);
    setGroupModalError(null);
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const deletedName = editingGroup.name;
      applySnapshot(await studyApi.deleteBulkTaskGroup(studyId, editingGroup._id));
      setGroupModalOpen(false);
      setEditingGroup(null);
      setConfirmDeleteGroup(false);
      setBannerSuccess(`Bulk task group "${deletedName}" and its tasks were deleted.`);
      onStudyUpdated?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete bulk task group.';
      setGroupModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openAddTaskModal = (groupId: string) => {
    if (!canEdit) return;
    setActiveGroupIdForTask(groupId);
    setEditingTask(null);
    setTaskName('');
    setTaskDescription('');
    setTaskAssignedTo([]);
    setTaskModalError(null);
    setConfirmDeleteTask(false);
    setTaskModalOpen(true);
  };

  const openEditTaskModal = (groupId: string, task: BulkTask) => {
    if (!canEdit) return;
    setActiveGroupIdForTask(groupId);
    setEditingTask(task);
    setTaskName(task.name || '');
    setTaskDescription(task.description || '');
    setTaskAssignedTo(Array.isArray(task.assignedTo) ? [...task.assignedTo] : []);
    setTaskModalError(null);
    setConfirmDeleteTask(false);
    setTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    if (submitting) return;
    setTaskModalOpen(false);
    setEditingTask(null);
    setTaskModalError(null);
    setConfirmDeleteTask(false);
  };

  const toggleAssignee = (userId: string) => {
    setTaskAssignedTo((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setTaskModalError(null);
    setBannerError(null);
    setBannerSuccess(null);

    const trimmedName = taskName.trim();
    if (!trimmedName) {
      setTaskModalError('Bulk task name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTask) {
        applySnapshot(
          await studyApi.updateBulkTask(studyId, editingTask._id, {
            name: trimmedName,
            description: taskDescription.trim(),
            assignedTo: taskAssignedTo,
          })
        );
        setBannerSuccess(`Task "${trimmedName}" updated.`);
      } else {
        applySnapshot(
          await studyApi.createBulkTask(studyId, activeGroupIdForTask, {
            name: trimmedName,
            description: taskDescription.trim(),
            assignedTo: taskAssignedTo,
          })
        );
        setBannerSuccess(`Task "${trimmedName}" added.`);
      }
      setTaskModalOpen(false);
      setEditingTask(null);
      onStudyUpdated?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save bulk task.';
      setTaskModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!canEdit || !editingTask) return;
    setSubmitting(true);
    setTaskModalError(null);
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const deletedName = editingTask.name;
      applySnapshot(await studyApi.deleteBulkTask(studyId, editingTask._id));
      setTaskModalOpen(false);
      setEditingTask(null);
      setConfirmDeleteTask(false);
      setBannerSuccess(`Task "${deletedName}" deleted.`);
      onStudyUpdated?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to delete bulk task.';
      setTaskModalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveTask = async (group: BulkTaskGroup, fromIndex: number, toIndex: number) => {
    if (!canEdit || submitting) return;
    const tasks = group.tasks || [];
    if (toIndex < 0 || toIndex >= tasks.length || fromIndex === toIndex) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const orderedIds = reordered.map((t) => t._id);

    // Optimistic UI update
    setGroups((prev) =>
      prev.map((g) =>
        g._id === group._id
          ? {
              ...g,
              tasks: reordered.map((t, idx) => ({ ...t, rank: idx })),
            }
          : g
      )
    );

    setBannerError(null);
    try {
      applySnapshot(await studyApi.reorderBulkTasks(studyId, group._id, orderedIds));
      setBannerSuccess('Task order updated.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reorder bulk tasks.';
      setBannerError(msg);
      await fetchBulkTasks();
    }
  };

  const resolveAssigneeNames = (assignedIds: string[]): string => {
    if (!Array.isArray(assignedIds) || assignedIds.length === 0) {
      return 'Unassigned';
    }
    return assignedIds
      .map((id) => {
        const found = teamMembers.find((m) => m.userId === id);
        return found ? found.name || found.email || id : id;
      })
      .join(', ');
  };

  const resolveEventName = (eventId?: string): string => {
    if (!eventId) return 'Unknown Event';
    const found = studyEvents.find((ev) => ev._id === eventId);
    return found ? found.name : eventId;
  };

  if (loading) {
    return (
      <div className="study-settings-loading" role="status" aria-live="polite" data-testid="study-bulk-tasks-loading">
        <Loader2 className="study-settings-spinner" size={24} />
        <span>Loading bulk tasks...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="study-settings-error-state" role="alert" data-testid="study-bulk-tasks-error">
        <AlertCircle size={20} />
        <div>
          <h4>Unable to load study bulk tasks</h4>
          <p>{loadError}</p>
          <button
            type="button"
            className="study-settings-btn study-settings-btn--outline"
            onClick={fetchBulkTasks}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-settings-details" data-testid="study-settings-bulk-tasks">
      {!canEdit && (
        <div className="study-settings-banner study-settings-banner--info" role="status">
          <Info size={16} />
          <span>
            {isArchived
              ? 'This study is archived. Bulk Tasks are in read-only mode.'
              : 'You have read-only access to this study. Only Study Admins or Site Admins can modify bulk tasks.'}
          </span>
        </div>
      )}

      {bannerError && (
        <div
          className="study-settings-banner study-settings-banner--error"
          role="alert"
          data-testid="study-bulk-tasks-banner-error"
        >
          <AlertCircle size={16} />
          <span>{bannerError}</span>
        </div>
      )}

      {bannerSuccess && (
        <div
          className="study-settings-banner study-settings-banner--success"
          role="status"
          data-testid="study-bulk-tasks-banner-success"
        >
          <CheckCircle2 size={16} />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="study-bulk-tasks-header">
        <div className="study-bulk-tasks-header__title-group">
          <ListChecks size={20} className="study-settings-card__icon" />
          <div>
            <h2 className="study-bulk-tasks-header__title">Setup Bulk Tasks</h2>
            <p className="study-bulk-tasks-header__subtitle">
              Create reusable task groups and optionally trigger them when study events are scheduled or completed.
            </p>
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            className="study-settings-btn study-settings-btn--primary"
            onClick={openAddGroupModal}
            data-testid="add-bulk-task-group-btn"
          >
            <Plus size={16} />
            <span>Add Bulk Tasks Group</span>
          </button>
        )}
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="study-bulk-tasks-empty" data-testid="bulk-tasks-empty-state">
          <ListChecks size={28} />
          <h3>No Bulk Task Groups Yet</h3>
          <p>
            Click <strong>Add Bulk Tasks Group</strong> to organize sets of tasks that can be assigned to study team members.
          </p>
        </div>
      ) : (
        <div className="study-bulk-tasks-groups">
          {groups.map((group) => {
            const tasks = Array.isArray(group.tasks) ? group.tasks : [];
            return (
              <section
                key={group._id}
                className="study-settings-card study-bulk-task-group-card"
                aria-labelledby={`group-heading-${group._id}`}
                data-testid={`bulk-task-group-${group._id}`}
              >
                <header className="study-settings-card__header study-bulk-task-group-card__header">
                  <div className="study-bulk-task-group-card__meta">
                    <div className="study-bulk-task-group-card__title-row">
                      {canEdit ? (
                        <button
                          type="button"
                          id={`group-heading-${group._id}`}
                          className="study-bulk-task-group-card__title-btn"
                          onClick={() => openEditGroupModal(group)}
                          data-testid={`edit-group-btn-${group._id}`}
                        >
                          <span>{group.name}</span>
                          <Edit3 size={14} />
                        </button>
                      ) : (
                        <h3 id={`group-heading-${group._id}`} className="study-settings-card__title">
                          {group.name}
                        </h3>
                      )}

                      {group.triggerActive && group.trigger && (
                        <span
                          className="study-bulk-task-group-card__trigger-badge"
                          data-testid={`group-trigger-badge-${group._id}`}
                        >
                          <Zap size={12} />
                          <span>
                            Trigger: {resolveEventName(group.trigger.eventId)} is{' '}
                            {group.trigger.action === 'scheduled' ? 'Scheduled' : 'Completed'}
                          </span>
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="study-bulk-task-group-card__desc">{group.description}</p>
                    )}
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      className="study-settings-btn study-settings-btn--outline study-settings-btn--sm"
                      onClick={() => openAddTaskModal(group._id)}
                      data-testid={`add-task-btn-${group._id}`}
                    >
                      <Plus size={14} />
                      <span>Add Task</span>
                    </button>
                  )}
                </header>

                <div className="study-settings-card__body">
                  {tasks.length === 0 ? (
                    <p className="study-settings-empty-note" data-testid={`empty-tasks-${group._id}`}>
                      No tasks in this group yet. Click &ldquo;Add Task&rdquo; to create one.
                    </p>
                  ) : (
                    <div className="study-bulk-tasks-table-wrap">
                      <table
                        className="study-bulk-tasks-table"
                        aria-label={`Tasks in ${group.name}`}
                        data-testid={`tasks-table-${group._id}`}
                      >
                        <thead>
                          <tr>
                            <th scope="col">Title</th>
                            <th scope="col">Description</th>
                            <th scope="col">Assigned To</th>
                            {canEdit && <th scope="col" className="study-bulk-tasks-table__order-col">Order</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {tasks.map((task: BulkTask, idx: number) => (
                            <tr
                              key={task._id}
                              className="study-bulk-tasks-table__row"
                              draggable={canEdit}
                              onDragStart={() => setDraggedTaskInfo({ groupId: group._id, index: idx })}
                              onDragOver={(e) => {
                                if (canEdit && draggedTaskInfo?.groupId === group._id) {
                                  e.preventDefault();
                                }
                              }}
                              onDrop={() => {
                                if (draggedTaskInfo && draggedTaskInfo.groupId === group._id) {
                                  handleMoveTask(group, draggedTaskInfo.index, idx);
                                  setDraggedTaskInfo(null);
                                }
                              }}
                              data-testid={`task-row-${task._id}`}
                            >
                              <td>
                                {canEdit ? (
                                  <button
                                    type="button"
                                    className="study-bulk-tasks-table__task-link"
                                    onClick={() => openEditTaskModal(group._id, task)}
                                    data-testid={`edit-task-btn-${task._id}`}
                                  >
                                    <GripVertical size={14} className="study-bulk-tasks-table__grip" />
                                    <span>{task.name}</span>
                                  </button>
                                ) : (
                                  <span>{task.name}</span>
                                )}
                              </td>
                              <td>{task.description || '—'}</td>
                              <td data-testid={`task-assignees-${task._id}`}>
                                {resolveAssigneeNames(task.assignedTo)}
                              </td>
                              {canEdit && (
                                <td className="study-bulk-tasks-table__order-actions">
                                  <button
                                    type="button"
                                    className="study-settings-icon-btn"
                                    onClick={() => handleMoveTask(group, idx, idx - 1)}
                                    disabled={idx === 0 || submitting}
                                    aria-label={`Move ${task.name} up`}
                                    title="Move up"
                                    data-testid={`move-task-up-${task._id}`}
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="study-settings-icon-btn"
                                    onClick={() => handleMoveTask(group, idx, idx + 1)}
                                    disabled={idx === tasks.length - 1 || submitting}
                                    aria-label={`Move ${task.name} down`}
                                    title="Move down"
                                    data-testid={`move-task-down-${task._id}`}
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add / Edit Bulk Task Group */}
      {groupModalOpen && (
        <div
          className="study-settings-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-task-group-modal-title"
          data-testid="bulk-task-group-modal"
        >
          <div className="study-settings-modal">
            <header className="study-settings-modal__header">
              <h3 id="bulk-task-group-modal-title" className="study-settings-modal__title">
                {editingGroup ? 'Edit Bulk Task Group' : 'Add Bulk Task Group'}
              </h3>
              <button
                type="button"
                className="study-settings-icon-btn"
                onClick={closeGroupModal}
                aria-label="Close modal"
                data-testid="close-group-modal-btn"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveGroup} noValidate>
              <div className="study-settings-modal__body">
                {groupModalError && (
                  <div
                    className="study-settings-banner study-settings-banner--error"
                    role="alert"
                    data-testid="group-modal-error"
                  >
                    <AlertCircle size={16} />
                    <span>{groupModalError}</span>
                  </div>
                )}

                <div className="study-settings-field">
                  <label htmlFor="bulk-group-name-input" className="study-settings-label">
                    Name <span className="study-settings-required">*</span>
                  </label>
                  <input
                    ref={groupNameInputRef}
                    id="bulk-group-name-input"
                    type="text"
                    className="study-settings-input"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    required
                    data-testid="bulk-group-name-input"
                  />
                </div>

                <div className="study-settings-field">
                  <label htmlFor="bulk-group-desc-input" className="study-settings-label">
                    Description
                  </label>
                  <input
                    id="bulk-group-desc-input"
                    type="text"
                    className="study-settings-input"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Optional description"
                    data-testid="bulk-group-desc-input"
                  />
                </div>

                <div className="study-bulk-trigger-box">
                  <div className="study-settings-checkbox-row">
                    <input
                      id="bulk-group-trigger-checkbox"
                      type="checkbox"
                      className="study-settings-checkbox"
                      checked={groupTriggerActive}
                      onChange={(e) => setGroupTriggerActive(e.target.checked)}
                      data-testid="bulk-group-trigger-checkbox"
                    />
                    <label htmlFor="bulk-group-trigger-checkbox" className="study-settings-checkbox-label">
                      <strong>Trigger</strong>
                      <span>Automatically trigger this bulk task group from a study event.</span>
                    </label>
                  </div>

                  <div className="study-bulk-trigger-controls">
                    <div className="study-bulk-trigger-controls__event">
                      <label htmlFor="bulk-group-trigger-event" className="study-settings-sr-only">
                        Trigger Event
                      </label>
                      <select
                        id="bulk-group-trigger-event"
                        aria-label="Trigger Event"
                        className="study-settings-input"
                        value={groupTriggerEventId}
                        onChange={(e) => setGroupTriggerEventId(e.target.value)}
                        disabled={!groupTriggerActive || studyEvents.length === 0}
                        data-testid="bulk-group-trigger-event"
                      >
                        <option value="">Select Event...</option>
                        {studyEvents.map((ev) => (
                          <option key={ev._id} value={ev._id}>
                            {ev.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <span className="study-bulk-trigger-controls__is">is</span>

                    <div className="study-bulk-trigger-controls__action">
                      <label htmlFor="bulk-group-trigger-action" className="study-settings-sr-only">
                        Trigger Action
                      </label>
                      <select
                        id="bulk-group-trigger-action"
                        aria-label="Trigger Action"
                        className="study-settings-input"
                        value={groupTriggerAction}
                        onChange={(e) =>
                          setGroupTriggerAction(
                            e.target.value === 'scheduled' ? 'scheduled' : 'completed'
                          )
                        }
                        disabled={!groupTriggerActive}
                        data-testid="bulk-group-trigger-action"
                      >
                        <option value="completed">Completed</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {editingGroup && confirmDeleteGroup && (
                  <div
                    className="study-bulk-delete-confirm"
                    role="alert"
                    data-testid="confirm-delete-group-box"
                  >
                    <p>
                      Are you sure you want to delete <strong>{editingGroup.name}</strong> and all of its tasks?
                    </p>
                    <div className="study-bulk-delete-confirm__actions">
                      <button
                        type="button"
                        className="study-settings-btn study-settings-btn--outline study-settings-btn--sm"
                        onClick={() => setConfirmDeleteGroup(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="study-settings-btn study-settings-btn--danger study-settings-btn--sm"
                        onClick={handleDeleteGroup}
                        disabled={submitting}
                        data-testid="confirm-delete-group-btn"
                      >
                        Confirm Delete Group
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <footer className="study-settings-modal__footer">
                {editingGroup && !confirmDeleteGroup ? (
                  <button
                    type="button"
                    className="study-settings-btn study-settings-btn--danger"
                    onClick={() => setConfirmDeleteGroup(true)}
                    disabled={submitting}
                    data-testid="delete-group-btn"
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="study-settings-modal__footer-right">
                  <button
                    type="button"
                    className="study-settings-btn study-settings-btn--outline"
                    onClick={closeGroupModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="study-settings-btn study-settings-btn--primary"
                    disabled={submitting}
                    data-testid="save-group-btn"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Task */}
      {taskModalOpen && (
        <div
          className="study-settings-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-task-modal-title"
          data-testid="bulk-task-modal"
        >
          <div className="study-settings-modal">
            <header className="study-settings-modal__header">
              <h3 id="bulk-task-modal-title" className="study-settings-modal__title">
                {editingTask ? 'Edit Task' : 'Add Task'}
              </h3>
              <button
                type="button"
                className="study-settings-icon-btn"
                onClick={closeTaskModal}
                aria-label="Close modal"
                data-testid="close-task-modal-btn"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveTask} noValidate>
              <div className="study-settings-modal__body">
                {taskModalError && (
                  <div
                    className="study-settings-banner study-settings-banner--error"
                    role="alert"
                    data-testid="task-modal-error"
                  >
                    <AlertCircle size={16} />
                    <span>{taskModalError}</span>
                  </div>
                )}

                <div className="study-settings-field">
                  <label htmlFor="bulk-task-name-input" className="study-settings-label">
                    Name <span className="study-settings-required">*</span>
                  </label>
                  <input
                    ref={taskNameInputRef}
                    id="bulk-task-name-input"
                    type="text"
                    className="study-settings-input"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="Enter task name"
                    required
                    data-testid="bulk-task-name-input"
                  />
                </div>

                <div className="study-settings-field">
                  <label htmlFor="bulk-task-desc-input" className="study-settings-label">
                    Description
                  </label>
                  <input
                    id="bulk-task-desc-input"
                    type="text"
                    className="study-settings-input"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Optional task description"
                    data-testid="bulk-task-desc-input"
                  />
                </div>

                <fieldset className="study-bulk-assignees-fieldset">
                  <legend className="study-settings-label">Assigned To</legend>
                  {teamMembers.length === 0 ? (
                    <p className="study-settings-empty-note">
                      No study team members found for assignment.
                    </p>
                  ) : (
                    <div
                      className="study-bulk-assignees-list"
                      role="group"
                      aria-label="Assigned To Team Members"
                      data-testid="bulk-task-assignees-list"
                    >
                      {teamMembers.map((member) => {
                        const checked = taskAssignedTo.includes(member.userId);
                        return (
                          <label
                            key={String(member.userId)}
                            className={`study-bulk-assignee-item ${checked ? 'study-bulk-assignee-item--selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAssignee(member.userId)}
                              data-testid={`assignee-checkbox-${member.userId}`}
                            />
                            <span className="study-bulk-assignee-item__name">
                              {member.name || member.email}
                            </span>
                            {member.email && member.name && (
                              <span className="study-bulk-assignee-item__email">
                                ({member.email})
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                {editingTask && confirmDeleteTask && (
                  <div
                    className="study-bulk-delete-confirm"
                    role="alert"
                    data-testid="confirm-delete-task-box"
                  >
                    <p>
                      Are you sure you want to delete task <strong>{editingTask.name}</strong>?
                    </p>
                    <div className="study-bulk-delete-confirm__actions">
                      <button
                        type="button"
                        className="study-settings-btn study-settings-btn--outline study-settings-btn--sm"
                        onClick={() => setConfirmDeleteTask(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="study-settings-btn study-settings-btn--danger study-settings-btn--sm"
                        onClick={handleDeleteTask}
                        disabled={submitting}
                        data-testid="confirm-delete-task-btn"
                      >
                        Confirm Delete Task
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <footer className="study-settings-modal__footer">
                {editingTask && !confirmDeleteTask ? (
                  <button
                    type="button"
                    className="study-settings-btn study-settings-btn--danger"
                    onClick={() => setConfirmDeleteTask(true)}
                    disabled={submitting}
                    data-testid="delete-task-btn"
                  >
                    <Trash2 size={15} />
                    <span>Delete Task</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="study-settings-modal__footer-right">
                  <button
                    type="button"
                    className="study-settings-btn study-settings-btn--outline"
                    onClick={closeTaskModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="study-settings-btn study-settings-btn--primary"
                    disabled={submitting}
                    data-testid="save-task-btn"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudySettingsBulkTasks;
