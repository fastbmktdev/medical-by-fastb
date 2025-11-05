/**
 * Test utilities for cleanup validation and file system mocking
 */

import * as fs from 'fs';
import * as path from 'path';
import { DependencyGraph, FileDependency, AssetUsage, FileType } from '../../src/analysis/types';

export interface MockFileSystem {
  files: Map<string, MockFile>;
  directories: Set<string>;
}

export interface MockFile {
  path: string;
  content: string;
  size: number;
  lastModified: Date;
  type: FileType;
  exists: boolean;
}

export interface TestProjectStructure {
  name: string;
  description: string;
  files: Array<{
    path: string;
    content: string;
    type: FileType;
  }>;
  expectedUnused: string[];
  expectedUsed: string[];
  entryPoints: string[];
}

/**
 * Mock file system for testing cleanup operations
 */
export class MockFileSystemManager {
  private mockFs: MockFileSystem;
  private originalFs: typeof fs;
  private rootDir: string;

  constructor(rootDir: string = '/test-project') {
    this.rootDir = rootDir;
    this.mockFs = {
      files: new Map(),
      directories: new Set()
    };
    this.originalFs = { ...fs };
  }

  /**
   * Create a mock file in the file system
   */
  createFile(filePath: string, content: string, type: FileType = FileType.TYPESCRIPT): void {
    const normalizedPath = path.normalize(filePath);
    const mockFile: MockFile = {
      path: normalizedPath,
      content,
      size: Buffer.byteLength(content, 'utf8'),
      lastModified: new Date(),
      type,
      exists: true
    };

    this.mockFs.files.set(normalizedPath, mockFile);
    
    // Create parent directories
    const dir = path.dirname(normalizedPath);
    this.createDirectory(dir);
  }

  /**
   * Create a mock directory
   */
  createDirectory(dirPath: string): void {
    const normalizedPath = path.normalize(dirPath);
    this.mockFs.directories.add(normalizedPath);
    
    // Create parent directories recursively
    const parent = path.dirname(normalizedPath);
    if (parent !== normalizedPath && parent !== '.') {
      this.createDirectory(parent);
    }
  }

  /**
   * Remove a mock file
   */
  removeFile(filePath: string): void {
    const normalizedPath = path.normalize(filePath);
    const file = this.mockFs.files.get(normalizedPath);
    if (file) {
      file.exists = false;
    }
  }

  /**
   * Check if a file exists in the mock system
   */
  fileExists(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    const file = this.mockFs.files.get(normalizedPath);
    return file ? file.exists : false;
  }

  /**
   * Get file content from mock system
   */
  getFileContent(filePath: string): string | null {
    const normalizedPath = path.normalize(filePath);
    const file = this.mockFs.files.get(normalizedPath);
    return file && file.exists ? file.content : null;
  }

  /**
   * Get all files in the mock system
   */
  getAllFiles(): MockFile[] {
    return Array.from(this.mockFs.files.values()).filter(file => file.exists);
  }

  /**
   * Get files by pattern
   */
  getFilesByPattern(pattern: RegExp): MockFile[] {
    return this.getAllFiles().filter(file => pattern.test(file.path));
  }

  /**
   * Clear the mock file system
   */
  clear(): void {
    this.mockFs.files.clear();
    this.mockFs.directories.clear();
  }

  /**
   * Get mock file system state
   */
  getState(): MockFileSystem {
    return {
      files: new Map(this.mockFs.files),
      directories: new Set(this.mockFs.directories)
    };
  }

  /**
   * Restore state from snapshot
   */
  restoreState(state: MockFileSystem): void {
    this.mockFs = {
      files: new Map(state.files),
      directories: new Set(state.directories)
    };
  }
}/**
 * Tes
t fixture generator for various project structures
 */
