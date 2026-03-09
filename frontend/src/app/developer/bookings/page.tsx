'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Booking } from '@/types';

export default function DeveloperBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.getMyBookings({ limit: 50 });
      if (response.success && response.data) {
        setBookings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId: number) => {
    try {
      await api.acceptBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error('Failed to accept booking:', error);
    }
  };

  const handleDecline = async (bookingId: number) => {
    if (!confirm('Are you sure you want to decline this booking?')) return;
    try {
      await api.declineBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error('Failed to decline booking:', error);
    }
  };

  const handleComplete = async (bookingId: number) => {
    if (!confirm('Mark this booking as completed?')) return;
    try {
      await api.completeBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error('Failed to complete booking:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      disputed: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredBookings = filter 
    ? bookings.filter(b => b.status === filter)
    : bookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(booking.status)}
                  <span className="text-sm text-gray-500">{booking.booking_id}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{booking.project_title}</h3>
                <p className="text-sm text-gray-600 mt-1">{booking.project_description}</p>
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <p className="font-medium">{booking.user_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Budget:</span>
                    <p className="font-medium">${booking.budget}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Your Earnings:</span>
                    <p className="font-medium text-green-600">${booking.developer_earnings}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Deadline:</span>
                    <p className="font-medium">{booking.deadline ? new Date(booking.deadline).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="ml-4 text-right">
                {/* Actions based on status */}
                {booking.status === 'pending' && (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleAccept(booking.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(booking.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                      Decline
                    </button>
                  </div>
                )}
                
                {booking.status === 'accepted' && (
                  <button
                    onClick={() => handleComplete(booking.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Start Work
                  </button>
                )}
                
                {booking.status === 'in_progress' && (
                  <button
                    onClick={() => handleComplete(booking.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Mark Complete
                  </button>
                )}

                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="mt-2 block text-blue-600 hover:underline text-sm"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            <p>No bookings found</p>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-medium">{selectedBooking.booking_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Project Title</p>
                  <p className="font-medium">{selectedBooking.project_title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="font-medium">${selectedBooking.budget}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your Earnings</p>
                  <p className="font-medium text-green-600">${selectedBooking.developer_earnings}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Platform Fee</p>
                  <p className="font-medium">${selectedBooking.platform_fee}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium capitalize">{selectedBooking.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium capitalize">{selectedBooking.payment_status}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Project Description</p>
                <p className="mt-1">{selectedBooking.project_description || 'No description'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="font-medium">{selectedBooking.user_name}</p>
              </div>

              {selectedBooking.deadline && (
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium">{new Date(selectedBooking.deadline).toLocaleDateString()}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{new Date(selectedBooking.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
