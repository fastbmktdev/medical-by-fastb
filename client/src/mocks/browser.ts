/**
 * MSW browser setup
 * This file initializes MSW for browser environment
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create MSW worker with all handlers
export const worker = setupWorker(...handlers);

