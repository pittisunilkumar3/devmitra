'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Developer } from '@/types';

export default function PendingApproval() {
  const { user } = useAuth();
  const router = useRouter();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeveloperStatus();
    }
  }, [user]);

  const fetchDeveloperStatus = async () => {
    try {
      const response = await api.getDeveloper(user!.id);
      if (response.success && response.data) {
        setDeveloper(response.data);
        
        // If approved, redirect to dashboard
        if (response.data.approval_status === 'approved') {
          router.push('/developer/dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to fetch developer status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Poll every 30 seconds to check for status updates
    const interval = setInterval(fetchDeveloperStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-4xl">⏳</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Under Review
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Your developer profile has currently under review by our team. 
            This typically takes 1-2 business days.
          </p>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-20 h-1 bg-green-500 rounded"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
              <div className="w-20 h-1 bg-gray-300 rounded"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Submitted</span>
              <span>Under Review</span>
              <span>Approved</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Our team reviews your profile</li>
              <li>✓ We verify your skills and experience</li>
              <li>✓ You'll receive an email notification</li>
              <li>✓ Once approved, you can start receiving bookings</li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="text-sm text-gray-500">
            <p>Have questions?</p>
            <Link href="/developer/tickets" className="text-blue-600 hover:underline">
              Contact Support →
            </Link>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t flex justify-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Home
            </button>
            <button
              onClick={() => fetchDeveloperStatus()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
