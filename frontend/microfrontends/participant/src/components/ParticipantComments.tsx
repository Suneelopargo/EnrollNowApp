// frontend/microfrontends/participant/src/components/ParticipantComments.tsx - Legacy Ripple Compatible Participant Comments
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Pin, Trash2, Edit2, Loader2, AlertCircle, Search, X } from 'lucide-react';
import { AuthUser } from '../../../../shared/contracts';
import { getStoredAuthUser, getApiErrorMessage } from '../../../../shared/api-client';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation } from '../../../../shared/confirmation';
import { participantApi, ParticipantCommentItem } from '../../../../shared/api/participantApi';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { TooltipButton as CommentActionTooltipButton } from '../../../../shared/design-system/components/TooltipButton';

export interface ParticipantCommentsProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
  currentUser?: AuthUser | null;
}

export const ParticipantComments: React.FC<ParticipantCommentsProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
  currentUser = null,
}) => {
  const [comments, setComments] = useState<ParticipantCommentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New comment state
  const [commentText, setCommentText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Inline editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Determine effective current user
  const effectiveUser = useMemo(() => {
    if (currentUser) return currentUser;
    return getStoredAuthUser<AuthUser>();
  }, [currentUser]);

  // Resolve display name for the current user
  const currentUserName = useMemo(() => {
    if (!effectiveUser) return 'Suneel Kumar';
    if (effectiveUser.fullName && effectiveUser.fullName.trim()) return effectiveUser.fullName.trim();
    const parts = [effectiveUser.firstName, effectiveUser.lastName].filter(Boolean).map((s) => s?.trim()).filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    if (effectiveUser.username && !effectiveUser.username.match(/^[0-9a-f]{8}-[0-9a-f]{4}/i)) return effectiveUser.username.trim();
    if (effectiveUser.email) return effectiveUser.email.split('@')[0];
    return 'Suneel Kumar';
  }, [effectiveUser]);

  const isUuid = (val?: string) =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

  // Resolve a comment's author display name so UUIDs are never displayed
  const getCommentAuthorName = (comment: ParticipantCommentItem): string => {
    const raw = comment.authorName;
    if (raw && raw.trim() && !isUuid(raw)) {
      return raw.trim();
    }
    const effId = effectiveUser?.id ? String(effectiveUser.id) : '';
    if (effId && (comment.authorId === effId || raw === effId)) {
      return currentUserName;
    }
    if (currentUserName) {
      return currentUserName;
    }
    return 'Suneel Kumar';
  };



  const formatCommentDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${monthStr} ${day}, ${year}, ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const isCommentEdited = (comment: ParticipantCommentItem) => {
    if (!comment.updatedAt || !comment.createdAt) return false;
    const created = new Date(comment.createdAt).getTime();
    const updated = new Date(comment.updatedAt).getTime();
    return Math.abs(updated - created) > 2000;
  };

  const canEditOrDelete = useCallback(
    (comment: ParticipantCommentItem) => {
      if (!effectiveUser) return true;
      if (effectiveUser.canAccessSiteAdmin || (effectiveUser as any).isAdmin || (effectiveUser as any).isFullSiteAdmin) return true;
      if (
        effectiveUser.roles &&
        effectiveUser.roles.some((r: string) => r.toUpperCase().includes('ADMIN') || r.toUpperCase().includes('MANAGER'))
      ) {
        return true;
      }
      const effId = effectiveUser.id ? String(effectiveUser.id) : '';
      if (comment.authorId && effId && comment.authorId === effId) return true;
      const authorName = getCommentAuthorName(comment);
      if (authorName && authorName === currentUserName) return true;
      return false;
    },
    [effectiveUser, currentUserName]
  );

  const fetchComments = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await participantApi.getComments(participantId, { tenantId, siteId });
      setComments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to load comments');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [participantId, tenantId, siteId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await participantApi.createComment(
        participantId,
        {
          text: commentText.trim(),
          pinned: isPinned,
          global: true,
          studyId: (studyId && studyId !== 'registry') ? studyId.trim() : undefined,
          authorName: currentUserName,
        },
        { tenantId, siteId }
      );
      toast.success('Comment added successfully');
      setCommentText('');
      setIsPinned(false);
      await fetchComments();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to save comment');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (comment: ParticipantCommentItem) => {
    setTogglingPinId(comment.id);
    const newPinned = !comment.pinned;
    try {
      await participantApi.pinComment(participantId, comment.id, newPinned, { tenantId, siteId });
      toast.success(newPinned ? 'Comment pinned' : 'Comment unpinned');
      await fetchComments();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update comment pin status');
      toast.error(msg);
    } finally {
      setTogglingPinId(null);
    }
  };

  const startEditComment = (comment: ParticipantCommentItem) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
    setEditIsPinned(Boolean(comment.pinned));
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditText('');
    setEditIsPinned(false);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await participantApi.updateComment(
        participantId,
        commentId,
        { text: editText.trim() },
        { tenantId, siteId }
      );

      const existingComment = comments.find((c) => c.id === commentId);
      if (existingComment && Boolean(existingComment.pinned) !== editIsPinned) {
        await participantApi.pinComment(participantId, commentId, editIsPinned, { tenantId, siteId });
      }

      toast.success('Comment updated successfully');
      setEditingCommentId(null);
      setEditText('');
      await fetchComments();
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update comment');
      toast.error(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteComment = (comment: ParticipantCommentItem) => {
    void requestConfirmation({
      entityName: 'comment',
      intent: 'danger',
      confirmText: 'Yes, delete it',
      loadingText: 'Deleting comment...',
      title: 'Delete Comment',
      message: 'Are you sure? You will not be able to recover this comment.',
      confirmWord: 'DELETE',
      onConfirm: async () => {
        try {
          await participantApi.deleteComment(participantId, comment.id, { tenantId, siteId });
          toast.success('Comment deleted');
          await fetchComments();
        } catch (err: any) {
          const msg = getApiErrorMessage(err, 'Failed to delete comment');
          toast.error(msg);
        }
      },
    });
  };


  const columnDefs = useMemo<ColDef<ParticipantCommentItem>[]>(() => [
    {
      colId: 'createdAt',
      headerName: 'Date',
      minWidth: 290,
      flex: 1,
      filter: false,
      floatingFilter: false,
      valueGetter: (params) => {
        const comment = params.data;
        return comment?.createdAt || '';
      },
      getQuickFilterText: (params) => {
        const comment = params.data;
        if (!comment) return '';
        return `${formatCommentDate(comment.createdAt)} ${comment.global ? 'Global Registry' : ''}`;
      },
      comparator: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      cellRenderer: (params: ICellRendererParams<ParticipantCommentItem>) => {
        const comment = params.data;
        if (!comment) return null;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap py-1">
            <span className="shrink-0 text-xs text-gray-800">
              {formatCommentDate(comment.createdAt)}
            </span>
            {comment.global && (
              <span
                title="Global (Registry)"
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#0284c7',
                  borderRadius: '9999px',
                  lineHeight: 1.4,
                  flexShrink: 0,
                }}
              >
                Global (Registry)
              </span>
            )}
          </div>
        );
      },
    },
    {
      colId: 'editedAt',
      headerName: 'Edited Date',
      width: 145,
      minWidth: 145,
      maxWidth: 145,
      filter: false,
      floatingFilter: false,
      valueGetter: (params) => params.data && isCommentEdited(params.data)
        ? params.data.updatedAt || ''
        : '',
      valueFormatter: (params) => params.value ? formatCommentDate(params.value) : '—',
      comparator: (a, b) => new Date(a || 0).getTime() - new Date(b || 0).getTime(),
    },
    {
      colId: 'author',
      headerName: 'Author',
      minWidth: 150,
      valueGetter: (params) => params.data ? getCommentAuthorName(params.data) : '',
    },
    {
      field: 'text',
      headerName: 'Comment',
      minWidth: 240,
      flex: 1,
      autoHeight: true,
      wrapText: true,
      cellRenderer: (params: ICellRendererParams<ParticipantCommentItem>) => {
        const comment = params.data;
        if (!comment) return null;
        if (editingCommentId === comment.id) {
          return (
            <div className="space-y-2 py-2">
              <textarea
                rows={5}
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                aria-label="Edit comment text"
                className="min-h-[150px] w-full resize-y rounded border border-gray-300 p-2 text-xs"
                disabled={isSavingEdit}
              />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={editIsPinned}
                    onChange={(event) => setEditIsPinned(event.target.checked)}
                  />
                  Pin Comment
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEditComment}
                    className="btn btn-sm btn-secondary"
                    disabled={isSavingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveEdit(comment.id)}
                    className="btn btn-sm btn-primary"
                    disabled={!editText.trim() || isSavingEdit}
                  >
                    {isSavingEdit ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <span className="block whitespace-pre-wrap py-2 text-xs leading-relaxed text-gray-800">
            {comment.text}
          </span>
        );
      },
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      width: 132,
      minWidth: 132,
      maxWidth: 132,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<ParticipantCommentItem>) => {
        const comment = params.data;
        if (!comment) return null;
        return (
          <div className="participant-grid__row-actions">
            <CommentActionTooltipButton
              label={comment.pinned ? 'Unpin comment' : 'Pin comment'}
              disabled={togglingPinId === comment.id}
              className="participant-grid__row-action"
              onClick={(event) => {
                event.stopPropagation();
                void handleTogglePin(comment);
              }}
            >
              {togglingPinId === comment.id
                ? <Loader2 size={14} className="animate-spin" />
                : <Pin size={14} className={comment.pinned ? 'fill-amber-500 text-amber-600' : ''} />}
            </CommentActionTooltipButton>
            {canEditOrDelete(comment) && editingCommentId !== comment.id && (
              <>
                <CommentActionTooltipButton
                  label="Edit comment"
                  onClick={(event) => {
                    event.stopPropagation();
                    startEditComment(comment);
                  }}
                  className="participant-grid__row-action"
                >
                  <Edit2 size={14} />
                </CommentActionTooltipButton>
                <CommentActionTooltipButton
                  label="Delete comment"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteComment(comment);
                  }}
                  className="participant-grid__row-action participant-grid__row-action--danger"
                >
                  <Trash2 size={14} />
                </CommentActionTooltipButton>
              </>
            )}
          </div>
        );
      },
    },
  ], [editingCommentId, editText, editIsPinned, isSavingEdit, togglingPinId, canEditOrDelete, startEditComment, cancelEditComment, handleSaveEdit, handleDeleteComment, handleTogglePin]);

  const defaultColDef = useMemo<ColDef<ParticipantCommentItem>>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
  }), []);
  return (
    <div className="space-y-4">
      {/* Add Comment Form - Legacy Ripple Style */}
      <form onSubmit={handleAddComment} className="comment-editor-wrapper bg-white p-3 rounded border border-gray-200">
        <textarea
          id="comment-input"
          rows={5}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add comment"
          aria-label="Add Comment"
          className="form-textarea min-h-[120px] w-full resize-y rounded border border-gray-300 bg-white text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-between pt-2.5">
          <div className="flex items-center gap-3">
            <label className="text-xs font-normal text-gray-700" style={{ marginRight: '4px' }}>
              Mark Comment As:
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
              <input
                id="comment-checkbox-pin"
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                aria-label="Pin Comment"
              />
              <span>Pin Comment</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={!commentText.trim() || isSubmitting}
            aria-label="Save comment"
            title="Save comment"
          >
            {isSubmitting ? <Loader2 size={13} className="animate-spin inline" /> : 'Save'}
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={fetchComments} className="underline font-semibold hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && comments.length === 0 && (
        <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          <span className="text-xs">Loading comments...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && comments.length === 0 && (
        <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No comments recorded for this participant yet. Enter a note above and click Save.
        </div>
      )}

      {!isLoading && comments.length > 0 && (
        <div>
          <label className="relative mb-3 block max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search comments..."
              aria-label="Search comments"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Clear comments search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </label>
          <DataGrid<ParticipantCommentItem>
            key={editingCommentId || 'comments-grid'}
            wrapperClassName="participant-email-grid"
            rowData={comments}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={searchTerm}
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[5, 10, 20, 50]}
            headerHeight={42}
            animateRows
            suppressCellFocus
            overlayNoRowsTemplate="<span class='text-slate-500'>No comments recorded.</span>"
          />
        </div>
      )}
    </div>
  );
};

export default ParticipantComments;
