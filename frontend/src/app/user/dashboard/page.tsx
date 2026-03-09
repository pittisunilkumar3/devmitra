'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types';

export default function UserDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.getMyBookings({ limit: 10 });
      if (response.success && response.data) {
        setBookings(response.data);
        
        const active = response.data.filter(b => 
          ['pending', 'accepted', 'in_progress'].includes(b.status)
        ).length;
        const completed = response.data.filter(b => b.status === 'completed').length;
        const totalSpent = response.data
          .filter(b => b.payment_status === 'paid')
          .reduce((sum, b) => sum + (b.budget || 0), 0);

        setStats({
          activeBookings: active,
          completedBookings: completed,
          totalSpent,
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Bookings</h3>
            <span className="text-3xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.activeBookings}</p>
          <Link href="/user/bookings" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
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
            <h3 className="text-lg font-semibold text-gray-900">Total Spent</h3>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600">${(Number(stats.totalSpent) || 0).toFixed(2)}</p>          <p className="text-sm text-gray-500 mt-2">Total amount spent</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/user/browse"
            className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            <span className="text-2xl mb-2">🔍</span>
            <span className="text-sm font-medium text-gray-700">Find Developers</span>
          </Link>
          <Link
            href="/user/bookings"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">📅</span>
            <span className="text-sm font-medium text-gray-700">My Bookings</span>
          </Link>
          <Link
            href="/user/tickets"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">🎫</span>
            <span className="text-sm font-medium text-gray-700">Get Support</span>
          </Link>
          <Link
            href="/user/bookings"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">⭐</span>
            <span className="text-sm font-medium text-gray-700">Leave Review</span>
          </Link>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
          <Link href="/user/bookings" className="text-blue-600 hover:underline text-sm">
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
                    <p className="text-sm text-gray-500 mt-1">Developer: {booking.developer_name}</p>
                    <p className="text-xs text-gray-400 mt-1">{booking.booking_id}</p>
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
            <Link href="/user/browse" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              Find a developer to get started
            </Link>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
        <h2 className="text-xl font-semibold mb-4">How to Book a Developer</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">1</span>
            <div>
              <h3 className="font-medium">Browse Developers</h3>
              <p className="text-sm text-blue-100">Search and filter through our verified developers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">2</span>
            <div>
              <h3 className="font-medium">Book Instantly</h3>
              <p className="text-sm text-blue-100">Submit your project details and requirements</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">3</span>
            <div>
              <h3 className="font-medium">Get Work Done</h3>
              <p className="text-sm text-blue-100">Track progress and collaborate securely</p>
            </div>
          </div>
        </div>
        <Link
          href="/user/browse"
          className="mt-4 inline-block px-6 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition"
        >
          Find a Developer Now
        </Link>
      </div>
    </div>
  );
}
