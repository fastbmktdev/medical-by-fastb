"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/database/supabase/client";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

/**
 * Debug Supabase Configuration Page
 * Helps diagnose Supabase connection and configuration issues
 */
export default function DebugSupabasePage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      const info: any = {
        environment: {
          nodeEnv: process.env.NODE_ENV,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
          supabaseAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        },
        client: {
          initialized: false,
          error: null,
        },
        network: {
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
          online: typeof window !== 'undefined' ? navigator.onLine : 'Unknown',
          location: typeof window !== 'undefined' ? window.location.href : 'Server',
        },
        timestamp: new Date().toISOString(),
      };

      try {
        // Test Supabase client initialization
        const supabase = createClient();
        info.client.initialized = true;
        info.client.url = supabase.supabaseUrl;
        info.client.key = supabase.supabaseKey ? 'Set' : 'Missing';

        // Test basic connection
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        setConnectionTest({
          success: !error,
          error: error?.message,
          data: data,
        });

      } catch (error) {
        info.client.error = error instanceof Error ? error.message : 'Unknown error';
      }

      setDebugInfo(info);
      setIsLoading(false);
    };

    runDiagnostics();
  }, []);

  const testPasswordReset = async () => {
    try {
      const supabase = createClient();
      const testEmail = 'test@example.com';
      
      console.log('🧪 Testing password reset with email:', testEmail);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        testEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      console.log('🧪 Password reset test result:', { data, error });
      
      alert(`Password reset test completed. Check console for details. Error: ${error?.message || 'None'}`);
    } catch (error) {
      console.error('🧪 Password reset test failed:', error);
      alert(`Password reset test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-128px)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4 border-4 border-red-600 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
          <p className="text-zinc-300 text-lg">กำลังตรวจสอบการตั้งค่า...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-128px)] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-2 font-bold text-white text-3xl">
            🔧 Supabase Debug Information
          </h1>
          <p className="text-zinc-400 text-base">
            ตรวจสอบการตั้งค่าและเชื่อมต่อ Supabase
          </p>
        </div>

        {/* Environment Variables */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl mb-6">
          <h2 className="font-semibold text-white text-xl mb-4">Environment Variables</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {debugInfo.environment?.supabaseUrl ? (
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-400" />
              )}
              <span className="text-zinc-300">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className="font-mono text-white text-sm">
                {debugInfo.environment?.supabaseUrl || 'Missing'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {debugInfo.environment?.supabaseAnonKey === 'Set' ? (
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-400" />
              )}
              <span className="text-zinc-300">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className="font-mono text-white text-sm">
                {debugInfo.environment?.supabaseAnonKey} ({debugInfo.environment?.supabaseAnonKeyLength} chars)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-400" />
              <span className="text-zinc-300">NODE_ENV:</span>
              <span className="font-mono text-white text-sm">
                {debugInfo.environment?.nodeEnv}
              </span>
            </div>
          </div>
        </div>

        {/* Client Status */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl mb-6">
          <h2 className="font-semibold text-white text-xl mb-4">Supabase Client Status</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {debugInfo.client?.initialized ? (
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-400" />
              )}
              <span className="text-zinc-300">Client Initialized:</span>
              <span className="font-mono text-white text-sm">
                {debugInfo.client?.initialized ? 'Yes' : 'No'}
              </span>
            </div>

            {debugInfo.client?.error && (
              <div className="flex items-center gap-3">
                <XCircleIcon className="w-5 h-5 text-red-400" />
                <span className="text-zinc-300">Error:</span>
                <span className="font-mono text-red-400 text-sm">
                  {debugInfo.client.error}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-400" />
              <span className="text-zinc-300">Client URL:</span>
              <span className="font-mono text-white text-sm">
                {debugInfo.client?.url || 'N/A'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {debugInfo.client?.key === 'Set' ? (
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-400" />
              )}
              <span className="text-zinc-300">Client Key:</span>
              <span className="font-mono text-white text-sm">
                {debugInfo.client?.key || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Connection Test */}
        {connectionTest && (
          <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl mb-6">
            <h2 className="font-semibold text-white text-xl mb-4">Database Connection Test</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {connectionTest.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircleIcon className="w-5 h-5 text-red-400" />
                )}
                <span className="text-zinc-300">Connection Status:</span>
                <span className={`font-mono text-sm ${connectionTest.success ? 'text-green-400' : 'text-red-400'}`}>
                  {connectionTest.success ? 'Success' : 'Failed'}
                </span>
              </div>

              {connectionTest.error && (
                <div className="flex items-center gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-400" />
                  <span className="text-zinc-300">Error:</span>
                  <span className="font-mono text-red-400 text-sm">
                    {connectionTest.error}
                  </span>
                </div>
              )}

              {connectionTest.data && (
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <span className="text-zinc-300">Data:</span>
                  <span className="font-mono text-white text-sm">
                    {JSON.stringify(connectionTest.data)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Information */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl mb-6">
          <h2 className="font-semibold text-white text-xl mb-4">Network Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-400" />
              <span className="text-zinc-300">Online Status:</span>
              <span className="font-mono text-white text-sm">
                {debugInfo.network?.online ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-400" />
              <span className="text-zinc-300">Current URL:</span>
              <span className="font-mono text-white text-sm break-all">
                {debugInfo.network?.location}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-blue-400" />
              <span className="text-zinc-300">User Agent:</span>
              <span className="font-mono text-white text-sm break-all">
                {debugInfo.network?.userAgent}
              </span>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl mb-6">
          <h2 className="font-semibold text-white text-xl mb-4">Test Actions</h2>
          <div className="space-y-4">
            <button
              onClick={testPasswordReset}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold text-white transition-colors"
            >
              🧪 Test Password Reset Function
            </button>
            
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold text-yellow-400">Note</span>
              </div>
              <p className="text-yellow-300 text-sm">
                การทดสอบ password reset จะส่งอีเมลไปยัง test@example.com 
                (ซึ่งจะล้มเหลวเพราะไม่มีผู้ใช้นี้) แต่จะช่วยตรวจสอบการเชื่อมต่อ Supabase
              </p>
            </div>
          </div>
        </div>

        {/* Raw Debug Data */}
        <div className="bg-zinc-950 shadow-2xl p-6 rounded-2xl">
          <h2 className="font-semibold text-white text-xl mb-4">Raw Debug Data</h2>
          <pre className="bg-zinc-800 p-4 rounded-lg overflow-auto text-xs text-zinc-300">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
