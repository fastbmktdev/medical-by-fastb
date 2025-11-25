'use client';

import { useState } from 'react';
import { Card, CardBody, Avatar, Chip, Button, Textarea } from '@heroui/react';
import {
  CheckBadgeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import type { HospitalReviewWithReply } from '@shared/types/review.types';
import { formatDistanceToNow } from 'date-fns';
import { th, ja, enUS } from 'date-fns/locale';

interface ReviewCardProps {
  review: HospitalReviewWithReply;
  onReply?: (reviewId: string, message: string) => Promise<void>;
  onEditReply?: (reviewId: string, message: string) => Promise<void>;
  onDeleteReply?: (reviewId: string) => Promise<void>;
  isPartner?: boolean;
  locale?: string;
}

export function ReviewCard({
  review,
  onReply,
  onEditReply,
  onDeleteReply,
  isPartner = false,
  locale = 'th',
}: ReviewCardProps) {
  const t = useTranslations('reviews');
  const [isReplying, setIsReplying] = useState(false);
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState(review.reply?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDateLocale = () => {
    switch (locale) {
      case 'th':
        return th;
      case 'ja':
      case 'jp':
        return ja;
      default:
        return enUS;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: getDateLocale(),
      });
    } catch {
      return dateString;
    }
  };

  const handleSubmitReply = async () => {
    if (!replyMessage.trim() || !onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(review.id, replyMessage.trim());
      setReplyMessage('');
      setIsReplying(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReply = async () => {
    if (!replyMessage.trim() || !onEditReply) return;

    setIsSubmitting(true);
    try {
      await onEditReply(review.id, replyMessage.trim());
      setIsEditingReply(false);
    } catch (error) {
      console.error('Error updating reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!onDeleteReply) return;
    if (!confirm(t('reply.confirmDelete'))) return;

    setIsSubmitting(true);
    try {
      await onDeleteReply(review.id);
    } catch (error) {
      console.error('Error deleting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-warning-500' : 'text-default-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardBody className="gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <Avatar
              src={review.user_avatar_url || undefined}
              name={review.user_full_name || 'Anonymous'}
              size="md"
              className="shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-default-900">
                  {review.user_full_name || 'Anonymous User'}
                </p>
                {review.is_verified_visit && (
                  <CheckBadgeIcon className="h-5 w-5 text-primary-500" title={t('card.verified')} />
                )}
              </div>
              <p className="text-xs text-default-500">
                {formatDate(review.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {renderStars(review.rating)}
            {review.status && review.status !== 'approved' && (
              <Chip
                size="sm"
                variant="flat"
                color={
                  review.status === 'pending'
                    ? 'warning'
                    : review.status === 'rejected'
                    ? 'danger'
                    : 'default'
                }
              >
                {review.status}
              </Chip>
            )}
          </div>
        </div>

        {/* Title */}
        {review.title && (
          <h4 className="font-semibold text-default-900">{review.title}</h4>
        )}

        {/* Comment */}
        <p className="text-default-700 whitespace-pre-wrap">{review.comment}</p>

        {/* Visit Date & Recommendation */}
        <div className="flex flex-wrap gap-2">
          {review.visit_date && (
            <Chip size="sm" variant="flat" color="default">
              {t('card.visitDate')}: {new Date(review.visit_date).toLocaleDateString()}
            </Chip>
          )}
          {review.recommend && (
            <Chip size="sm" variant="flat" color="success" startContent={<HeartIcon className="h-4 w-4" />}>
              {t('card.recommend')}
            </Chip>
          )}
        </div>

        {/* Helpful Count */}
        {review.helpful_count > 0 && (
          <p className="text-xs text-default-500">
            {review.helpful_count} {t('card.helpful')}
          </p>
        )}

        {/* Reply Section */}
        {review.reply && !isEditingReply && (
          <div className="mt-2  bg-default-100 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-500" />
                <p className="font-semibold text-default-900">{t('card.yourReply')}</p>
                {review.reply.is_edited && (
                  <span className="text-xs text-default-500">({t('card.edited')})</span>
                )}
              </div>
              {isPartner && (
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setReplyMessage(review.reply!.message);
                      setIsEditingReply(true);
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={handleDeleteReply}
                    isLoading={isSubmitting}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-default-700 whitespace-pre-wrap">{review.reply.message}</p>
            <p className="mt-2 text-xs text-default-500">
              {formatDate(review.reply.created_at)}
            </p>
          </div>
        )}

        {/* Edit Reply Form */}
        {isEditingReply && (
          <div className="mt-2 space-y-3">
            <Textarea
              label={t('reply.title')}
              placeholder={t('reply.placeholder')}
              value={replyMessage}
              onValueChange={setReplyMessage}
              minRows={3}
              maxRows={6}
            />
            <div className="flex gap-2">
              <Button
                color="primary"
                onPress={handleUpdateReply}
                isLoading={isSubmitting}
                isDisabled={!replyMessage.trim()}
              >
                {t('reply.update')}
              </Button>
              <Button
                variant="flat"
                onPress={() => {
                  setIsEditingReply(false);
                  setReplyMessage(review.reply?.message || '');
                }}
              >
                {t('reply.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Reply Form */}
        {isPartner && !review.reply && isReplying && (
          <div className="mt-2 space-y-3">
            <Textarea
              label={t('reply.title')}
              placeholder={t('reply.placeholder')}
              value={replyMessage}
              onValueChange={setReplyMessage}
              minRows={3}
              maxRows={6}
            />
            <div className="flex gap-2">
              <Button
                color="primary"
                onPress={handleSubmitReply}
                isLoading={isSubmitting}
                isDisabled={!replyMessage.trim()}
              >
                {t('reply.submit')}
              </Button>
              <Button
                variant="flat"
                onPress={() => {
                  setIsReplying(false);
                  setReplyMessage('');
                }}
              >
                {t('reply.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Reply Button */}
        {isPartner && !review.reply && !isReplying && (
          <Button
            color="primary"
            variant="flat"
            startContent={<ChatBubbleLeftRightIcon className="h-5 w-5" />}
            onPress={() => setIsReplying(true)}
            className="self-start"
          >
            {t('card.reply')}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

