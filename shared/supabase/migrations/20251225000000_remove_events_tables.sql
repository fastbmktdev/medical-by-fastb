-- Remove Events Tables Migration
-- Migration: 20251225000000_remove_events_tables.sql
-- Drops events-related tables that were never implemented

-- Drop indexes first (they will be automatically dropped with tables, but being explicit)
DROP INDEX IF EXISTS idx_event_tickets_type;
DROP INDEX IF EXISTS idx_event_tickets_active;
DROP INDEX IF EXISTS idx_event_tickets_event;

DROP INDEX IF EXISTS idx_events_images_gin;
DROP INDEX IF EXISTS idx_events_location;
DROP INDEX IF EXISTS idx_events_featured;
DROP INDEX IF EXISTS idx_events_published;
DROP INDEX IF EXISTS idx_events_status;
DROP INDEX IF EXISTS idx_events_date;
DROP INDEX IF EXISTS idx_events_category;
DROP INDEX IF EXISTS idx_events_slug;

DROP INDEX IF EXISTS idx_event_categories_active;
DROP INDEX IF EXISTS idx_event_categories_slug;

-- Drop tables in order (respecting foreign key dependencies)
-- event_tickets has foreign key to events, so drop it first
DROP TABLE IF EXISTS event_tickets CASCADE;

-- events has foreign key to event_categories, so drop it next
DROP TABLE IF EXISTS events CASCADE;

-- Finally drop event_categories
DROP TABLE IF EXISTS event_categories CASCADE;

