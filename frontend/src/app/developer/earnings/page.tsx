'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Booking } from '@/types';

export default function DeveloperEarnings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0,
    withdrawnAmount: 0,
  });

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const response = await api.getMyBookings({ limit: 100 });
      if (response.success && response.data) {
        setBookings(response.data);
        
        // Calculate earnings
        const completed = response.data.filter(b => b.status === 'completed');
        const inProgress = response.data.filter(b => ['accepted', 'in_progress'].includes(b.status));
        const paid = completed.filter(b => b.payment_status === 'paid');
        
        const totalEarnings = paid.reduce((sum, b) => sum + (b.developer_earnings || 0), 0);
        const pendingEarnings = inProgress.reduce((sum, b) => sum + (b.developer_earnings || 0), 0);
        
        setStats({
          totalEarnings,
          pendingEarnings,
          availableBalance: totalEarnings, // Simplified - in real app would track withdrawals
          withdrawnAmount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
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

  const completedBookings = bookings.filter(b => b.status === 'completed');
  const inProgressBookings = bookings.filter(b => ['accepted', 'in_progress'].includes(b.status));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Earned</h3>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600">${(Number(stats.totalEarnings) || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">From completed projects</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
            <span className="text-3xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">${(Number(stats.pendingEarnings) || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">From active projects</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available</h3>
            <span className="text-3xl">💳</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">${(Number(stats.availableBalance) || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Available for withdrawal</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Withdrawn</h3>
            <span className="text-3xl">📤</span>
          </div>
          <p className="text-3xl font-bold text-gray-600">${(Number(stats.withdrawnAmount) || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Total withdrawn</p>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">${(Number(stats.availableBalance) || 0).toFixed(2)}</p>
          </div>
          <button
            disabled={stats.availableBalance < 50}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Request Withdrawal
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Minimum withdrawal amount: $50</p>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings Breakdown</h2>
        
        {/* In Progress */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">In Progress ({inProgressBookings.length})</h3>
          <div className="space-y-3">
            {inProgressBookings.map((booking) => (
              <div key={booking.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{booking.project_title}</p>
                  <p className="text-sm text-gray-500">{booking.booking_id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-yellow-600">${(Number(booking.developer_earnings) || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
            ))}
            {inProgressBookings.length === 0 && (
              <p className="text-gray-500 text-sm">No active projects</p>
            )}
          </div>
        </div>

        {/* Completed */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">Completed ({completedBookings.length})</h3>
          <div className="space-y-3">
            {completedBookings.map((booking) => (
              <div key={booking.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{booking.project_title}</p>
                  <p className="text-sm text-gray-500">{booking.booking_id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">${(Number(booking.developer_earnings) || 0).toFixed(2)}</p>
                  <p className={`text-xs ${booking.payment_status === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {booking.payment_status}
                  </p>
                </div>
              </div>
            ))}
            {completedBookings.length === 0 && (
              <p className="text-gray-500 text-sm">No completed projects yet</p>
            )}
          </div>
        </div>
      </div>

      {/* How Earnings Work */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-4">How Earnings Work</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">💰 Platform Fee</p>
            <p>We charge a 10% fee on each completed project to maintain the platform.</p>
          </div>
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">⏳ Payment Schedule</p>
            <p>Earnings become available 14 days after project completion.</p>
          </div>
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">📤 Withdrawals</p>
            <p>Request withdrawals anytime. Processing takes 3-5 business days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
