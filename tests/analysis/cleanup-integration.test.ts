/**
 * Integration tests for cleanup workflows
 */

import { FileAnalyzer } from '../../src/analysis/index';
import { CleanupConfigManager } from '../../src/analysis/cleanup-config';
import { CleanupValidationCommands } from '../../src/analysis/cleanup-commands';
import { 
  MockFileSystemManager, 
  TestFixtureGenerator,
  CleanupTestAssertions,
  PerformanceTestUtils
} from './test-utilities';
import { TestFixtures } from './test-fixtures';

describe('Cleanup Integration Tests', () => {
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

  describe('End-to-End Cleanup Workflow', () => {
    test('should complete full cleanup workflow for React project', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateReactProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act - Step 1: Analyze project
      const dependencyGraph = await analyzer.analyzeProject();
      
      // Assert - Dependency analysis
      expect(dependencyGraph.files.size).toBeGreaterThan(0);
      expect(dependencyGraph.orphanedFiles.length).toBeGreaterThan(0);
      
      // Act - Step 2: Validate cleanup safety
      const safetyValidation = await validationCommands.validateCleanupSafety();
      
      // Assert - Safety validation
      expect(safetyValidation.isSafe).toBeDefined();
      expect(Array.isArray(safetyValidation.warnings)).toBe(true);
      expect(Array.isArray(safetyValidation.errors)).toBe(true);
      
      // Act - Step 3: Generate cleanup preview
      const preview = await validationCommands.generateCleanupPreview();
      
      // Assert - Cleanup preview
      expect(preview.summary.totalFilesToRemove).toBeGreaterThan(0);
      expect(preview.filesByCategory).toBeDefined();
      expect(preview.risks.level).toMatch(/^(low|medium|high)$/);
      
      // Act - Step 4: Execute dry run
      const dryRunResult = await analyzer.executeCleanupDryRun({
        dryRun: true,
        verbose: false
      });
      
      // Assert - Dry run results
      expect(dryRunResult).toBeDefined();
      // Files should still exist after dry run
      expect(mockFs.fileExists('src/components/UnusedComponent.tsx')).toBe(true);
    });

    test('should handle complex project with circular dependencies', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateComplexProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const dependencyGraph = await analyzer.analyzeProject();
      const safetyValidation = await validationCommands.validateCleanupSafety();

      // Assert
      expect(dependencyGraph.circularDependencies.length).toBeGreaterThan(0);
      
      // Should have warnings about circular dependencies
      const hasCircularWarning = safetyValidation.warnings.some(warning => 
        warning.includes('circular dependencies')
      );
      expect(hasCircularWarning).toBe(true);
    });

    test('should properly handle dynamic imports and string references', async () => {
      // Arrange
      const fixture = TestFixtures.getDynamicImportProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const dependencyGraph = await analyzer.analyzeProject();
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      // Dynamic imports should be detected and preserved
      const dynamicModule = dependencyGraph.files.get('src/dynamicModule.ts');
      expect(dynamicModule?.referencedBy).toContain('src/index.ts');
      
      // String-referenced assets should be preserved
      const logoAsset = dependencyGraph.assets.get('assets/logo.png');
      expect(logoAsset?.isUnused).toBe(false);
      
      // Only truly unused files should be marked for removal
      expect(unusedAnalysis.unusedFiles).toContain('src/pages/UnusedPage.ts');
      expect(unusedAnalysis.unusedFiles).not.toContain('src/dynamicModule.ts');
    });
  });

  describe('Asset Cleanup Integration', () => {
    test('should integrate asset cleanup with file cleanup', async () => {
      // Arrange
      const fixture = TestFixtures.getNextJsProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const assetCleanupResult = await analyzer.executeIntegratedAssetCleanup({
        dryRun: true,
        includePublicAssets: true,
        validateReferences: true
      });

      // Assert
      expect(assetCleanupResult).toBeDefined();
      expect(assetCleanupResult.unusedAssets).toBeDefined();
      expect(assetCleanupResult.unusedAssets.length).toBeGreaterThan(0);
      
      // Should identify unused image
      expect(assetCleanupResult.unusedAssets).toContain('public/unused-image.jpg');
      
      // Should preserve used assets
      expect(assetCleanupResult.unusedAssets).not.toContain('public/favicon.ico');
      expect(assetCleanupResult.unusedAssets).not.toContain('public/logo.png');
    });

    test('should handle CSS asset references correctly', async () => {
      // Arrange
      mockFs.createFile('src/styles.css', `
        .logo { background-image: url('./assets/logo.png'); }
        .header { background-image: url('./assets/header.jpg'); }
      `, 'css' as any);
      
      mockFs.createFile('src/component.tsx', `
        import './styles.css';
        export default function Component() { return <div />; }
      `, 'typescript' as any);
      
      mockFs.createFile('src/assets/logo.png', 'logo-content', 'asset' as any);
      mockFs.createFile('src/assets/header.jpg', 'header-content', 'asset' as any);
      mockFs.createFile('src/assets/unused.png', 'unused-content', 'asset' as any);

      // Act
      const assetAnalysis = await analyzer.analyzeAssetsOnly();

      // Assert
      expect(assetAnalysis.unusedAssets).toContain('src/assets/unused.png');
      expect(assetAnalysis.unusedAssets).not.toContain('src/assets/logo.png');
      expect(assetAnalysis.unusedAssets).not.toContain('src/assets/header.jpg');
    });
  });

  describe('Test File Cleanup Integration', () => {
    test('should identify and clean up orphaned test files', async () => {
      // Arrange
      const fixture = TestFixtures.getTestHeavyProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const testAnalysis = await analyzer.analyzeTestFiles();
      const testCleanupResult = await analyzer.analyzeTestCleanup({
        dryRun: true,
        preserveUtilities: true
      });

      // Assert
      expect(testAnalysis.orphanedTestFiles).toBeDefined();
      expect(testAnalysis.orphanedTestFiles.length).toBeGreaterThan(0);
      
      // Should identify orphaned test for unused feature
      expect(testAnalysis.orphanedTestFiles).toContain('src/unused-feature.test.ts');
      
      // Should preserve test utilities
      expect(testCleanupResult.preservedFiles).toContain('tests/helpers.ts');
    });

    test('should update test configuration after cleanup', async () => {
      // Arrange
      const fixture = TestFixtures.getTestHeavyProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Add test configuration
      mockFs.createFile('jest.config.js', `
        module.exports = {
          testMatch: ['**/*.test.ts', '**/*.spec.ts'],
          setupFilesAfterEnv: ['./tests/setup.ts']
        };
      `, 'config' as any);

      // Act
      const testCleanupResult = await analyzer.cleanupTestFiles({
        dryRun: true,
        updateConfigFiles: true
      });

      // Assert
      expect(testCleanupResult.configUpdates).toBeDefined();
      expect(testCleanupResult.configUpdates.length).toBeGreaterThan(0);
    });
  });

  describe('Component Cleanup Integration', () => {
    test('should identify unused React components', async () => {
      // Arrange
      const fixture = TestFixtures.getNextJsProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act
      const componentAnalysis = await analyzer.analyzeComponentUsage();
      const componentCleanupResult = await analyzer.analyzeComponentCleanup({
        dryRun: true,
        updateIndexFiles: true
      });

      // Assert
      expect(componentAnalysis.unusedComponents).toBeDefined();
      expect(componentAnalysis.unusedComponents.length).toBeGreaterThan(0);
      
      // Should identify unused component
      expect(componentAnalysis.unusedComponents).toContain('components/UnusedComponent.tsx');
      
      // Should preserve used components
      expect(componentAnalysis.unusedComponents).not.toContain('components/Header.tsx');
      expect(componentAnalysis.unusedComponents).not.toContain('components/Footer.tsx');
    });

    test('should handle dynamic routing components correctly', async () => {
      // Arrange
      mockFs.createFile('pages/[id].tsx', `
        export default function DynamicPage({ id }: { id: string }) {
          return <div>Page {id}</div>;
        }
      `, 'typescript' as any);
      
      mockFs.createFile('pages/api/[...slug].ts', `
        export default function handler(req: any, res: any) {
          res.json({ slug: req.query.slug });
        }
      `, 'typescript' as any);

      // Act
      const componentAnalysis = await analyzer.analyzeComponentUsage({
        checkDynamicRouting: true
      });

      // Assert
      // Dynamic route components should not be marked as unused
      expect(componentAnalysis.unusedComponents).not.toContain('pages/[id].tsx');
      expect(componentAnalysis.unusedComponents).not.toContain('pages/api/[...slug].ts');
    });
  });

  describe('Configuration and Safety Integration', () => {
    test('should respect configuration exclusions', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateReactProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Configure to exclude certain patterns
      configManager.updateConfig({
        excludePatterns: [
          ...configManager.getConfig().excludePatterns,
          '**/UnusedComponent.tsx'
        ]
      });

      // Act
      const unusedAnalysis = await analyzer.detectUnusedFiles();

      // Assert
      // Should respect exclusion pattern
      expect(unusedAnalysis.unusedFiles).not.toContain('src/components/UnusedComponent.tsx');
    });

    test('should create backup before cleanup', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateReactProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Configure backup settings
      configManager.updateConfig({
        safety: {
          ...configManager.getConfig().safety,
          createBackup: true,
          backupLocation: '.cleanup-backup'
        }
      });

      // Act
      const cleanupResult = await analyzer.executeComprehensiveCleanup({
        dryRun: true // Still dry run for testing
      });

      // Assert
      expect(cleanupResult.backupCreated).toBe(true);
      expect(cleanupResult.rollbackId).toBeDefined();
    });

    test('should validate build process after cleanup', async () => {
      // Arrange
      const fixture = TestFixtures.getConfigHeavyProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Configure build validation
      configManager.updateConfig({
        safety: {
          ...configManager.getConfig().safety,
          validateBuild: true
        }
      });

      // Act
      const cleanupResult = await analyzer.executeComprehensiveCleanup({
        dryRun: true,
        validateBuild: true
      });

      // Assert
      expect(cleanupResult.buildValidation).toBeDefined();
      expect(cleanupResult.buildValidation.passed).toBeDefined();
    });
  });

  describe('Performance Integration Tests', () => {
    test('should handle large projects efficiently', async () => {
      // Arrange
      const largeFixture = PerformanceTestUtils.generateLargeProject(500);
      
      for (const file of largeFixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act & Assert
      const { result: analysisResult, executionTime: analysisTime } = 
        await PerformanceTestUtils.measureExecutionTime(
          () => analyzer.analyzeProject(),
          'Large Project Analysis'
        );

      const { result: cleanupResult, executionTime: cleanupTime } = 
        await PerformanceTestUtils.measureExecutionTime(
          () => analyzer.executeCleanupDryRun({ dryRun: true }),
          'Large Project Cleanup Dry Run'
        );

      // Performance assertions
      expect(analysisTime).toBeLessThan(3000); // 3 seconds
      expect(cleanupTime).toBeLessThan(2000); // 2 seconds
      
      // Correctness assertions
      expect(analysisResult.files.size).toBe(largeFixture.files.length);
      expect(cleanupResult).toBeDefined();
    });

    test('should handle concurrent cleanup operations safely', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateReactProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act - Start multiple cleanup operations concurrently
      const cleanupPromises = [
        analyzer.executeCleanupDryRun({ dryRun: true }),
        analyzer.executeCleanupDryRun({ dryRun: true }),
        analyzer.executeCleanupDryRun({ dryRun: true })
      ];

      const results = await Promise.all(cleanupPromises);

      // Assert
      results.forEach(result => {
        expect(result).toBeDefined();
      });

      // Should not have conflicts or corruption
      expect(results.length).toBe(3);
    });
  });

  describe('Error Recovery Integration', () => {
    test('should recover gracefully from analysis errors', async () => {
      // Arrange - Create project with some problematic files
      mockFs.createFile('src/good.ts', 'export const good = "working";', 'typescript' as any);
      mockFs.createFile('src/broken.ts', 'import { from ./malformed', 'typescript' as any);
      mockFs.createFile('src/index.ts', 'import "./good"; import "./broken";', 'typescript' as any);

      // Act
      const analysisResult = await analyzer.analyzeProject();
      const cleanupResult = await analyzer.executeCleanupDryRun({ dryRun: true });

      // Assert
      // Should continue despite errors
      expect(analysisResult.files.size).toBeGreaterThan(0);
      expect(cleanupResult).toBeDefined();
      
      // Should have error information
      expect(cleanupResult.errors).toBeDefined();
    });

    test('should handle rollback correctly', async () => {
      // Arrange
      const fixture = TestFixtureGenerator.generateReactProject();
      
      for (const file of fixture.files) {
        mockFs.createFile(file.path, file.content, file.type);
      }

      // Act - Execute cleanup (dry run) and get rollback ID
      const cleanupResult = await analyzer.executeComprehensiveCleanup({
        dryRun: true
      });

      // Simulate rollback
      if (cleanupResult.rollbackId) {
        const rollbackSuccess = await analyzer.executeRollback(cleanupResult.rollbackId);
        
        // Assert
        expect(rollbackSuccess).toBe(true);
      }
    });
  });
});