// API Utilities Barrel Export
export { withAdminAuth } from './withAdminAuth';
export { apiClient, apiGet, apiPost, apiPut, apiDelete } from './client';
export {
  isUUID,
  checkIsAdmin,
  getUserAndAdminStatus,
  incrementViewCount,
  buildSlugOrIdQuery,
} from './route-utils';
export {
  successResponse,
  errorResponse,
  withErrorHandler,
  validateRequestBody,
  requireAuth,
  requireAdmin,
  requirePartner,
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  type ApiResponse,
} from './error-handler';
export {
  handleGlobalError,
  withGlobalErrorHandler,
  safeAsync,
  retryOperation,
  type GlobalErrorContext,
} from './global-error-handler';
export {
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  createRouteHandler,
} from './route-wrapper';
