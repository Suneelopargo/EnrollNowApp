// frontend/microfrontends/participant/src/components/ParticipantComments.tsx - Real Backend-Persisted Participant Comments
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pin, Trash2, Loader2, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { requestConfirmation } from '../../../../shared/confirmation';
import { participantApi, ParticipantCommentItem } from '../../../../shared/api/participantApi';

export interface ParticipantCommentsProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
}

export const ParticipantComments: React.FC<ParticipantCommentsProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
}) => {
  const [comments, setComments] = useState<ParticipantCommentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null);

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
          studyId: studyId?.trim() || undefined,
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

  const handleDeleteComment = (comment: ParticipantCommentItem) => {
    void requestConfirmation({
      entityName: 'comment',
      intent: 'danger',
      confirmText: 'Delete Comment',
      loadingText: 'Deleting comment...',
      title: 'Delete Comment',
      message: `Delete this comment for ${participantName}? This action cannot be undone.`,
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString('en-GB') +
        ', ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="record-detail__comment-form">
        <textarea
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={`Add a comment or note regarding ${participantName}...`}
          aria-label="Add comment"
          className="form-textarea"
          disabled={isSubmitting}
        />

        <div className="record-detail__comment-options flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>Pin Comment</span>
          </label>

          <button
            type="submit"
            className="btn btn-sm btn-primary flex items-center gap-1.5"
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Adding...
              </>
            ) : (
              <>
                <Plus size={14} /> Add Comment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Header & Refresh */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
          <MessageSquare size={14} className="text-blue-600" />
          Comments & Notes ({comments.length})
        </span>
        <button
          type="button"
          onClick={fetchComments}
          disabled={isLoading}
          className="btn btn-ghost btn-xs text-gray-500 hover:text-gray-900"
          title="Refresh comments"
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
          <button type="button" onClick={fetchComments} className="underline">
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
          No comments recorded for this participant yet. Enter a note above and click Add Comment.
        </div>
      )}

      {/* Comments List */}
      {!isLoading && comments.length > 0 && (
        <div className="record-detail__comments-list space-y-2.5">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={`record-detail__comment-item p-3 rounded-lg border transition-all ${
                comment.pinned
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="record-detail__comment-header flex items-center justify-between pb-1.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <strong className="record-detail__comment-author text-xs font-semibold text-gray-900">
                    {comment.authorName || 'Current User'}
                  </strong>
                  <span className="record-detail__comment-date text-[11px] text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(comment)}
                    disabled={togglingPinId === comment.id}
                    title={comment.pinned ? 'Unpin comment' : 'Pin comment'}
                    className={`p-1 rounded text-xs flex items-center gap-1 ${
                      comment.pinned
                        ? 'text-amber-700 font-semibold hover:bg-amber-100'
                        : 'text-gray-400 hover:text-amber-600 hover:bg-gray-100'
                    }`}
                  >
                    {togglingPinId === comment.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Pin size={12} className={comment.pinned ? 'fill-amber-500' : ''} />
                    )}
                    {comment.pinned && <span className="text-[11px]">Pinned</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                    title="Delete comment"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p className="record-detail__comment-body text-xs text-gray-800 pt-2 whitespace-pre-wrap">
                {comment.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParticipantComments;
