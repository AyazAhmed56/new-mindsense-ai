import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, User, Phone, ChevronRight, ArrowLeft } from 'lucide-react';

interface UserProfile {
  name: string;
  gender: string;
  phone: string;
  email: string;
  isProfileComplete: boolean;
}

export function ProfileSetup() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    gender: '',
    phone: '',
    email: '',
    isProfileComplete: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Get email from auth storage
    const storedUser = localStorage.getItem('cogniflow_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfile(prev => ({
        ...prev,
        email: user.email || '',
        name: user.name || ''
      }));
    }

    // Check if profile already exists
    const existingProfile = localStorage.getItem('cogniflow_profile');
    if (existingProfile) {
      const parsed = JSON.parse(existingProfile);
      if (parsed.isProfileComplete) {
        navigate('/baseline-collection');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const updatedProfile = {
      ...profile,
      isProfileComplete: true
    };

    localStorage.setItem('cogniflow_profile', JSON.stringify(updatedProfile));
    
    // Update user data
    const userData = JSON.parse(localStorage.getItem('cogniflow_user') || '{}');
    userData.name = profile.name;
    userData.profileComplete = true;
    localStorage.setItem('cogniflow_user', JSON.stringify(userData));

    setIsSaving(false);
    
    // Navigate to extended baseline collection
    navigate('/baseline-collection');
  };

  const isFormValid = profile.name && profile.gender && profile.phone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Profile
          </h1>
          <p className="text-gray-500 mt-1">
            Tell us a bit about yourself
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-sm font-medium text-primary-600">Profile</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm text-gray-500">Baseline</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-sm text-gray-500">App</span>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-primary-100 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Gender *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: 'male' })}
                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  profile.gender === 'male'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-primary-100 bg-white text-gray-700 hover:border-primary-300'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: 'female' })}
                className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                  profile.gender === 'female'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-primary-100 bg-white text-gray-700 hover:border-primary-300'
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-primary-100 rounded-xl focus:outline-none focus:border-primary-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email (Auto-fetched)
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-primary-100 rounded-xl text-gray-600 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Email is automatically fetched from your account
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-4">
            <Link
              to="/login"
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary-200 rounded-xl font-semibold text-gray-600 hover:bg-primary-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="flex-[2] bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Continue to Baseline
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
