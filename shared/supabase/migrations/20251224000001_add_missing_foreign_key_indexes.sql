-- Migration: Add Missing Foreign Key Indexes
-- Description: Adds indexes for foreign key columns that don't have covering indexes
-- This improves query performance for joins and foreign key constraint checks
-- Generated: 2024-12-24

-- article_versions.created_by
CREATE INDEX IF NOT EXISTS idx_article_versions_created_by 
ON public.article_versions(created_by);

-- appointments.package_id
CREATE INDEX IF NOT EXISTS idx_bookings_package_id 
ON public.appointments(package_id);

-- conversations.last_message_sender_id
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_sender_id 
ON public.conversations(last_message_sender_id);

-- gallery_views.viewer_id
CREATE INDEX IF NOT EXISTS idx_gallery_views_viewer_id 
ON public.gallery_views(viewer_id);

-- hospital_gallery.uploaded_by
CREATE INDEX IF NOT EXISTS idx_hospital_gallery_uploaded_by 
ON public.hospital_gallery(uploaded_by);

-- hospital_reviews.booking_id
CREATE INDEX IF NOT EXISTS idx_hospital_reviews_booking_id 
ON public.hospital_reviews(booking_id);

-- hospital_reviews.moderated_by
CREATE INDEX IF NOT EXISTS idx_hospital_reviews_moderated_by 
ON public.hospital_reviews(moderated_by);

-- messages.read_by
CREATE INDEX IF NOT EXISTS idx_messages_read_by 
ON public.messages(read_by);

-- messages.reply_to_message_id
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id 
ON public.messages(reply_to_message_id);

-- payment_disputes.responded_by
CREATE INDEX IF NOT EXISTS idx_payment_disputes_responded_by 
ON public.payment_disputes(responded_by);

-- product_orders.shipping_method_id
CREATE INDEX IF NOT EXISTS idx_product_orders_shipping_method_id 
ON public.product_orders(shipping_method_id);

-- promotions.created_by
CREATE INDEX IF NOT EXISTS idx_promotions_created_by 
ON public.promotions(created_by);

-- review_flags.flagged_by
CREATE INDEX IF NOT EXISTS idx_review_flags_flagged_by 
ON public.review_flags(flagged_by);

-- review_flags.resolved_by
CREATE INDEX IF NOT EXISTS idx_review_flags_resolved_by 
ON public.review_flags(resolved_by);

-- shipping_history.updated_by
CREATE INDEX IF NOT EXISTS idx_shipping_history_updated_by 
ON public.shipping_history(updated_by);

-- Add comments for documentation
COMMENT ON INDEX idx_article_versions_created_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_bookings_package_id IS 'Foreign key index for performance';
COMMENT ON INDEX idx_conversations_last_message_sender_id IS 'Foreign key index for performance';
COMMENT ON INDEX idx_gallery_views_viewer_id IS 'Foreign key index for performance';
COMMENT ON INDEX idx_hospital_gallery_uploaded_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_hospital_reviews_booking_id IS 'Foreign key index for performance';
COMMENT ON INDEX idx_hospital_reviews_moderated_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_messages_read_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_messages_reply_to_message_id IS 'Foreign key index for performance';
COMMENT ON INDEX idx_payment_disputes_responded_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_product_orders_shipping_method_id IS 'Foreign key index for performance';
COMMENT ON INDEX idx_promotions_created_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_review_flags_flagged_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_review_flags_resolved_by IS 'Foreign key index for performance';
COMMENT ON INDEX idx_shipping_history_updated_by IS 'Foreign key index for performance';

