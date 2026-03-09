'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Developer } from '@/types';

export default function BrowseDevelopers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchDevelopers();
  }, [pagination.page]);

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const response = await api.browseDevelopers({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success && response.data) {
        setDevelopers(response.data);
        setPagination(prev => ({ ...prev, ...response.pagination }));
      }
    } catch (error) {
      console.error('Failed to fetch developers:', error);
    } finally {
      setLoading(false);
    }
  };

  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevelopers = searchTerm
    ? developers.filter(d =>
        d.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        d.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : developers;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Book A Developer
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search developers by name, skill, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Developers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredDevelopers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevelopers.map((developer) => (
              <div key={developer.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
                <img
                  src={developer.profile_image || `https://ui-avatars.com/api/?name=${developer.user_name}&background=random`}
                  alt={developer.user_name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 truncate">{developer.user_name}</h3>
                    {developer.availability && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Available
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 mb-2">{developer.job_title}</p>

                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm font-medium">{(Number(developer.rating) || 0).toFixed(1)}</span>
                    <span className="ml-1 text-xs text-gray-400">({developer.total_projects} projects)</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {developer.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        {skill}
                      </span>
                    ))}
                    {developer.skills.length > 3 && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-400">
                        +{developer.skills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">${developer.hourly_rate}<span className="text-sm font-normal text-gray-500">/hr</span></p>
                    </div>
                    <button
                      onClick={() => setSelectedDeveloper(developer)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No developers found</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Developer Detail Modal */}
      {selectedDeveloper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedDeveloper.profile_image || `https://ui-avatars.com/api/?name=${selectedDeveloper.user_name}&background=random`}
                    alt={selectedDeveloper.user_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">{selectedDeveloper.user_name}</h2>
                    <p className="text-sm text-gray-500">{selectedDeveloper.job_title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDeveloper(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 font-medium">{(Number(selectedDeveloper.rating) || 0).toFixed(1)}</span>
                    <span className="ml-1 text-sm text-gray-400">({selectedDeveloper.total_projects} projects)</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hourly Rate</p>
                  <p className="font-semibold text-green-600">${selectedDeveloper.hourly_rate}/hr</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{selectedDeveloper.experience} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedDeveloper.country || 'Not specified'}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDeveloper.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Bio</p>
                <p className="text-gray-700">{selectedDeveloper.bio || 'No bio available'}</p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedDeveloper(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <Link
                  href="/auth/register?role=user"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
