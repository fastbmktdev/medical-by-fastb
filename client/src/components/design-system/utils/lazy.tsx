/**
 * Lazy Loading Utilities
 * 
 * Utilities for lazy loading heavy components and optimizing bundle size.
 */

import React, { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Create a lazy-loaded component with better error handling
 */
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  displayName?: string
): LazyExoticComponent<T> {
  const LazyComponent = lazy(async () => {
    try {
      const importedModule = await importFn();
      return importedModule;
    } catch (error) {
      console.error(`Failed to load lazy component ${displayName || 'Unknown'}:`, error);
      // Return a fallback component
      const FallbackComponent: T = (() => (
        <div className="p-4 text-center text-red-400">
          Failed to load component
        </div>
      )) as unknown as T;
      return {
        default: FallbackComponent,
      };
    }
  });

  if (displayName) {
    // Type assertion to set displayName on LazyExoticComponent
    (LazyComponent as LazyExoticComponent<T> & { displayName?: string }).displayName = `Lazy(${displayName})`;
  }

  return LazyComponent;
}

/**
 * Create a lazy-loaded component with preloading capability
 */
export function createPreloadableLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  displayName?: string
) {
  let preloadPromise: Promise<{ default: T }> | null = null;

  const preload = () => {
    if (!preloadPromise) {
      preloadPromise = importFn();
    }
    return preloadPromise;
  };

  const LazyComponent = createLazyComponent(
    () => preloadPromise || importFn(),
    displayName
  );

  return {
    Component: LazyComponent,
    preload,
  };
}

/**
 * Lazy load compositions that are typically heavy
 */
export const LazyCompositions = {
  // Modal compositions
  Modal: createLazyComponent(
    () => import('@/components/compositions/modals/Modal').then(module => ({ default: module.Modal as unknown as ComponentType<Record<string, unknown>> })),
    'Modal'
  ),
  ConfirmationModal: createLazyComponent(
    () => import('@/components/compositions/modals/ConfirmationModal').then(module => ({ default: module.ConfirmationModal as unknown as ComponentType<Record<string, unknown>> })),
    'ConfirmationModal'
  ),
  FormModal: createLazyComponent(
    () => import('@/components/compositions/modals/FormModal').then(module => ({ default: module.FormModal as unknown as ComponentType<Record<string, unknown>> })),
    'FormModal'
  ),
  InfoModal: createLazyComponent(
    () => import('@/components/compositions/modals/InfoModal').then(module => ({ default: module.InfoModal as unknown as ComponentType<Record<string, unknown>> })),
    'InfoModal'
  ),

  // Data display compositions
  DataTable: createLazyComponent(
    () => import('@/components/compositions/data/DataTable').then(module => ({ default: module.DataTable as unknown as ComponentType<Record<string, unknown>> })),
    'DataTable'
  ),
  DataList: createLazyComponent(
    () => import('@/components/compositions/data/DataList').then(module => ({ default: module.DataList as unknown as ComponentType<Record<string, unknown>> })),
    'DataList'
  ),
  DataGrid: createLazyComponent(
    () => import('@/components/compositions/data/DataGrid').then(module => ({ default: module.DataGrid as unknown as ComponentType<Record<string, unknown>> })),
    'DataGrid'
  ),

  // Page compositions
  DashboardPage: createLazyComponent(
    () => import('@/components/compositions/pages/DashboardPage').then(module => ({ default: module.DashboardPage as unknown as ComponentType<Record<string, unknown>> })),
    'DashboardPage'
  ),
  AuthPage: createLazyComponent(
    () => import('@/components/compositions/pages/AuthPage').then(module => ({ default: module.AuthPage as unknown as ComponentType<Record<string, unknown>> })),
    'AuthPage'
  ),
};

/**
 * Preloadable compositions for better UX
 */
export const PreloadableCompositions = {
  Modal: createPreloadableLazyComponent(
    () => import('@/components/compositions/modals/Modal').then(module => ({ default: module.Modal as unknown as ComponentType<Record<string, unknown>> })),
    'Modal'
  ),
  DataTable: createPreloadableLazyComponent(
    () => import('@/components/compositions/data/DataTable').then(module => ({ default: module.DataTable as unknown as ComponentType<Record<string, unknown>> })),
    'DataTable'
  ),
  FormModal: createPreloadableLazyComponent(
    () => import('@/components/compositions/modals/FormModal').then(module => ({ default: module.FormModal as unknown as ComponentType<Record<string, unknown>> })),
    'FormModal'
  ),
};