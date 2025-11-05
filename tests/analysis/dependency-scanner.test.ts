/**
 * Unit tests for dependency scanner functionality
 */

import { DependencyScanner } from '../../src/analysis/dependency-scanner';
import { FileType } from '../../src/analysis/types';
import { 
  MockFileSystemManager, 
  TestFixtureGenerator, 
  DependencyGraphValidator,
  CleanupTestAssertions 
} from './test-utilities';
import { TestFixtures } from './test-fixtures';

describe('DependencyScanner', () => {
  let mockFs: MockFileSystemManager;
  let scanner: DependencyScanner;
  const testRootDir = '/test-project';

  beforeEach(() => {
    mockFs = new MockFileSystemManager(testRootDir);
    scanner = new DependencyScanner(testRootDir);
  });

  afterEach(() => {
    mockFs.clear();
  });

  describe('buildDependencyGraph', () => {
    test('should build correct dependency graph for simple React project', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateReactProject();
      
      // Create mock files
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      CleanupTestAssertions.assertValidDependencyGraph(graph, 'Simple React Project');
      
      expect(graph.files.size).toBeGreaterThan(0);
      expect(graph.entryPoints).toContain('src/index.tsx');
      expect(graph.orphanedFiles).toContain('src/components/UnusedComponent.tsx');
      expect(graph.orphanedFiles).toContain('src/utils/unusedUtils.ts');
    });

    test('should detect circular dependencies', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateComplexProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      expect(graph.circularDependencies.length).toBeGreaterThan(0);
      
      // Should detect the circular dependency between moduleA and moduleB
      const hasCircularDep = graph.circularDependencies.some(cycle => 
        cycle.includes('src/moduleA.ts') && cycle.includes('src/moduleB.ts')
      );
      expect(hasCircularDep).toBe(true);
    });

    test('should handle dynamic imports correctly', async () => {
      // Arrange
      const fixture = TestFixtures.getDynamicImportProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      const indexFile = graph.files.get('src/index.ts');
      expect(indexFile).toBeDefined();
      expect(indexFile?.isDynamic).toBe(true);
      
      // Dynamic module should be marked as referenced
      const dynamicModule = graph.files.get('src/dynamicModule.ts');
      expect(dynamicModule).toBeDefined();
      expect(dynamicModule?.referencedBy).toContain('src/index.ts');
    });

    test('should identify entry points correctly', async () => {
      // Arrange
      const fixture = TestFixtures.getNextJsProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      expect(graph.entryPoints).toContain('pages/_app.tsx');
      expect(graph.entryPoints).toContain('pages/index.tsx');
      expect(graph.entryPoints).toContain('pages/about.tsx');
      
      // Entry points should be marked correctly
      const appFile = graph.files.get('pages/_app.tsx');
      expect(appFile?.isEntryPoint).toBe(true);
    });

    test('should handle configuration files properly', async () => {
      // Arrange
      const fixture = TestFixtures.getConfigHeavyProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      const configFiles = Array.from(graph.files.values()).filter(file => file.isConfigFile);
      expect(configFiles.length).toBeGreaterThan(0);
      
      // Config files should not be marked as orphaned even if not directly imported
      const webpackConfig = graph.files.get('webpack.config.js');
      expect(webpackConfig?.isConfigFile).toBe(true);
    });
  });

  describe('parseFileImports', () => {
    test('should parse ES6 imports correctly', () => {
      // Arrange
      const content = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
        import type { User } from './types';
        import './styles.css';
      `;

      // Act
      const imports = scanner.parseFileImports(content, 'src/component.tsx');

      // Assert
      expect(imports).toContain('react');
      expect(imports).toContain('./utils');
      expect(imports).toContain('./types');
      expect(imports).toContain('./styles.css');
    });

    test('should parse CommonJS requires correctly', () => {
      // Arrange
      const content = `
        const fs = require('fs');
        const path = require('path');
        const utils = require('./utils');
        const { helper } = require('./helper');
      `;

      // Act
      const imports = scanner.parseFileImports(content, 'src/node-script.js');

      // Assert
      expect(imports).toContain('fs');
      expect(imports).toContain('path');
      expect(imports).toContain('./utils');
      expect(imports).toContain('./helper');
    });

    test('should parse dynamic imports correctly', () => {
      // Arrange
      const content = `
        const loadModule = async () => {
          const module = await import('./dynamic-module');
          return module.default;
        };
        
        import('./another-module').then(m => console.log(m));
      `;

      // Act
      const imports = scanner.parseFileImports(content, 'src/dynamic.ts');

      // Assert
      expect(imports).toContain('./dynamic-module');
      expect(imports).toContain('./another-module');
    });

    test('should handle string-based references', () => {
      // Arrange
      const content = `
        const imagePath = '/assets/logo.png';
        const configPath = './config/settings.json';
        const templatePath = 'templates/email.html';
      `;

      // Act
      const imports = scanner.parseFileImports(content, 'src/references.ts');

      // Assert
      expect(imports).toContain('/assets/logo.png');
      expect(imports).toContain('./config/settings.json');
      expect(imports).toContain('templates/email.html');
    });
  });

  describe('parseFileExports', () => {
    test('should parse ES6 exports correctly', () => {
      // Arrange
      const content = `
        export const myConstant = 'value';
        export function myFunction() {}
        export class MyClass {}
        export interface MyInterface {}
        export type MyType = string;
        export default MyComponent;
      `;

      // Act
      const exports = scanner.parseFileExports(content, 'src/exports.ts');

      // Assert
      expect(exports).toContain('myConstant');
      expect(exports).toContain('myFunction');
      expect(exports).toContain('MyClass');
      expect(exports).toContain('MyInterface');
      expect(exports).toContain('MyType');
      expect(exports).toContain('default');
    });

    test('should parse CommonJS exports correctly', () => {
      // Arrange
      const content = `
        module.exports = {
          helper: function() {},
          constant: 'value'
        };
        
        exports.anotherHelper = function() {};
      `;

      // Act
      const exports = scanner.parseFileExports(content, 'src/commonjs.js');

      // Assert
      expect(exports).toContain('helper');
      expect(exports).toContain('constant');
      expect(exports).toContain('anotherHelper');
    });
  });

  describe('resolveImportPath', () => {
    test('should resolve relative imports correctly', () => {
      // Test cases for relative path resolution
      const testCases = [
        {
          importPath: './utils',
          currentFile: 'src/components/Button.tsx',
          expected: 'src/components/utils'
        },
        {
          importPath: '../helpers/format',
          currentFile: 'src/components/Button.tsx',
          expected: 'src/helpers/format'
        },
        {
          importPath: '../../lib/api',
          currentFile: 'src/components/forms/Input.tsx',
          expected: 'src/lib/api'
        }
      ];

      testCases.forEach(({ importPath, currentFile, expected }) => {
        const resolved = scanner.resolveImportPath(importPath, currentFile);
        expect(resolved).toBe(expected);
      });
    });

    test('should handle absolute imports correctly', () => {
      // Arrange & Act
      const resolved = scanner.resolveImportPath('react', 'src/component.tsx');

      // Assert
      expect(resolved).toBe('react'); // Should remain unchanged for node_modules
    });

    test('should handle path aliases correctly', () => {
      // This would test path alias resolution if implemented
      // For now, just ensure it doesn't break
      const resolved = scanner.resolveImportPath('@/utils', 'src/component.tsx');
      expect(resolved).toBe('@/utils');
    });
  });

  describe('performance tests', () => {
    test('should handle large projects efficiently', async () => {
      // Arrange
      const largeFixture = TestFixtureGenerator.generateLargeProject(1000);
      
      for (const file of largeFixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act & Assert
      const startTime = Date.now();
      const graph = await scanner.buildDependencyGraph();
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      console.log(`Large project analysis took ${executionTime}ms`);
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(5000); // 5 seconds
      expect(graph.files.size).toBe(largeFixture.files.length);
    });
  });

  describe('error handling', () => {
    test('should handle malformed files gracefully', async () => {
      // Arrange
      mockFs.createFile('src/malformed.ts', 'import { from ./broken', FileType.TYPESCRIPT);
      mockFs.createFile('src/index.ts', 'import "./malformed";', FileType.TYPESCRIPT);

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      // Should not throw, but may have errors recorded
      expect(graph.files.size).toBeGreaterThan(0);
    });

    test('should handle missing files gracefully', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', 'import "./missing-file";', FileType.TYPESCRIPT);

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      const indexFile = graph.files.get('src/index.ts');
      expect(indexFile).toBeDefined();
      expect(indexFile?.imports).toContain('./missing-file');
    });

    test('should handle circular dependencies without infinite loops', async () => {
      // Arrange
      mockFs.createFile('src/a.ts', 'import "./b"; export const a = "a";', FileType.TYPESCRIPT);
      mockFs.createFile('src/b.ts', 'import "./c"; export const b = "b";', FileType.TYPESCRIPT);
      mockFs.createFile('src/c.ts', 'import "./a"; export const c = "c";', FileType.TYPESCRIPT);

      // Act
      const graph = await scanner.buildDependencyGraph();

      // Assert
      expect(graph.circularDependencies.length).toBeGreaterThan(0);
      expect(graph.files.size).toBe(3);
    });
  });
});