'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { UserStats, DeveloperStats, BookingStats, TicketStats } from '@/types';

interface DashboardStats {
  users: UserStats | null;
  developers: DeveloperStats | null;
  bookings: BookingStats | null;
  tickets: TicketStats | null;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    users: null,
    developers: null,
    bookings: null,
    tickets: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, developersRes, bookingsRes, ticketsRes] = await Promise.all([
          api.getUserStats(),
          api.getDeveloperStats(),
          api.getBookingStats(),
          api.getTicketStats(),
        ]);

        setStats({
          users: usersRes.data || null,
          developers: developersRes.data || null,
          bookings: bookingsRes.data || null,
          tickets: ticketsRes.data || null,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      stats: stats.users,
      items: [
        { label: 'Total', value: stats.users?.total || 0, color: 'text-blue-600' },
        { label: 'Active', value: stats.users?.active || 0, color: 'text-green-600' },
        { label: 'Blocked', value: stats.users?.blocked || 0, color: 'text-red-600' },
      ],
      icon: '👥',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Developers',
      stats: stats.developers,
      items: [
        { label: 'Total', value: stats.developers?.total || 0, color: 'text-purple-600' },
        { label: 'Approved', value: stats.developers?.approved || 0, color: 'text-green-600' },
        { label: 'Pending', value: stats.developers?.pending || 0, color: 'text-yellow-600' },
      ],
      icon: '💻',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Bookings',
      stats: stats.bookings,
      items: [
        { label: 'Total', value: stats.bookings?.total || 0, color: 'text-indigo-600' },
        { label: 'Pending', value: stats.bookings?.pending || 0, color: 'text-yellow-600' },
        { label: 'Completed', value: stats.bookings?.completed || 0, color: 'text-green-600' },
      ],
      icon: '📅',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Support Tickets',
      stats: stats.tickets,
      items: [
        { label: 'Total', value: stats.tickets?.total || 0, color: 'text-orange-600' },
        { label: 'Open', value: stats.tickets?.open || 0, color: 'text-red-600' },
        { label: 'Resolved', value: stats.tickets?.resolved || 0, color: 'text-green-600' },
      ],
      icon: '🎫',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className={`${card.bgColor} rounded-lg p-6 shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
              <span className="text-3xl">{card.icon}</span>
            </div>
            <div className="space-y-2">
              {card.items.map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">
              ${stats.bookings?.revenue?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Active Bookings</p>
            <p className="text-3xl font-bold text-blue-600">
              {(stats.bookings?.pending || 0) + (stats.bookings?.in_progress || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Pending Developers</p>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.developers?.pending || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/superadmin/developers?status=pending"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">⏳</span>
            <span className="text-sm font-medium text-gray-700">Pending Approvals</span>
            <span className="text-xs text-gray-500">{stats.developers?.pending || 0} waiting</span>
          </a>
          <a
            href="/superadmin/tickets?status=open"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">🔴</span>
            <span className="text-sm font-medium text-gray-700">Open Tickets</span>
            <span className="text-xs text-gray-500">{stats.tickets?.open || 0} open</span>
          </a>
          <a
            href="/superadmin/bookings?status=pending"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">📋</span>
            <span className="text-sm font-medium text-gray-700">Pending Bookings</span>
            <span className="text-xs text-gray-500">{stats.bookings?.pending || 0} pending</span>
          </a>
          <a
            href="/superadmin/users"
            className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            <span className="text-2xl mb-2">👥</span>
            <span className="text-sm font-medium text-gray-700">Manage Users</span>
            <span className="text-xs text-gray-500">{stats.users?.total || 0} users</span>
          </a>
        </div>
      </div>
    </div>
  );
}
