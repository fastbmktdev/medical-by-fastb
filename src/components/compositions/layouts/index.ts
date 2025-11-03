/**
 * Application Layout Components
 * 
 * High-level layout components for specific application contexts
 * such as dashboards, authentication pages, etc.
 */

// Application Layouts
export { default as DashboardLayout } from './DashboardLayout';
export type { MenuItem } from './DashboardLayout';
export { AuthLayout } from './AuthLayout';
export type { AuthLayoutProps } from './AuthLayout';

// UI Components (re-exported from ui folder for convenience)
export { default as Header } from './ui/Header';
export { default as Footer } from './ui/Footer';
export { default as SidebarContent } from './ui/SidebarContent';
export { default as LayoutWrapper } from './ui/LayoutWrapper';

