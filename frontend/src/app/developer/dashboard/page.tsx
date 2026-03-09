'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Booking, Developer } from '@/types';

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch developer profile (use getMyDeveloperProfile which fetches by authenticated user)
        try {
          const devRes = await api.getMyDeveloperProfile();
          if (devRes.success && devRes.data) {
            setDeveloper(devRes.data);
          }
        } catch (devError) {
          // Developer profile doesn't exist yet - this is OK for new users
          console.log('No developer profile found:', devError);
          setDeveloper(null);
        }

        // Fetch bookings
        const bookingsRes = await api.getMyBookings({ limit: 10 });
        if (bookingsRes.success && bookingsRes.data) {
          setBookings(bookingsRes.data);
          
          // Calculate stats
          const active = bookingsRes.data.filter(b => 
            ['pending', 'accepted', 'in_progress'].includes(b.status)
          ).length;
          const completed = bookingsRes.data.filter(b => b.status === 'completed').length;
          const totalEarnings = bookingsRes.data
            .filter(b => b.status === 'completed' && b.payment_status === 'paid')
            .reduce((sum, b) => sum + (b.developer_earnings || 0), 0);
          const pendingEarnings = bookingsRes.data
            .filter(b => ['pending', 'in_progress'].includes(b.status))
            .reduce((sum, b) => sum + (b.developer_earnings || 0), 0);

          setStats({
            activeBookings: active,
            completedBookings: completed,
            totalEarnings,
            pendingEarnings,
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if developer profile exists and is approved
  const profileComplete = developer?.approval_status === 'approved';

  return (
    <div className="space-y-6">
      {/* Profile Status Banner */}
      {!profileComplete && (
        <div className={`p-4 rounded-lg ${developer?.approval_status === 'pending' ? 'bg-yellow-50 border border-yellow-200' : developer?.approval_status === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">
              {developer?.approval_status === 'pending' ? '⏳' : developer?.approval_status === 'rejected' ? '❌' : '📝'}
            </span>
            <div>
              <h3 className={`font-semibold ${developer?.approval_status === 'pending' ? 'text-yellow-800' : developer?.approval_status === 'rejected' ? 'text-red-800' : 'text-blue-800'}`}>
                {developer?.approval_status === 'pending' && 'Profile Pending Approval'}
                {developer?.approval_status === 'rejected' && 'Profile Rejected'}
                {!developer && 'Complete Your Profile'}
              </h3>
              <p className={`text-sm ${developer?.approval_status === 'pending' ? 'text-yellow-700' : developer?.approval_status === 'rejected' ? 'text-red-700' : 'text-blue-700'}`}>
                {developer?.approval_status === 'pending' && 'Your profile is under review. You will be notified once approved.'}
                {developer?.approval_status === 'rejected' && `Reason: ${developer?.rejected_reason || 'Not specified'}`}
                {!developer && 'Please complete your developer profile to start receiving bookings.'}
              </p>
            </div>
          </div>
          {(!developer || developer?.approval_status === 'rejected') && (
            <Link
              href="/developer/onboarding"
              className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              {developer?.approval_status === 'rejected' ? 'Update Profile' : 'Complete Profile'}
            </Link>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Bookings</h3>
            <span className="text-3xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.activeBookings}</p>
          <Link href="/developer/bookings" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.completedBookings}</p>
          <p className="text-sm text-gray-500 mt-2">Total projects completed</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600">${(Number(stats.totalEarnings) || 0).toFixed(2)}</p>
          <Link href="/developer/earnings" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            View details →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <span className="text-3xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">${(Number(stats.pendingEarnings) || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Earnings in progress</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/developer/bookings" className="text-blue-600 hover:underline text-sm">
            View all →
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.project_title}</h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {booking.booking_id}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' :
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-2">${booking.budget}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No bookings yet</p>
            <p className="text-sm mt-2">Complete your profile to start receiving booking requests</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/developer/onboarding"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">👤</span>
            <span className="text-sm font-medium text-gray-700">Edit Profile</span>
          </Link>
          <Link
            href="/developer/bookings"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">📅</span>
            <span className="text-sm font-medium text-gray-700">View Bookings</span>
          </Link>
          <Link
            href="/developer/earnings"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">💰</span>
            <span className="text-sm font-medium text-gray-700">Earnings</span>
          </Link>
          <Link
            href="/developer/tickets"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">🎫</span>
            <span className="text-sm font-medium text-gray-700">Get Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
