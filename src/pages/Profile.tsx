import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Target, 
  Award, 
  Settings, 
  LogOut, 
  ChevronRight,
  Bell,
  Moon,
  Shield,
  Trash2,
  Camera
} from 'lucide-react';
import type { BaselineMetrics } from '../types';

interface UserData {
  name: string;
  email: string;
  createdAt: string;
  baseline?: BaselineMetrics;
}

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'settings'>('overview');

  useEffect(() => {
    const stored = localStorage.getItem('cogniflow_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cogniflow_auth');
    localStorage.removeItem('cogniflow_user');
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure? This will delete all your data.')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-primary-600">Loading...</div>
      </div>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass rounded-3xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shadow-lg text-white text-3xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <p className="text-sm text-gray-400 flex items-center justify-center md:justify-start gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                Joined {joinDate}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <TabButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<User />}
            label="Overview"
          />
          <TabButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')}
            icon={<Target />}
            label="Statistics"
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings />}
            label="Settings"
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab user={user} />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'settings' && <SettingsTab onDelete={handleDeleteAccount} />}
      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
        active 
          ? 'bg-primary-600 text-white shadow-lg' 
          : 'bg-white text-gray-600 hover:bg-primary-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function OverviewTab({ user }: { user: UserData }) {
  const stats = [
    { icon: <Clock />, label: 'Session Time', value: '12h 34m' },
    { icon: <Target />, label: 'Focus Score', value: '87%' },
    { icon: <Award />, label: 'Productivity', value: 'A+' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="glass rounded-2xl p-6 text-center">
            <div className="text-primary-600 mb-2 flex justify-center">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Baseline Metrics</h3>
        {user.baseline ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-600">{Math.round(user.baseline.wpm)}</p>
              <p className="text-sm text-gray-600">WPM</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-600">{(user.baseline.errorRate * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Error Rate</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-600">{(user.baseline.avgPauseTime / 1000).toFixed(1)}s</p>
              <p className="text-sm text-gray-600">Avg Pause</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No baseline metrics recorded yet</p>
            <Link 
              to="/calibration" 
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Start Calibration
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <ActivityItem 
            icon={<Brain className="w-5 h-5" />}
            title="Focus Session"
            time="2 hours ago"
            duration="45 minutes"
          />
          <ActivityItem 
            icon={<Clock className="w-5 h-5" />}
            title="Break Taken"
            time="3 hours ago"
            duration="10 minutes"
          />
          <ActivityItem 
            icon={<Target className="w-5 h-5" />}
            title="Calibration Updated"
            time="1 day ago"
          />
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ 
  icon, 
  title, 
  time, 
  duration 
}: { 
  icon: React.ReactNode; 
  title: string; 
  time: string; 
  duration?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl">
      <div className="text-primary-600">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
      {duration && (
        <span className="text-sm text-primary-600 font-medium">{duration}</span>
      )}
    </div>
  );
}

function StatsTab() {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Statistics</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Focus Time</span>
            <span className="font-semibold text-gray-900">68%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '68%' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Confusion Incidents</span>
            <span className="font-semibold text-gray-900">12%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '12%' }} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Fatigue Detection</span>
            <span className="font-semibold text-gray-900">20%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }} />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Weekly Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">24h</p>
            <p className="text-sm text-gray-500">Total Focus Time</p>
          </div>
          <div className="bg-white/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">15</p>
            <p className="text-sm text-gray-500">Breaks Taken</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
        <div className="space-y-4">
          <ToggleItem 
            icon={<Bell className="w-5 h-5" />}
            title="Push Notifications"
            description="Get notified about your cognitive state changes"
            defaultChecked={true}
          />
          <ToggleItem 
            icon={<Moon className="w-5 h-5" />}
            title="Focus Mode"
            description="Pause notifications when you're focused"
            defaultChecked={true}
          />
          <ToggleItem 
            icon={<Camera className="w-5 h-5" />}
            title="Eye Detection"
            description="Enable webcam for fatigue detection"
            defaultChecked={false}
          />
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Security</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-gray-900">Change Password</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white transition-colors">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-600">Delete Account</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <button
        onClick={onDelete}
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <Trash2 className="w-5 h-5" />
        Delete Account & All Data
      </button>
    </div>
  );
}

function ToggleItem({ 
  icon, 
  title, 
  description, 
  defaultChecked 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-primary-600">{icon}</span>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
