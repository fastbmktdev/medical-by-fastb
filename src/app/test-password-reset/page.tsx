"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, KeyIcon } from "@heroicons/react/24/outline";

/**
 * Test Password Reset Page
 * This page helps test the password reset token handling
 */
export default function TestPasswordResetPage() {
  const [testToken, setTestToken] = useState("test-token-12345");
  const [testType, setTestType] = useState("recovery");
  const [testAccessToken, setTestAccessToken] = useState("test-access-token-67890");
  const [testRefreshToken, setTestRefreshToken] = useState("test-refresh-token-abcdef");

  const generateTestUrl = () => {
    if (typeof window === 'undefined') {
      return 'Loading...';
    }
    
    const baseUrl = `${window.location.origin}/forget-password`;
    const params = new URLSearchParams();
    
    if (testToken) params.set('token', testToken);
    if (testType) params.set('type', testType);
    if (testAccessToken) params.set('access_token', testAccessToken);
    if (testRefreshToken) params.set('refresh_token', testRefreshToken);
    
    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('URL copied to clipboard!');
    }
  };

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="mb-2 font-bold text-white text-3xl">
            🧪 Test Password Reset Token
          </h1>
          <p className="text-zinc-400 text-base">
            ทดสอบการรับ token ในหน้า forget-password
          </p>
        </div>

        {/* Test Form */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyIcon className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-white text-lg">Test Parameters</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Token
              </label>
              <input
                type="text"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                placeholder="test-token-12345"
              />
            </div>

            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Type
              </label>
              <input
                type="text"
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                placeholder="recovery"
              />
            </div>

            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Access Token
              </label>
              <input
                type="text"
                value={testAccessToken}
                onChange={(e) => setTestAccessToken(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                placeholder="test-access-token-67890"
              />
            </div>

            <div>
              <label className="block text-zinc-300 text-sm font-medium mb-2">
                Refresh Token
              </label>
              <input
                type="text"
                value={testRefreshToken}
                onChange={(e) => setTestRefreshToken(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                placeholder="test-refresh-token-abcdef"
              />
            </div>
          </div>
        </div>

        {/* Generated URL */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl mb-6">
          <h3 className="font-semibold text-white text-lg mb-4">Generated Test URL</h3>
          <div className="bg-zinc-800 p-4 rounded-lg mb-4">
            <code className="text-green-400 text-sm break-all">
              {typeof window !== 'undefined' ? generateTestUrl() : 'Loading...'}
            </code>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => copyToClipboard(generateTestUrl())}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            >
              📋 Copy URL
            </button>
            <Link
              href={generateTestUrl()}
              target="_blank"
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            >
              🔗 Open Test URL
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-6">
          <h3 className="font-semibold text-blue-400 text-lg mb-3">📋 Testing Instructions</h3>
          <div className="space-y-2 text-sm text-blue-300">
            <p>1. <strong>Real Test:</strong> Go to login page → Click "ลืมรหัสผ่าน" → Enter email → Check email for reset link</p>
            <p>2. <strong>Manual Test:</strong> Use the generated URL above to test token handling</p>
            <p>3. <strong>Check Console:</strong> Open Developer Tools → Console to see token information</p>
            <p>4. <strong>Verify:</strong> The forget-password page should show token debug information</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-400 text-sm transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