export class TestFixtureGenerator {
  /**
   * Generate a simple React project structure
   */
  static generateReactProject(): TestProjectStructure {
    return {
      name: 'simple-react-project',
      description: 'A simple React project with components and utilities',
      files: [
        {
          path: 'src/index.tsx',
          content: `
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/App.tsx',
          content: `
import React from 'react';
import Header from './components/Header';
import { formatDate } from './utils/dateUtils';

function App() {
  return (
    <div>
      <Header />
      <p>Today is {formatDate(new Date())}</p>
    </div>
  );
}

export default App;
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/components/Header.tsx',
          content: `
import React from 'react';

function Header() {
  return <h1>My App</h1>;
}

export default Header;
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/components/UnusedComponent.tsx',
          content: `
import React from 'react';

function UnusedComponent() {
  return <div>This component is never used</div>;
}

export default UnusedComponent;
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/utils/dateUtils.ts',
          content: `
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/utils/unusedUtils.ts',
          content: `
export function unusedFunction(): string {
  return 'This function is never used';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'public/logo.png',
          content: 'mock-image-content',
          type: FileType.ASSET
        },
        {
          path: 'public/unused-image.jpg',
          content: 'mock-unused-image-content',
          type: FileType.ASSET
        }
      ],
      expectedUnused: [
        'src/components/UnusedComponent.tsx',
        'src/utils/unusedUtils.ts',
        'public/unused-image.jpg'
      ],
      expectedUsed: [
        'src/index.tsx',
        'src/App.tsx',
        'src/components/Header.tsx',
        'src/utils/dateUtils.ts'
      ],
      entryPoints: ['src/index.tsx']
    };
  }

  /**
   * Generate a complex project with circular dependencies
   */
  static generateComplexProject(): TestProjectStructure {
    return {
      name: 'complex-project',
      description: 'A complex project with circular dependencies and dynamic imports',
      files: [
        {
          path: 'src/index.ts',
          content: `
import { moduleA } from './moduleA';
import('./dynamicModule').then(module => {
  console.log(module.default);
});

console.log(moduleA);
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/moduleA.ts',
          content: `
import { moduleB } from './moduleB';

export const moduleA = {
  name: 'Module A',
  dependency: moduleB
};
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/moduleB.ts',
          content: `
import { moduleA } from './moduleA';

export const moduleB = {
  name: 'Module B',
  dependency: moduleA
};
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/dynamicModule.ts',
          content: `
export default {
  name: 'Dynamic Module'
};
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/orphanedModule.ts',
          content: `
export const orphaned = 'This module has no references';
          `,
          type: FileType.TYPESCRIPT
        }
      ],
      expectedUnused: ['src/orphanedModule.ts'],
      expectedUsed: [
        'src/index.ts',
        'src/moduleA.ts',
        'src/moduleB.ts',
        'src/dynamicModule.ts'
      ],
      entryPoints: ['src/index.ts']
    };
  }

  /**
   * Generate a test project structure
   */
  static generateTestProject(): TestProjectStructure {
    return {
      name: 'test-project',
      description: 'A project with test files and utilities',
      files: [
        {
          path: 'src/calculator.ts',
          content: `
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/calculator.test.ts',
          content: `
import { add, subtract } from './calculator';

describe('Calculator', () => {
  test('adds numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('subtracts numbers correctly', () => {
    expect(subtract(5, 3)).toBe(2);
  });
});
          `,
          type: FileType.TEST
        },
        {
          path: 'src/unusedFunction.ts',
          content: `
export function unusedFunction(): string {
  return 'unused';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/unusedFunction.test.ts',
          content: `
import { unusedFunction } from './unusedFunction';

describe('UnusedFunction', () => {
  test('returns unused', () => {
    expect(unusedFunction()).toBe('unused');
  });
});
          `,
          type: FileType.TEST
        },
        {
          path: 'tests/test-utils.ts',
          content: `
export function setupTest(): void {
  // Test setup utility
}
          `,
          type: FileType.TYPESCRIPT
        }
      ],
      expectedUnused: [
        'src/unusedFunction.ts',
        'src/unusedFunction.test.ts'
      ],
      expectedUsed: [
        'src/calculator.ts',
        'src/calculator.test.ts',
        'tests/test-utils.ts'
      ],
      entryPoints: ['src/calculator.ts']
    };
  }
}

/**
 * Dependency graph validation utilities
 */
export class DependencyGraphValidator {
  /**
   * Validate dependency graph structure
   */
  static validateGraph(graph: DependencyGraph): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for missing files in dependency references
    for (const [filePath, file] of graph.files) {
      for (const importPath of file.imports) {
        if (!graph.files.has(importPath)) {
          warnings.push(`File ${filePath} imports missing file: ${importPath}`);
        }
      }

      for (const referencePath of file.referencedBy) {
        if (!graph.files.has(referencePath)) {
          errors.push(`File ${filePath} referenced by missing file: ${referencePath}`);
        }
      }
    }

