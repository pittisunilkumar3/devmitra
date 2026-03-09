'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Developer } from '@/types';

// Helper to safely parse skills (handles both array and JSON string)
const parseSkills = (skills: string[] | string | null | undefined): string[] => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function DevelopersManagement() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filter, setFilter] = useState({
    status: '',
  });
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const response = await api.getDevelopers({
        page: pagination.page,
        limit: pagination.limit,
        ...filter,
      });
      setDevelopers(response.data || []);
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (error) {
      console.error('Failed to fetch developers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, [pagination.page, filter]);

  const handleApprove = async (developerId: number) => {
    try {
      await api.approveDeveloper(developerId);
      fetchDevelopers();
    } catch (error) {
      console.error('Failed to approve developer:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedDeveloper || !rejectReason.trim()) return;
    try {
      await api.rejectDeveloper(selectedDeveloper.id, rejectReason);
      setShowRejectModal(false);
      setSelectedDeveloper(null);
      setRejectReason('');
      fetchDevelopers();
    } catch (error) {
      console.error('Failed to reject developer:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const openRejectModal = (developer: Developer) => {
    setSelectedDeveloper(developer);
    setShowRejectModal(true);
    setRejectReason('');
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Developers Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Developers Grid */}
      <div className="grid gap-6">
        {developers.map((developer) => (
          <div key={developer.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {developer.user_name?.charAt(0).toUpperCase() || 'D'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{developer.user_name}</h3>
                  <p className="text-sm text-gray-500">{developer.job_title || 'Developer'}</p>
                  <p className="text-sm text-gray-500">{developer.user_email}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    {getStatusBadge(developer.approval_status)}
                    {developer.availability && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                        Available
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${developer.hourly_rate}/hr</p>
                <p className="text-sm text-gray-500">{developer.experience} years exp</p>
                <div className="mt-2 flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 text-sm text-gray-600">{(Number(developer.rating) || 0).toFixed(1)}</span>
                  <span className="ml-1 text-sm text-gray-400">({developer.total_projects || 0} projects)</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {parseSkills(developer.skills).slice(0, 6).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                  >
                    {skill}
                  </span>
                ))}
                {parseSkills(developer.skills).length > 6 && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                    +{parseSkills(developer.skills).length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {developer.bio && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-2">{developer.bio}</p>
              </div>
            )}

            {/* Location & Links */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              {developer.country && (
                <span>📍 {developer.country}</span>
              )}
              {developer.github_url && (
                <a href={developer.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  GitHub
                </a>
              )}
              {developer.linkedin_url && (
                <a href={developer.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  LinkedIn
                </a>
              )}
            </div>

            {/* Actions */}
            {developer.approval_status === 'pending' && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleApprove(developer.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => openRejectModal(developer)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Reject
                </button>
              </div>
            )}

            {developer.approval_status === 'rejected' && developer.rejected_reason && (
              <div className="mt-4 p-3 bg-red-50 rounded-md">
                <p className="text-sm text-red-700">
                  <strong>Rejection Reason:</strong> {developer.rejected_reason}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDeveloper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Developer: {selectedDeveloper.user_name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedDeveloper(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
