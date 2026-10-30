// frontend/microfrontends/participant/src/components/ParticipantComments.tsx - Legacy Ripple Compatible Participant Comments
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Pin, Trash2, Edit2, Loader2, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthUser } from '../../../../shared/contracts';
import { getStoredAuthUser, getApiErrorMessage } from '../../../../shared/api-client';
import { toast } from '../../../../shared/toaster';
import { requestConfirmation } from '../../../../shared/confirmation';
import { participantApi, ParticipantCommentItem } from '../../../../shared/api/participantApi';

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

  // Hovered avatar for custom tooltip
  const [hoveredAvatarId, setHoveredAvatarId] = useState<string | null>(null);

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

  const getInitials = (name?: string) => {
    if (!name) return 'SK';
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
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

  return (
    <div className="space-y-4">
      {/* Add Comment Form - Legacy Ripple Style */}
      <form onSubmit={handleAddComment} className="comment-editor-wrapper bg-white p-3 rounded border border-gray-200">
        <textarea
          id="comment-input"
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add comment"
          aria-label="Add Comment"
          className="form-textarea w-full text-xs rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
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
            className="btn btn-sm btn-primary px-4 py-1.5 text-xs font-medium custom-tooltip-btn"
            disabled={!commentText.trim() || isSubmitting}
            style={{ minWidth: '70px', backgroundColor: '#1d4ed8', color: '#ffffff' }}
            aria-label="Save comment"
            data-tooltip="Save comment"
          >
            {isSubmitting ? <Loader2 size={13} className="animate-spin inline" /> : 'Save'}
          </button>
        </div>
      </form>

      {/* Header & Refresh */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <MessageSquare size={14} className="text-blue-600" />
          Comments & Notes ({comments.length})
        </span>
        <button
          type="button"
          onClick={fetchComments}
          disabled={isLoading}
          className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-900 custom-tooltip-btn"
          data-tooltip="Refresh comments"
          aria-label="Refresh comments"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

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

      {/* Comments List - Legacy Ripple CommentItem Layout */}
      {!isLoading && comments.length > 0 && (
        <div className="record-detail__comments-list space-y-2.5">
          {comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const canModify = canEditOrDelete(comment);
            const edited = isCommentEdited(comment);
            const authorName = getCommentAuthorName(comment);
            const initials = getInitials(authorName);

            return (
              <div
                key={comment.id}
                className="record-detail__comment-item p-3 rounded border border-gray-200 transition-all"
                style={{ backgroundColor: '#f4f5f7' }}
              >
                {/* Line 1: Avatar with initials + tooltip, Date, Pin, Global Badge, and Action Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* User Avatar: White box with border & dark text, plus custom tooltip matching screenshot */}
                    <div
                      className="comment-avatar-wrap"
                      onMouseEnter={() => setHoveredAvatarId(comment.id)}
                      onMouseLeave={() => setHoveredAvatarId(null)}
                      data-testid={`comment-avatar-${comment.id}`}
                    >
                      <span>{initials}</span>

                      {/* Tooltip matching screenshot with downward pointing triangle */}
                      <div
                        className={`comment-avatar-tooltip ${hoveredAvatarId === comment.id ? 'is-visible' : ''}`}
                        role="tooltip"
                      >
                        {authorName}
                      </div>
                    </div>

                    {/* Date and edited indicator */}
                    <span className="text-xs text-gray-800 font-normal">
                      {formatCommentDate(comment.createdAt)}
                      {edited && ` (edited ${formatCommentDate(comment.updatedAt)})`}
                    </span>

                    {/* Pin icon (if pinned) placed right next to date */}
                    {comment.pinned && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(comment)}
                        disabled={togglingPinId === comment.id}
                        title="Pinned comment (click to unpin)"
                        className="inline-flex items-center text-gray-900 hover:text-amber-700 cursor-pointer p-0 border-0 bg-transparent"
                        aria-label="Pinned comment"
                      >
                        <Pin size={13} className="fill-gray-900 text-gray-900 -rotate-45" />
                      </button>
                    )}

                    {/* Global (Registry) badge placed right next to date & pin */}
                    {comment.global && (
                      <span
                        className="badge-global-comment"
                        style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                          backgroundColor: '#0284c7',
                          borderRadius: '9999px',
                          lineHeight: '1.4',
                        }}
                      >
                        Global (Registry)
                      </span>
                    )}
                  </div>

                  {/* Action buttons (Edit & Delete) on Right */}
                  {canModify && !isEditing && (
                    <div className="flex items-center gap-2">
                      {/* Edit Button: white rectangular box with pencil icon */}
                      <button
                        type="button"
                        onClick={() => startEditComment(comment)}
                        className="btn-edit-comment custom-tooltip-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 6px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          color: '#374151',
                        }}
                        data-tooltip="Edit comment"
                        aria-label="Edit comment"
                        data-testid={`comment-edit-${comment.id}`}
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete Button: red rectangular box with white trash icon */}
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment)}
                        className="btn-delete-comment custom-tooltip-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '3px 6px',
                          backgroundColor: '#d9534f',
                          border: '1px solid #d43f3a',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          color: '#ffffff',
                        }}
                        data-tooltip="Delete comment"
                        aria-label="Delete comment"
                        data-testid={`comment-delete-${comment.id}`}
                      >
                        <Trash2 size={13} color="#ffffff" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Editing Form */}
                {isEditing ? (
                  <div className="p-3 bg-white rounded border border-blue-200 space-y-2 mt-2">
                    <textarea
                      rows={3}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Update comment"
                      className="form-textarea w-full text-xs rounded border border-gray-300 bg-white"
                      disabled={isSavingEdit}
                      aria-label="Edit comment text"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-normal text-gray-700">
                          Mark Comment As:
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={editIsPinned}
                            onChange={(e) => setEditIsPinned(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Pin Comment</span>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelEditComment}
                          className="btn btn-sm btn-secondary px-3 py-1 text-xs"
                          disabled={isSavingEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(comment.id)}
                          className="btn btn-sm btn-primary px-4 py-1 text-xs"
                          disabled={!editText.trim() || isSavingEdit}
                          style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
                        >
                          {isSavingEdit ? <Loader2 size={13} className="animate-spin inline" /> : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Comment text directly below the header line */
                  <div className="text-xs text-gray-900 mt-2 whitespace-pre-wrap leading-relaxed">
                    {comment.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParticipantComments;