    // Check for orphaned files that should have references
    for (const orphanedFile of graph.orphanedFiles) {
      if (!graph.files.has(orphanedFile)) {
        errors.push(`Orphaned file not found in graph: ${orphanedFile}`);
      }
    }

    // Check for entry points that don't exist
    for (const entryPoint of graph.entryPoints) {
      if (!graph.files.has(entryPoint)) {
        errors.push(`Entry point not found in graph: ${entryPoint}`);
      }
    }

    // Validate circular dependencies
    for (const cycle of graph.circularDependencies) {
      if (cycle.length < 2) {
        errors.push(`Invalid circular dependency: ${cycle.join(' -> ')}`);
      }

      // Check if all files in cycle exist
      for (const filePath of cycle) {
        if (!graph.files.has(filePath)) {
          errors.push(`Circular dependency contains missing file: ${filePath}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a mock dependency graph from test fixture
   */
  static createMockGraph(fixture: TestProjectStructure): DependencyGraph {
    const files = new Map<string, FileDependency>();
    const assets = new Map<string, AssetUsage>();

    // Process each file in the fixture
    for (const file of fixture.files) {
      if (file.type === FileType.ASSET) {
        // Create asset usage entry
        const assetUsage: AssetUsage = {
          assetPath: file.path,
          referencedIn: [],
          usageType: 'static',
          isPublic: file.path.startsWith('public/'),
          isUnused: fixture.expectedUnused.includes(file.path),
          size: Buffer.byteLength(file.content, 'utf8'),
          extension: path.extname(file.path)
        };
        assets.set(file.path, assetUsage);
      } else {
        // Parse imports from file content
        const imports = this.parseImports(file.content);
        const exports = this.parseExports(file.content);

        const fileDependency: FileDependency = {
          filePath: file.path,
          imports,
          exports,
          referencedBy: [],
          references: imports,
          isEntryPoint: fixture.entryPoints.includes(file.path),
          isConfigFile: file.path.includes('.config.') || file.path.includes('config'),
          isDynamic: file.content.includes('import('),
          fileType: file.type,
          size: Buffer.byteLength(file.content, 'utf8'),
          lastModified: new Date()
        };

        files.set(file.path, fileDependency);
      }
    }

    // Build reference relationships
    for (const [filePath, file] of files) {
      for (const importPath of file.imports) {
        const importedFile = files.get(importPath);
        if (importedFile) {
          importedFile.referencedBy.push(filePath);
        }
      }
    }

    // Identify orphaned files
    const orphanedFiles = fixture.expectedUnused.filter(filePath => 
      files.has(filePath) || assets.has(filePath)
    );

    // Mock circular dependencies (if any exist in the fixture)
    const circularDependencies: string[][] = [];
    if (fixture.name === 'complex-project') {
      circularDependencies.push(['src/moduleA.ts', 'src/moduleB.ts']);
    }

    return {
      files,
      assets,
      entryPoints: fixture.entryPoints,
      orphanedFiles,
      circularDependencies
    };
  }

  /**
   * Simple import parser for test content
   */
  private static parseImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Simple export parser for test content
   */
  private static parseExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+(\w+)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }
}

/**
 * Test assertion helpers for cleanup validation
 */
export class CleanupTestAssertions {
  /**
   * Assert that files are correctly identified as unused
   */
  static assertUnusedFiles(
    actualUnused: string[],
    expectedUnused: string[],
    testName: string
  ): void {
    const actualSet = new Set(actualUnused);
    const expectedSet = new Set(expectedUnused);

    const missing = expectedUnused.filter(file => !actualSet.has(file));
    const unexpected = actualUnused.filter(file => !expectedSet.has(file));

    if (missing.length > 0 || unexpected.length > 0) {
      const errors: string[] = [];
      
      if (missing.length > 0) {
        errors.push(`Missing unused files: ${missing.join(', ')}`);
      }
      
      if (unexpected.length > 0) {
        errors.push(`Unexpected unused files: ${unexpected.join(', ')}`);
      }

      throw new Error(`${testName} failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Assert that dependency graph is valid
   */
  static assertValidDependencyGraph(graph: DependencyGraph, testName: string): void {
    const validation = DependencyGraphValidator.validateGraph(graph);
    
    if (!validation.isValid) {
      throw new Error(`${testName} - Invalid dependency graph:\n${validation.errors.join('\n')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn(`${testName} - Warnings:\n${validation.warnings.join('\n')}`);
    }
  }

  /**
   * Assert cleanup safety
   */
  static assertCleanupSafety(
    filesToRemove: string[],
    safeFiles: string[],
    unsafeFiles: string[],
    testName: string
  ): void {
    const safeSet = new Set(safeFiles);
    const unsafeSet = new Set(unsafeFiles);

    const unsafeToRemove = filesToRemove.filter(file => unsafeSet.has(file));
    const missingSafe = filesToRemove.filter(file => !safeSet.has(file) && !unsafeSet.has(file));

    if (unsafeToRemove.length > 0) {
      throw new Error(`${testName} - Attempting to remove unsafe files: ${unsafeToRemove.join(', ')}`);
    }

    if (missingSafe.length > 0) {
      console.warn(`${testName} - Files not categorized as safe/unsafe: ${missingSafe.join(', ')}`);
    }
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(
    fn: () => Promise<T>,
    testName: string
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    
    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    console.log(`${testName} execution time: ${executionTime.toFixed(2)}ms`);
    
    return { result, executionTime };
  }

  /**
   * Generate large project structure for performance testing
   */
  static generateLargeProject(fileCount: number): TestProjectStructure {
    const files: Array<{ path: string; content: string; type: FileType }> = [];
    const expectedUnused: string[] = [];
    const expectedUsed: string[] = [];

    // Create entry point
    files.push({
      path: 'src/index.ts',
      content: `
import { component1 } from './components/component1';
console.log(component1);
      `,
      type: FileType.TYPESCRIPT
    });
    expectedUsed.push('src/index.ts');

    // Generate components
    for (let i = 1; i <= fileCount; i++) {
      const isUsed = i <= Math.floor(fileCount * 0.7); // 70% used, 30% unused
      const componentPath = `src/components/component${i}.ts`;
      
      files.push({
        path: componentPath,
        content: `
export const component${i} = {
  name: 'Component ${i}',
  id: ${i}
};
        `,
        type: FileType.TYPESCRIPT
      });

      if (isUsed) {
        expectedUsed.push(componentPath);
        
        // Add import to previous component or index
        if (i === 1) {
          // Already imported in index
        } else {
          const importerPath = `src/components/component${i - 1}.ts`;
          const importerIndex = files.findIndex(f => f.path === importerPath);
          if (importerIndex !== -1) {
            files[importerIndex].content += `\nimport { component${i} } from './component${i}';`;
          }
        }
      } else {
        expectedUnused.push(componentPath);
      }
    }

    return {
      name: `large-project-${fileCount}`,
      description: `Large project with ${fileCount} files for performance testing`,
      files,
      expectedUnused,
      expectedUsed,
      entryPoints: ['src/index.ts']
    };
  }
}