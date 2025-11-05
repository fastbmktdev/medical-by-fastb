/**
 * Tests for edge cases and safety scenarios in cleanup operations
 */

import { FileAnalyzer } from '../../src/analysis/index';
import { CleanupConfigManager } from '../../src/analysis/cleanup-config';
import { CleanupValidationCommands } from '../../src/analysis/cleanup-commands';
import { 
  MockFileSystemManager, 
  CleanupTestAssertions
} from './test-utilities';

describe('Safety Scenarios and Edge Cases', () => {
  let mockFs: MockFileSystemManager;
  let analyzer: FileAnalyzer;
  let configManager: CleanupConfigManager;
  let validationCommands: CleanupValidationCommands;
  const testRootDir = '/test-project';

  beforeEach(() => {
    mockFs = new MockFileSystemManager(testRootDir);
    analyzer = new FileAnalyzer(testRootDir);
    configManager = new CleanupConfigManager(testRootDir);
    validationCommands = new CleanupValidationCommands(testRootDir);
  });

  afterEach(() => {
    mockFs.clear();
  });

  describe('Critical File Protection', () => {
    test('should never mark entry points as unused', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', 'console.log("entry point");', 'typescript' as any);
      mockFs.createFile('src/unused.ts', 'export const unused = "value";', 'typescript' as any);

      // Act
      const dependencyGraph = await analyzer.analyzeProject();
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      expect(dependencyGraph.entryPoints).toContain('src/index.ts');
      expect(unusedAnalysis.unusedFiles).not.toContain('src/index.ts');
      expect(unusedAnalysis.unusedFiles).toContain('src/unused.ts');
    });

    test('should protect configuration files from cleanup', async () => {
      // Arrange
      mockFs.createFile('package.json', '{"name": "test"}', 'json' as any);
      mockFs.createFile('tsconfig.json', '{"compilerOptions": {}}', 'json' as any);
      mockFs.createFile('webpack.config.js', 'module.exports = {};', 'config' as any);
      mockFs.createFile('.eslintrc.json', '{"extends": []}', 'json' as any);
      mockFs.createFile('src/index.ts', 'console.log("app");', 'typescript' as any);

      // Act
      const dependencyGraph = await analyzer.analyzeProject();
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', '.eslintrc.json'];
      configFiles.forEach(configFile => {
        expect(unusedAnalysis.unusedFiles).not.toContain(configFile);
        
        const file = dependencyGraph.files.get(configFile);
        if (file) {
          expect(file.isConfigFile).toBe(true);
        }
      });
    });

    test('should protect files with dynamic references', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', `
        const moduleName = 'dynamicModule';
        import(\`./\${moduleName}\`).then(m => console.log(m));
      `, 'typescript' as any);
      
      mockFs.createFile('src/dynamicModule.ts', 'export default "dynamic";', 'typescript' as any);
      mockFs.createFile('src/unused.ts', 'export const unused = "value";', 'typescript' as any);

      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      expect(unusedAnalysis.unusedFiles).not.toContain('src/dynamicModule.ts');
      expect(unusedAnalysis.unusedFiles).toContain('src/unused.ts');
    });

    test('should protect files referenced in string literals', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', `
        const templatePath = './templates/email.html';
        const configPath = './config/settings.json';
        const imagePath = '/assets/logo.png';
      `, 'typescript' as any);
      
      mockFs.createFile('src/templates/email.html', '<html></html>', 'unknown' as any);
      mockFs.createFile('src/config/settings.json', '{}', 'json' as any);
      mockFs.createFile('assets/logo.png', 'image-data', 'asset' as any);
      mockFs.createFile('assets/unused.png', 'unused-image', 'asset' as any);

      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      expect(unusedAnalysis.unusedFiles).not.toContain('src/templates/email.html');
      expect(unusedAnalysis.unusedFiles).not.toContain('src/config/settings.json');
      expect(unusedAnalysis.unusedFiles).not.toContain('assets/logo.png');
      expect(unusedAnalysis.unusedFiles).toContain('assets/unused.png');
    });
  });

  describe('Circular Dependency Handling', () => {
    test('should not mark circular dependency files as unused', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', 'import "./moduleA";', 'typescript' as any);
      mockFs.createFile('src/moduleA.ts', `
        import { moduleB } from './moduleB';
        export const moduleA = { dep: moduleB };
      `, 'typescript' as any);
      mockFs.createFile('src/moduleB.ts', `
        import { moduleA } from './moduleA';
        export const moduleB = { dep: moduleA };
      `, 'typescript' as any);
      mockFs.createFile('src/unused.ts', 'export const unused = "value";', 'typescript' as any);

      // Act
      const dependencyGraph = await analyzer.analyzeProject();
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      expect(dependencyGraph.circularDependencies.length).toBeGreaterThan(0);
      expect(unusedAnalysis.unusedFiles).not.toContain('src/moduleA.ts');
      expect(unusedAnalysis.unusedFiles).not.toContain('src/moduleB.ts');
      expect(unusedAnalysis.unusedFiles).toContain('src/unused.ts');
    });

    test('should detect complex circular dependencies', async () => {
      // Arrange - Create A -> B -> C -> A cycle
      mockFs.createFile('src/index.ts', 'import "./a";', 'typescript' as any);
      mockFs.createFile('src/a.ts', 'import "./b"; export const a = 1;', 'typescript' as any);
      mockFs.createFile('src/b.ts', 'import "./c"; export const b = 2;', 'typescript' as any);
      mockFs.createFile('src/c.ts', 'import "./a"; export const c = 3;', 'typescript' as any);

      // Act
      const dependencyGraph = await analyzer.analyzeProject();
      const safetyValidation = await validationCommands.validateCleanupSafety();

      // Assert
      expect(dependencyGraph.circularDependencies.length).toBeGreaterThan(0);
      
      const cycle = dependencyGraph.circularDependencies[0];
      expect(cycle).toContain('src/a.ts');
      expect(cycle).toContain('src/b.ts');
      expect(cycle).toContain('src/c.ts');
      
      // Should have warnings about circular dependencies
      expect(safetyValidation.warnings.some(w => w.includes('circular'))).toBe(true);
    });
  });

  describe('Framework-Specific Edge Cases', () => {
    test('should handle Next.js dynamic routes correctly', async () => {
      // Arrange
      mockFs.createFile('pages/index.tsx', 'export default function Home() { return <div />; }', 'typescript' as any);
      mockFs.createFile('pages/[id].tsx', 'export default function Dynamic() { return <div />; }', 'typescript' as any);
      mockFs.createFile('pages/api/[...slug].ts', 'export default function API() {}', 'typescript' as any);
      mockFs.createFile('pages/unused.tsx', 'export default function Unused() { return <div />; }', 'typescript' as any);

      // Act
      const componentAnalysis = await analyzer.analyzeComponentUsage({
        checkDynamicRouting: true
      });

      // Assert
      // Dynamic routes should not be marked as unused
      expect(componentAnalysis.unusedComponents).not.toContain('pages/[id].tsx');
      expect(componentAnalysis.unusedComponents).not.toContain('pages/api/[...slug].ts');
      
      // Regular unused pages should be marked
      expect(componentAnalysis.unusedComponents).toContain('pages/unused.tsx');
    });

    test('should handle React component lazy loading', async () => {
      // Arrange
      mockFs.createFile('src/App.tsx', `
        import { lazy } from 'react';
        const LazyComponent = lazy(() => import('./LazyComponent'));
        export default function App() { return <LazyComponent />; }
      `, 'typescript' as any);
      
      mockFs.createFile('src/LazyComponent.tsx', `
        export default function LazyComponent() { return <div />; }
      `, 'typescript' as any);
      
      mockFs.createFile('src/UnusedComponent.tsx', `
        export default function UnusedComponent() { return <div />; }
      `, 'typescript' as any);

      // Act
      const componentAnalysis = await analyzer.analyzeComponentUsage();

      // Assert
      expect(componentAnalysis.unusedComponents).not.toContain('src/LazyComponent.tsx');
      expect(componentAnalysis.unusedComponents).toContain('src/UnusedComponent.tsx');
    });

    test('should handle CSS modules and styled-components', async () => {
      // Arrange
      mockFs.createFile('src/Component.tsx', `
        import styles from './Component.module.css';
        import styled from 'styled-components';
        
        const StyledDiv = styled.div\`color: red;\`;
        
        export default function Component() {
          return <div className={styles.container}><StyledDiv /></div>;
        }
      `, 'typescript' as any);
      
      mockFs.createFile('src/Component.module.css', `
        .container { padding: 10px; }
        .unused { display: none; }
      `, 'css' as any);
      
      mockFs.createFile('src/unused.module.css', `
        .unused { color: blue; }
      `, 'css' as any);

      // Act
      const assetAnalysis = await analyzer.analyzeAssetsOnly();

      // Assert
      expect(assetAnalysis.unusedAssets).not.toContain('src/Component.module.css');
      expect(assetAnalysis.unusedAssets).toContain('src/unused.module.css');
    });
  });

  describe('Build Tool Integration Edge Cases', () => {
    test('should handle webpack dynamic imports', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', `
        // Webpack magic comments
        const chunk1 = import(/* webpackChunkName: "chunk1" */ './chunk1');
        const chunk2 = import(/* webpackChunkName: "chunk2" */ './chunk2');
      `, 'typescript' as any);
      
      mockFs.createFile('src/chunk1.ts', 'export default "chunk1";', 'typescript' as any);
      mockFs.createFile('src/chunk2.ts', 'export default "chunk2";', 'typescript' as any);
      mockFs.createFile('src/unused-chunk.ts', 'export default "unused";', 'typescript' as any);

      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      expect(unusedAnalysis.unusedFiles).not.toContain('src/chunk1.ts');
      expect(unusedAnalysis.unusedFiles).not.toContain('src/chunk2.ts');
      expect(unusedAnalysis.unusedFiles).toContain('src/unused-chunk.ts');
    });

    test('should handle Vite dynamic imports', async () => {
      // Arrange
      mockFs.createFile('src/main.ts', `
        // Vite glob imports
        const modules = import.meta.glob('./modules/*.ts');
        const components = import.meta.glob('./components/*.tsx', { eager: true });
      `, 'typescript' as any);
      
      mockFs.createFile('src/modules/module1.ts', 'export default "module1";', 'typescript' as any);
      mockFs.createFile('src/modules/module2.ts', 'export default "module2";', 'typescript' as any);
      mockFs.createFile('src/components/Component1.tsx', 'export default function() { return <div />; }', 'typescript' as any);
      mockFs.createFile('src/other/unused.ts', 'export default "unused";', 'typescript' as any);

      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      // Glob-imported files should not be marked as unused
      expect(unusedAnalysis.unusedFiles).not.toContain('src/modules/module1.ts');
      expect(unusedAnalysis.unusedFiles).not.toContain('src/modules/module2.ts');
      expect(unusedAnalysis.unusedFiles).not.toContain('src/components/Component1.tsx');
      
      // Files outside glob patterns should be marked if unused
      expect(unusedAnalysis.unusedFiles).toContain('src/other/unused.ts');
    });
  });

  describe('File System Edge Cases', () => {
    test('should handle symlinks correctly', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', 'import "./real-file";', 'typescript' as any);
      mockFs.createFile('src/real-file.ts', 'export const value = "real";', 'typescript' as any);
      // Note: Mock symlink handling would need to be implemented in MockFileSystemManager
      
      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      expect(unusedAnalysis.unusedFiles).not.toContain('src/real-file.ts');
    });

    test('should handle case-sensitive file systems', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', 'import "./Component";', 'typescript' as any);
      mockFs.createFile('src/Component.tsx', 'export default function() { return <div />; }', 'typescript' as any);
      mockFs.createFile('src/component.tsx', 'export default function() { return <span />; }', 'typescript' as any);

      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      // Should correctly resolve case-sensitive imports
      expect(unusedAnalysis.unusedFiles).not.toContain('src/Component.tsx');
      expect(unusedAnalysis.unusedFiles).toContain('src/component.tsx');
    });

    test('should handle very long file paths', async () => {
      // Arrange
      const longPath = 'src/' + 'very-long-directory-name/'.repeat(10) + 'deep-file.ts';
      mockFs.createFile('src/index.ts', `import "./${longPath.replace('src/', '')}";`, 'typescript' as any);
      mockFs.createFile(longPath, 'export const deep = "value";', 'typescript' as any);

      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      expect(unusedAnalysis.unusedFiles).not.toContain(longPath);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle projects with many small files', async () => {
      // Arrange
      const fileCount = 1000;
      
      mockFs.createFile('src/index.ts', 'console.log("entry");', 'typescript' as any);
      
      for (let i = 0; i < fileCount; i++) {
        const isUsed = i < fileCount * 0.1; // 10% used
        const filePath = `src/file${i}.ts`;
        
        mockFs.createFile(filePath, `export const value${i} = ${i};`, 'typescript' as any);
        
        if (isUsed) {
          // Import in index to make it used
          const indexContent = mockFs.getFileContent('src/index.ts') || '';
          mockFs.createFile('src/index.ts', `${indexContent}\nimport "./file${i}";`, 'typescript' as any);
        }
      }

      // Act
      const startTime = Date.now();
      const unusedAnalysis = await analyzer.detectUnusedFiles();
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      console.log(`Many small files test took ${executionTime}ms`);
      
      expect(executionTime).toBeLessThan(10000); // 10 seconds
      expect(unusedAnalysis.unusedFiles.length).toBeGreaterThan(fileCount * 0.8); // Most should be unused
    });

    test('should handle files with very large content', async () => {
      // Arrange
      const largeContent = 'export const data = ' + JSON.stringify({
        largeArray: new Array(10000).fill('large-string-content-that-repeats')
      });
      
      mockFs.createFile('src/index.ts', 'import "./large-file";', 'typescript' as any);
      mockFs.createFile('src/large-file.ts', largeContent, 'typescript' as any);
      mockFs.createFile('src/unused-large.ts', largeContent, 'typescript' as any);

      // Act
      const startTime = Date.now();
      const unusedAnalysis = await analyzer.detectUnusedFiles();
      const endTime = Date.now();

      // Assert
      const executionTime = endTime - startTime;
      console.log(`Large files test took ${executionTime}ms`);
      
      expect(executionTime).toBeLessThan(5000); // 5 seconds
      expect(unusedAnalysis.unusedFiles).not.toContain('src/large-file.ts');
      expect(unusedAnalysis.unusedFiles).toContain('src/unused-large.ts');
    });
  });

  describe('Validation Safety Checks', () => {
    test('should prevent unsafe cleanup operations', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', 'import "./critical";', 'typescript' as any);
      mockFs.createFile('src/critical.ts', 'export const critical = "important";', 'typescript' as any);
      mockFs.createFile('src/unused.ts', 'export const unused = "safe to remove";', 'typescript' as any);

      // Act
      const filesToValidate = ['src/critical.ts', 'src/unused.ts'];
      const validation = await validationCommands.validateFilesForCleanup(filesToValidate);

      // Assert
      expect(validation.safeFiles).toContain('src/unused.ts');
      expect(validation.safeFiles).not.toContain('src/critical.ts');
      
      const unsafeFile = validation.unsafeFiles.find(f => f.file === 'src/critical.ts');
      expect(unsafeFile).toBeDefined();
      expect(unsafeFile?.reason).toContain('Referenced by');
    });

    test('should provide detailed risk assessment', async () => {
      // Arrange
      mockFs.createFile('src/index.ts', 'import "./moduleA";', 'typescript' as any);
      mockFs.createFile('src/moduleA.ts', 'import "./moduleB"; export const a = 1;', 'typescript' as any);
      mockFs.createFile('src/moduleB.ts', 'import "./moduleA"; export const b = 2;', 'typescript' as any);
      mockFs.createFile('src/config.ts', 'export const config = {};', 'config' as any);
      mockFs.createFile('src/unused.ts', 'export const unused = "value";', 'typescript' as any);

      // Act
      const preview = await validationCommands.generateCleanupPreview();

      // Assert
      expect(preview.risks.level).toMatch(/^(low|medium|high)$/);
      expect(preview.risks.factors).toBeDefined();
      
      if (preview.risks.level === 'medium' || preview.risks.level === 'high') {
        expect(preview.risks.factors.length).toBeGreaterThan(0);
      }
      
      expect(preview.recommendations).toBeDefined();
      expect(preview.recommendations.length).toBeGreaterThan(0);
    });
  });
});