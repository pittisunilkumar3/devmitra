'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import type { Developer } from '@/types';

export default function BookDeveloper() {
  const router = useRouter();
  const { id: developerId } = useParams();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    project_title: '',
    project_description: '',
    project_type: '',
    budget: '',
    deadline: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchDeveloper();
  }, [developerId]);

  const fetchDeveloper = async () => {
    try {
      const response = await api.getDeveloper(parseInt(developerId as string));
      if (response.success && response.data) {
        setDeveloper(response.data);
      } else {
        setError('Developer not found');
      }
    } catch (err) {
      console.error('Failed to fetch developer:', err);
      setError('Failed to load developer');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.createBooking({
        developer_id: parseInt(developerId as string),
        project_title: formData.project_title,
        project_description: formData.project_description,
        project_type: formData.project_type,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
      });

      if (response.success) {
        router.push('/user/bookings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const platformFee = formData.budget ? parseFloat(formData.budget) * 0.1 : 0;
  const total = formData.budget ? parseFloat(formData.budget) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Book a Developer</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.project_title}
                onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                required
                placeholder="e.g., E-commerce Website Development"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                value={formData.project_description}
                onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                required
                rows={4}
                placeholder="Describe your project requirements in detail..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                <option value="website">Website</option>
                <option value="web_app">Web Application</option>
                <option value="mobile_app">Mobile App</option>
                <option value="api">API Development</option>
                <option value="ecommerce">E-commerce</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget ($) *
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                  min="50"
                  placeholder="500"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {developer && (
                  <p className="text-xs text-gray-500 mt-1">
                    Developer rate: ${developer.hourly_rate}/hr
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.project_title || !formData.budget}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>

        {/* Developer Info & Summary */}
        <div className="space-y-6">
          {/* Developer Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Developer</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {developer.user_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{developer.user_name}</p>
                <p className="text-sm text-gray-500">{developer.job_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-yellow-500">★</span>
              <span>{(Number(developer.rating) || 0).toFixed((1)}</span>
              <span className="text-gray-400">•</span>
              <span>{developer.total_projects} projects</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1">
              {developer.skills.slice(0, 4).map((skill, index) => (
                <span key={index} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Cost Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Project Budget</span>
                <span className="font-medium">${(Number(total) || 0).toFixed((2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (10%)</span>
                <span className="font-medium">${(Number(platformFee) || 0).toFixed((2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Developer Earnings</span>
                <span className="font-medium text-green-600">${(total - platformFee).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-xl">${(Number(total) || 0).toFixed((2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Terms & Conditions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Payment is held in escrow until project completion</li>
              <li>• 10% platform fee applies to all bookings</li>
              <li>• You can cancel within 24 hours for a full refund</li>
              <li>• Contact support for any disputes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
