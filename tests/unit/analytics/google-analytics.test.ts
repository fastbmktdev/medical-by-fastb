import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import React from 'react';

const MOCK_SCRIPT_SYMBOL = Symbol('MockNextScript');

// Mock Next.js Script component with displayName set for identity
jest.mock('next/script', () => {
  const MockScript = Object.assign(
    (props: React.ComponentProps<'script'> & { id?: string }) => ({
      $$typeof: MOCK_SCRIPT_SYMBOL,
      props,
    }),
    { displayName: 'MockNextScript' }
  );
  return {
    __esModule: true,
    default: MockScript,
  };
});

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
  jest.restoreAllMocks();
});

describe('GoogleAnalytics component', () => {
  const getGoogleAnalytics = async () =>
    (await import('../../../src/components/shared/analytics/GoogleAnalytics')).GoogleAnalytics;

  test('renders GA script tags when measurement ID is set', async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123';

    const GoogleAnalytics = await getGoogleAnalytics();
    const element = GoogleAnalytics();

    expect(element).not.toBeNull();
    expect(element?.type).toBe(React.Fragment);

    const children = element?.props?.children;
    expect(Array.isArray(children)).toBe(true);
    expect(children).toHaveLength(2);

    const [externalScript, inlineScript] = children as Array<{ type: unknown; props: Record<string, unknown> }>;

    [externalScript, inlineScript].forEach(script =>
      expect((script.type as { displayName?: string })?.displayName).toBe('MockNextScript')
    );

    expect(externalScript.props).toMatchObject({
      id: 'ga-script',
      src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST123',
      strategy: 'afterInteractive',
    });

    expect(inlineScript.props).toMatchObject({
      id: 'ga-inline-init',
      strategy: 'afterInteractive',
    });

    expect(typeof inlineScript.props.children).toBe('string');
    expect(inlineScript.props.children).toContain("gtag('config', 'G-TEST123'");
  });

  test('warns and renders nothing when measurement ID is missing', async () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const GoogleAnalytics = await getGoogleAnalytics();
    const element = GoogleAnalytics();

    expect(warnSpy).toHaveBeenCalledWith(
      'Google Analytics: NEXT_PUBLIC_GA_MEASUREMENT_ID is not set'
    );
    expect(element).toBeNull();
  });
});

