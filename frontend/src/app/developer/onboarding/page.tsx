'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const steps = [
  { id: 1, title: 'Personal Info' },
  { id: 2, title: 'Professional Details' },
  { id: 3, title: 'Work Preferences' },
  { id: 4, title: 'Portfolio & Links' },
  { id: 5, title: 'Terms & Submit' },
];

const skillOptions = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js',
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'Go',
  'PHP', 'Laravel', 'Ruby', 'Rails', 'Swift', 'Kotlin', 'Flutter',
  'React Native', 'iOS', 'Android', 'MySQL', 'PostgreSQL', 'MongoDB',
  'Redis', 'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes',
  'GraphQL', 'REST API', 'HTML/CSS', 'Tailwind CSS', 'SASS/SCSS',
];

export default function DeveloperOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    phone: '',
    country: '',
    timezone: '',
    profile_image: '',
    
    // Step 2: Professional Details
    job_title: '',
    experience: 0,
    skills: [] as string[],
    bio: '',
    
    // Step 3: Work Preferences
    hourly_rate: 50,
    availability: true,
    weekly_hours: 40,
    
    // Step 4: Portfolio & Links
    portfolio: '',
    github_url: '',
    linkedin_url: '',
    other_urls: [] as string[],
    
    // Step 5: Terms
    terms_accepted: false,
    contact_sharing_accepted: false,
  });

  const [newOtherUrl, setNewOtherUrl] = useState('');

  const updateFormData = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const addOtherUrl = () => {
    if (newOtherUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        other_urls: [...prev.other_urls, newOtherUrl.trim()]
      }));
      setNewOtherUrl('');
    }
  };

  const removeOtherUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      other_urls: prev.other_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.createDeveloperProfile({
        phone: formData.phone,
        country: formData.country,
        timezone: formData.timezone,
        job_title: formData.job_title,
        experience: formData.experience,
        skills: formData.skills,
        bio: formData.bio,
        hourly_rate: formData.hourly_rate,
        availability: formData.availability,
        weekly_hours: formData.weekly_hours,
        portfolio: formData.portfolio,
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        other_urls: formData.other_urls,
      });

      if (response.success) {
        router.push('/developer/pending');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="+1234567890"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <select
                value={formData.country}
                onChange={(e) => updateFormData('country', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Country</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="India">India</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone *
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => updateFormData('timezone', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Timezone</option>
                <option value="UTC-8">Pacific Time (UTC-8)</option>
                <option value="UTC-5">Eastern Time (UTC-5)</option>
                <option value="UTC+0">UTC</option>
                <option value="UTC+1">Central European Time (UTC+1)</option>
                <option value="UTC+5:30">India Standard Time (UTC+5:30)</option>
                <option value="UTC+8">China Standard Time (UTC+8)</option>
                <option value="UTC+9">Japan Standard Time (UTC+9)</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => updateFormData('job_title', e.target.value)}
                placeholder="e.g., Senior Full Stack Developer"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience *
              </label>
              <select
                value={formData.experience}
                onChange={(e) => updateFormData('experience', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">Less than 1 year</option>
                <option value="1">1 year</option>
                <option value="2">2 years</option>
                <option value="3">3 years</option>
                <option value="4">4 years</option>
                <option value="5">5 years</option>
                <option value="6">6 years</option>
                <option value="7">7 years</option>
                <option value="8">8 years</option>
                <option value="9">9 years</option>
                <option value="10">10+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills * (Select at least 3)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                {skillOptions.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 text-xs rounded-full transition ${
                      formData.skills.includes(skill)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: {formData.skills.length} skills
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio *
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Tell us about yourself, your experience, and what you specialize in..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Preferences</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($) *
              </label>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => updateFormData('hourly_rate', parseFloat(e.target.value))}
                min="5"
                max="500"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Set your hourly rate in USD</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weekly Hours Available *
              </label>
              <input
                type="number"
                value={formData.weekly_hours}
                onChange={(e) => updateFormData('weekly_hours', parseInt(e.target.value))}
                min="5"
                max="60"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Available for Work</h4>
                <p className="text-sm text-gray-500">Toggle this when you're not available for new projects</p>
              </div>
              <button
                type="button"
                onClick={() => updateFormData('availability', !formData.availability)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  formData.availability ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  formData.availability ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio & Links</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio URL
              </label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={(e) => updateFormData('portfolio', e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Profile
              </label>
              <input
                type="url"
                value={formData.github_url}
                onChange={(e) => updateFormData('github_url', e.target.value)}
                placeholder="https://github.com/username"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn Profile
              </label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => updateFormData('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other URLs
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={newOtherUrl}
                  onChange={(e) => setNewOtherUrl(e.target.value)}
                  placeholder="https://other-link.com"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addOtherUrl}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              {formData.other_urls.length > 0 && (
                <div className="space-y-2">
                  {formData.other_urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md">
                      <span className="flex-1 text-sm text-gray-700 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeOtherUrl(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.terms_accepted}
                  onChange={(e) => updateFormData('terms_accepted', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:underline" target="_blank">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">Privacy Policy</a>
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.contact_sharing_accepted}
                  onChange={(e) => updateFormData('contact_sharing_accepted', e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  I understand that sharing contact information (email, phone, social media) 
                  outside the platform is not allowed without Super Admin permission
                </span>
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notice</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>Your profile will be reviewed by our team</li>
                <li>Approval typically takes 1-2 business days</li>
                <li>You will be notified via email once approved</li>
                <li>Only approved developers can receive booking requests</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.phone && formData.country && formData.timezone;
      case 2:
        return formData.job_title && formData.skills.length >= 3 && formData.bio;
      case 3:
        return formData.hourly_rate > 0 && formData.weekly_hours > 0;
      case 4:
        return true; // Optional step
      case 5:
        return formData.terms_accepted && formData.contact_sharing_accepted;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          
          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
