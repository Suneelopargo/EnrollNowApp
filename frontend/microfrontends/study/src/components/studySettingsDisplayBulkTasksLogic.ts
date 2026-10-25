// frontend/microfrontends/study/src/components/studySettingsDisplayBulkTasksLogic.ts
// Pure, framework-free business rules for Study Settings → Display and Bulk Tasks.
// Mirrors legacy Ripple behaviour:
//   - client/components/authenticated/studyPages/settings/display/*ColumnList.jsx
//   - client/components/authenticated/studyPages/settings/bulk-tasks.jsx
import type {
  ParticipantColumn,
  BulkTask,
  BulkTaskTeamMember,
  SaveBulkTaskGroupPayload,
  BulkTaskTriggerAction,
} from '../../../../shared/api/studyApi';

export const MIN_COLUMN_MESSAGE = 'Must have at least one column for display.';
export const DEFAULT_FALLBACK_COLUMN: ParticipantColumn = { label: 'ID', value: 'psi.customId' };

export function toColumn(option: ParticipantColumn): ParticipantColumn {
  return { label: option.label, value: option.value, cId: option.cId, title: option.title };
}

/** Legacy "Add A Column": append the first available option (ID / psi.customId). */
export function addColumn(columns: ParticipantColumn[], options: ParticipantColumn[]): ParticipantColumn[] {
  const first = options.length > 0 ? toColumn(options[0]) : { ...DEFAULT_FALLBACK_COLUMN };
  return [...columns, first];
}

/** Legacy remove: blocked when only one column remains. */
export function removeColumn(
  columns: ParticipantColumn[],
  index: number
): { columns: ParticipantColumn[]; error: string | null } {
  if (columns.length <= 1) {
    return { columns, error: MIN_COLUMN_MESSAGE };
  }
  if (index < 0 || index >= columns.length) {
    return { columns, error: null };
  }
  return { columns: columns.filter((_, i) => i !== index), error: null };
}

/** Legacy select change: replace the column at index with the chosen option. */
export function replaceColumn(
  columns: ParticipantColumn[],
  index: number,
  value: string,
  options: ParticipantColumn[]
): ParticipantColumn[] {
  const matched = options.find((o) => o.value === value);
  const next: ParticipantColumn = matched ? toColumn(matched) : { label: value, value };
  return columns.map((c, i) => (i === index ? next : c));
}

export function columnOptionLabel(option: ParticipantColumn): string {
  return option.cId ? `${option.label} (Custom Variable)` : option.label;
}

export type GroupFormResult =
  | { ok: true; payload: SaveBulkTaskGroupPayload }
  | { ok: false; error: string };

/** Legacy group save: name required; trigger only persisted when active. */
export function buildBulkTaskGroupPayload(input: {
  name: string;
  description: string;
  triggerActive: boolean;
  eventId: string;
  action: BulkTaskTriggerAction;
}): GroupFormResult {
  const name = (input.name || '').trim();
  if (!name) {
    return { ok: false, error: 'Bulk task group name is required.' };
  }
  if (input.triggerActive && !input.eventId) {
    return { ok: false, error: 'Trigger event is required when trigger is active.' };
  }
  return {
    ok: true,
    payload: {
      name,
      description: (input.description || '').trim(),
      triggerActive: input.triggerActive,
      trigger: input.triggerActive ? { eventId: input.eventId, action: input.action } : null,
    },
  };
}

export function validateTaskName(name: string): string | null {
  return (name || '').trim() ? null : 'Bulk task name is required.';
}

/** Move a task within its group and return the reordered list with 0-based ranks. */
export function moveTask(tasks: BulkTask[], fromIndex: number, toIndex: number): BulkTask[] | null {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= tasks.length ||
    toIndex >= tasks.length
  ) {
    return null;
  }
  const next = [...tasks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((t, idx) => ({ ...t, rank: idx }));
}

export function resolveAssigneeNames(assignedIds: string[] | undefined, members: BulkTaskTeamMember[]): string {
  if (!Array.isArray(assignedIds) || assignedIds.length === 0) {
    return 'Unassigned';
  }
  return assignedIds
    .map((id) => {
      const found = members.find((m) => String(m.userId) === String(id));
      return found ? found.name || found.email || id : id;
    })
    .join(', ');
}

export function toggleAssignee(current: string[], userId: string): string[] {
  return current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
}

export function triggerActionLabel(action: string | undefined): string {
  return action === 'scheduled' ? 'Scheduled' : 'Completed';
}
