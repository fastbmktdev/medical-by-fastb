/**
 * Test fixtures for various project structures and scenarios
 */

import { TestProjectStructure } from './test-utilities';

/**
 * File type enum for test fixtures
 */
export enum FileType {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  JSON = 'json',
  ASSET = 'asset',
  TEST = 'test',
  CONFIG = 'config',
}

/**
 * Collection of predefined test fixtures
 */
export class TestFixtures {
  /**
   * Minimal project with just a few files
   */
  static getMinimalProject(): TestProjectStructure {
    return {
      name: 'minimal-project',
      description: 'Minimal project with basic structure',
      files: [
        {
          path: 'src/index.ts',
          content: `
import { helper } from './helper';
console.log(helper());
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/helper.ts',
          content: `
export function helper(): string {
  return 'Hello World';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/unused.ts',
          content: `
export function unused(): void {
  console.log('This is never called');
}
          `,
          type: FileType.TYPESCRIPT
        }
      ],
      expectedUnused: ['src/unused.ts'],
      expectedUsed: ['src/index.ts', 'src/helper.ts'],
      entryPoints: ['src/index.ts']
    };
  }

  /**
   * Next.js project structure
   */
  static getNextJsProject(): TestProjectStructure {
    return {
      name: 'nextjs-project',
      description: 'Next.js project with pages and components',
      files: [
        {
          path: 'pages/_app.tsx',
          content: `
import type { AppProps } from 'next/app';
import Layout from '../components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'pages/index.tsx',
          content: `
import { GetStaticProps } from 'next';
import HomeComponent from '../components/HomeComponent';

export default function Home({ data }: { data: any }) {
  return <HomeComponent data={data} />;
}

export const getStaticProps: GetStaticProps = async () => {
  return { props: { data: {} } };
};
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'pages/about.tsx',
          content: `
import AboutComponent from '../components/AboutComponent';

export default function About() {
  return <AboutComponent />;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'components/Layout.tsx',
          content: `
import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'components/Header.tsx',
          content: `
import React from 'react';

export default function Header() {
  return <header>My Site</header>;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'components/Footer.tsx',
          content: `
import React from 'react';

export default function Footer() {
  return <footer>© 2024</footer>;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'components/HomeComponent.tsx',
          content: `
import React from 'react';

export default function HomeComponent({ data }: { data: any }) {
  return <div>Home Content</div>;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'components/AboutComponent.tsx',
          content: `
import React from 'react';

export default function AboutComponent() {
  return <div>About Content</div>;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'components/UnusedComponent.tsx',
          content: `
import React from 'react';

export default function UnusedComponent() {
  return <div>This component is never used</div>;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'utils/api.ts',
          content: `
export async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'utils/unused-utils.ts',
          content: `
export function unusedUtility(): string {
  return 'This utility is never used';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'public/favicon.ico',
          content: 'mock-favicon-content',
          type: FileType.ASSET
        },
        {
          path: 'public/logo.png',
          content: 'mock-logo-content',
          type: FileType.ASSET
        },
        {
          path: 'public/unused-image.jpg',
          content: 'mock-unused-image-content',
          type: FileType.ASSET
        }
      ],
      expectedUnused: [
        'components/UnusedComponent.tsx',
        'utils/unused-utils.ts',
        'public/unused-image.jpg'
      ],
      expectedUsed: [
        'pages/_app.tsx',
        'pages/index.tsx',
        'pages/about.tsx',
        'components/Layout.tsx',
        'components/Header.tsx',
        'components/Footer.tsx',
        'components/HomeComponent.tsx',
        'components/AboutComponent.tsx',
        'utils/api.ts',
        'public/favicon.ico',
        'public/logo.png'
      ],
      entryPoints: ['pages/_app.tsx', 'pages/index.tsx', 'pages/about.tsx']
    };
  }

  /**
   * Project with dynamic imports and string references
   */
  static getDynamicImportProject(): TestProjectStructure {
    return {
      name: 'dynamic-import-project',
      description: 'Project with dynamic imports and string-based references',
      files: [
        {
          path: 'src/index.ts',
          content: `
// Dynamic import
const loadModule = async () => {
  const module = await import('./dynamicModule');
  return module.default;
};

// String reference
const imagePath = '/assets/logo.png';
const configPath = './config/settings.json';

loadModule();
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/dynamicModule.ts',
          content: `
export default {
  name: 'Dynamic Module',
  version: '1.0.0'
};
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/router.ts',
          content: `
const routes = [
  { path: '/', component: () => import('./pages/Home') },
  { path: '/about', component: () => import('./pages/About') },
  { path: '/contact', component: () => import('./pages/Contact') }
];

export default routes;
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/pages/Home.ts',
          content: `
export default function Home() {
  return 'Home Page';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/pages/About.ts',
          content: `
export default function About() {
  return 'About Page';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/pages/Contact.ts',
          content: `
export default function Contact() {
  return 'Contact Page';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/pages/UnusedPage.ts',
          content: `
export default function UnusedPage() {
  return 'This page is never referenced';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'assets/logo.png',
          content: 'mock-logo-content',
          type: FileType.ASSET
        },
        {
          path: 'assets/unused-asset.jpg',
          content: 'mock-unused-asset-content',
          type: FileType.ASSET
        },
        {
          path: 'config/settings.json',
          content: '{"app": "test"}',
          type: FileType.JSON
        }
      ],
      expectedUnused: [
        'src/pages/UnusedPage.ts',
        'assets/unused-asset.jpg'
      ],
      expectedUsed: [
        'src/index.ts',
        'src/dynamicModule.ts',
        'src/router.ts',
        'src/pages/Home.ts',
        'src/pages/About.ts',
        'src/pages/Contact.ts',
        'assets/logo.png',
        'config/settings.json'
      ],
      entryPoints: ['src/index.ts', 'src/router.ts']
    };
  }

  /**
   * Project with comprehensive test files
   */
  static getTestHeavyProject(): TestProjectStructure {
    return {
      name: 'test-heavy-project',
      description: 'Project with extensive test coverage',
      files: [
        {
          path: 'src/math.ts',
          content: `
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/math.test.ts',
          content: `
import { add, multiply, divide } from './math';

describe('Math functions', () => {
  test('add', () => {
    expect(add(2, 3)).toBe(5);
  });

  test('multiply', () => {
    expect(multiply(3, 4)).toBe(12);
  });

  test('divide', () => {
    expect(divide(10, 2)).toBe(5);
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
});
          `,
          type: FileType.TEST
        },
        {
          path: 'src/string-utils.ts',
          content: `
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function reverse(str: string): string {
  return str.split('').reverse().join('');
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/string-utils.test.ts',
          content: `
import { capitalize, reverse } from './string-utils';

describe('String utilities', () => {
  test('capitalize', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  test('reverse', () => {
    expect(reverse('hello')).toBe('olleh');
  });
});
          `,
          type: FileType.TEST
        },
        {
          path: 'src/unused-feature.ts',
          content: `
export function unusedFeature(): string {
  return 'This feature is not used anywhere';
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/unused-feature.test.ts',
          content: `
import { unusedFeature } from './unused-feature';

describe('Unused feature', () => {
  test('returns correct string', () => {
    expect(unusedFeature()).toBe('This feature is not used anywhere');
  });
});
          `,
          type: FileType.TEST
        },
        {
          path: 'tests/setup.ts',
          content: `
// Global test setup
beforeEach(() => {
  // Setup code
});
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'tests/helpers.ts',
          content: `
export function createMockData(): any {
  return { id: 1, name: 'Test' };
}
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'src/main.ts',
          content: `
import { add } from './math';
import { capitalize } from './string-utils';

console.log(add(1, 2));
console.log(capitalize('test'));
          `,
          type: FileType.TYPESCRIPT
        }
      ],
      expectedUnused: [
        'src/unused-feature.ts',
        'src/unused-feature.test.ts'
      ],
      expectedUsed: [
        'src/math.ts',
        'src/math.test.ts',
        'src/string-utils.ts',
        'src/string-utils.test.ts',
        'src/main.ts',
        'tests/setup.ts',
        'tests/helpers.ts'
      ],
      entryPoints: ['src/main.ts']
    };
  }

  /**
   * Project with configuration files and build artifacts
   */
  static getConfigHeavyProject(): TestProjectStructure {
    return {
      name: 'config-heavy-project',
      description: 'Project with many configuration files',
      files: [
        {
          path: 'src/index.ts',
          content: `
import config from '../config/app.config';
console.log(config);
          `,
          type: FileType.TYPESCRIPT
        },
        {
          path: 'config/app.config.ts',
          content: `
export default {
  name: 'My App',
  version: '1.0.0'
};
          `,
          type: FileType.CONFIG
        },
        {
          path: 'config/database.config.ts',
          content: `
export default {
  host: 'localhost',
  port: 5432
};
          `,
          type: FileType.CONFIG
        },
        {
          path: 'webpack.config.js',
          content: `
module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'bundle.js'
  }
};
          `,
          type: FileType.CONFIG
        },
        {
          path: 'tsconfig.json',
          content: `
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs"
  }
}
          `,
          type: FileType.JSON
        },
        {
          path: 'package.json',
          content: `
{
  "name": "test-project",
  "version": "1.0.0",
  "main": "src/index.ts"
}
          `,
          type: FileType.JSON
        },
        {
          path: '.eslintrc.json',
          content: `
{
  "extends": ["eslint:recommended"]
}
          `,
          type: FileType.JSON
        },
        {
          path: 'dist/bundle.js',
          content: 'compiled-bundle-content',
          type: FileType.JAVASCRIPT
        },
        {
          path: 'src/unused-module.ts',
          content: `
export const unused = 'not referenced';
          `,
          type: FileType.TYPESCRIPT
        }
      ],
      expectedUnused: [
        'config/database.config.ts',
        'src/unused-module.ts'
      ],
      expectedUsed: [
        'src/index.ts',
        'config/app.config.ts',
        'webpack.config.js',
        'tsconfig.json',
        'package.json',
        '.eslintrc.json'
      ],
      entryPoints: ['src/index.ts']
    };
  }

  /**
   * Get all available test fixtures
   */
  static getAllFixtures(): TestProjectStructure[] {
    return [
      this.getMinimalProject(),
      this.getNextJsProject(),
      this.getDynamicImportProject(),
      this.getTestHeavyProject(),
      this.getConfigHeavyProject()
    ];
  }

  /**
   * Get fixture by name
   */
  static getFixtureByName(name: string): TestProjectStructure | null {
    const fixtures = this.getAllFixtures();
    return fixtures.find(fixture => fixture.name === name) || null;
  }
}