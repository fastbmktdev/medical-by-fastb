/**
 * Jest Configuration for Unit Tests
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.{ts,tsx,js,mjs}',
    '!**/tests/analysis/**', // Exclude analysis tests (use custom runner)
  ],
  
  // Exclude design-system tests (has separate Jest config)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/playwright-report/',
    '/src/components/design-system/__tests__/', // Use separate config
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.jest.json',
      },
    ],
    '^.+\\.(js|jsx|mjs)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ],
    }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Setup files
  setupFilesAfterEnv: [],
  
  
  // Extensions to treat as ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  transformIgnorePatterns: [
    '/node_modules/(?!@supabase/supabase-js/)',
  ],
};

