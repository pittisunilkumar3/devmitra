'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function BrowseDevelopers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skills: '',
    minRate: '',
    maxRate: '',
    availability: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);
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
      const params: Record<string, unknown> = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.skills) params.skills = filters.skills;
      if (filters.minRate) params.minRate = parseFloat(filters.minRate);
      if (filters.maxRate) params.maxRate = parseFloat(filters.maxRate);
      if (filters.availability) params.availability = true;

      const response = await api.browseDevelopers(params);
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

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDevelopers();
  };

  const clearFilters = () => {
    setFilters({
      skills: '',
      minRate: '',
      maxRate: '',
      availability: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDevelopers();
  };

  const filteredDevelopers = searchTerm
    ? developers.filter(d => {
        const skillsArray = parseSkills(d.skills);
        return d.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          skillsArray.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
          d.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : developers;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Browse Developers</h1>
        <p className="text-gray-500">{pagination.total} developers available</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, skills, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <form onSubmit={handleFilterSubmit} className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Skills</label>
              <input
                type="text"
                placeholder="e.g., React, Node.js"
                value={filters.skills}
                onChange={(e) => setFilters({ ...filters, skills: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Rate ($/hr)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minRate}
                onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max Rate ($/hr)</label>
              <input
                type="number"
                placeholder="500"
                value={filters.maxRate}
                onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Availability</label>
              <select
                value={filters.availability}
                onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="true">Available Now</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-sm"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Developers Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevelopers.map((developer) => (
            <div key={developer.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                      {developer.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{developer.user_name}</h3>
                      <p className="text-sm text-gray-500">{developer.job_title || 'Developer'}</p>
                    </div>
                  </div>
                  {developer.availability && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Available
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm font-medium">{(Number(developer.rating) || 0).toFixed(1)}</span>
                    <span className="ml-1 text-xs text-gray-400">({developer.total_projects || 0} projects)</span>
                  </div>
                  {developer.country && (
                    <span className="text-xs text-gray-500">📍 {developer.country}</span>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {developer.bio || 'No bio available'}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {parseSkills(developer.skills).slice(0, 4).map((skill, index) => (
                    <span key={index} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {skill}
                    </span>
                  ))}
                  {parseSkills(developer.skills).length > 4 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
                      +{parseSkills(developer.skills).length - 4}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">${developer.hourly_rate}<span className="text-sm font-normal text-gray-500">/hr</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDeveloper(developer)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-sm"
                    >
                      View
                    </button>
                    <Link
                      href={`/user/book?developer=${developer.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDevelopers.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
          <p className="text-lg">No developers found</p>
          <p className="text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
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

      {/* Developer Detail Modal */}
      {selectedDeveloper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedDeveloper.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDeveloper.user_name}</h2>
                    <p className="text-gray-500">{selectedDeveloper.job_title || 'Developer'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 font-medium">{(Number(selectedDeveloper.rating) || 0).toFixed(1)}</span>
                      </div>
                      {selectedDeveloper.country && (
                        <span className="text-sm text-gray-500">📍 {selectedDeveloper.country}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDeveloper(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600">{selectedDeveloper.bio || 'No bio available'}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {parseSkills(selectedDeveloper.skills).map((skill, index) => (
                      <span key={index} className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="text-lg font-semibold">{selectedDeveloper.experience} years</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Hourly Rate</p>
                    <p className="text-lg font-semibold">${selectedDeveloper.hourly_rate}/hr</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Projects</p>
                    <p className="text-lg font-semibold">{selectedDeveloper.total_projects}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Availability</p>
                    <p className="text-lg font-semibold">{selectedDeveloper.availability ? 'Available' : 'Busy'}</p>
                  </div>
                </div>

                {selectedDeveloper.github_url || selectedDeveloper.linkedin_url ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Links</h3>
                    <div className="flex gap-4">
                      {selectedDeveloper.github_url && (
                        <a href={selectedDeveloper.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          GitHub
                        </a>
                      )}
                      {selectedDeveloper.linkedin_url && (
                        <a href={selectedDeveloper.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setSelectedDeveloper(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <Link
                  href={`/user/book?developer=${selectedDeveloper.id}`}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
