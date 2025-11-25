/**
 * Route Loader
 * 
 * Automatically discovers and mounts all route.ts files from server/src/routes/
 * Converts Next.js route format to Express routes
 */

import { Express, Router } from 'express';
import { readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { adaptNextRoute, adaptWrappedRoute } from './next-to-express-adapter';

// Get directory path that works in both ES modules and CommonJS
function getDirname() {
  try {
    // ES modules
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    // CommonJS fallback
    return __dirname;
  }
}

const ROUTES_DIR = join(getDirname(), '../routes');
const API_PREFIX = '/api';

/**
 * Convert file path to Express route path
 * Examples:
 * - routes/health/route.ts → /health
 * - routes/hospitals/[id]/route.ts → /hospitals/:id
 * - routes/articles/[id]/versions/[versionId]/route.ts → /articles/:id/versions/:versionId
 */
function filePathToRoutePath(filePath: string): string {
  // Get relative path from routes directory
  const relativePath = relative(ROUTES_DIR, filePath);
  
  // Remove 'route.ts' from the end
  let routePath = relativePath.replace(/\/route\.ts$/, '');
  
  // Replace [param] with :param (Express dynamic segments)
  // This handles both [id] and [id]-admin patterns
  routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');
  
  // Remove leading slash if present
  routePath = routePath.replace(/^\//, '');
  
  // Handle root route
  if (!routePath || routePath === 'route.ts') {
    return '';
  }
  
  return '/' + routePath;
}

/**
 * Recursively find all route.ts files
 */
function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Load and mount a single route file
 */
async function loadRoute(routePath: string, filePath: string, router: Router): Promise<void> {
  try {
    // Convert to file:// URL for ES module imports
    // This ensures compatibility with Node.js ES modules
    const importUrl = pathToFileURL(filePath).href;
    const routeModule = await import(importUrl);
    
    // Get the route path (e.g., /hospitals/:id)
    const expressRoutePath = routePath || '/';
    
    // Mount each HTTP method handler
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
    let mountedCount = 0;
    
    for (const method of methods) {
      const handler = routeModule[method];
      
      if (handler && typeof handler === 'function') {
        // Check if handler is wrapped (has context.params signature)
        // Most handlers that use withAdminAuth or similar will have this signature
        const isWrapped = handler.length >= 2; // Wrapped handlers typically have 2+ params
        
        if (isWrapped) {
          router[method.toLowerCase() as Lowercase<typeof method>](
            expressRoutePath,
            adaptWrappedRoute(handler)
          );
        } else {
          router[method.toLowerCase() as Lowercase<typeof method>](
            expressRoutePath,
            adaptNextRoute(handler)
          );
        }
        
        console.log(`  ✓ Mounted ${method} ${API_PREFIX}${expressRoutePath}`);
        mountedCount++;
      }
    }
    
    if (mountedCount === 0) {
      console.warn(`  ⚠ No handlers found in ${filePath}`);
    }
  } catch (error) {
    console.error(`Failed to load route ${filePath}:`, error);
    // Don't throw - continue loading other routes
    console.error(`  Continuing with other routes...`);
  }
}

/**
 * Load all routes and mount them on the Express app
 */
export async function loadRoutes(app: Express): Promise<void> {
  console.log('Loading routes from:', ROUTES_DIR);
  
  // Find all route.ts files
  const routeFiles = findRouteFiles(ROUTES_DIR);
  
  console.log(`Found ${routeFiles.length} route files`);
  
  // Create a router for all API routes
  const apiRouter = Router();
  
  // Load each route
  for (const filePath of routeFiles) {
    const routePath = filePathToRoutePath(filePath);
    await loadRoute(routePath, filePath, apiRouter);
  }
  
  // Mount the API router with prefix
  app.use(API_PREFIX, apiRouter);
  
  console.log(`\n✅ Successfully mounted ${routeFiles.length} route files`);
}

