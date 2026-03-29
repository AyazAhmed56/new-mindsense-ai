import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Clock,
  Target,
  Brain,
  Coffee,
  TrendingUp,
  Award
} from 'lucide-react';
import type { SessionData, CognitiveState } from '../types';

interface DashboardProps {
  behaviorTracker: {
    typingMetrics: {
      wpm: number;
      errorRate: number;
      pauseTime: number;
    };
    sessionData: SessionData;
    getCognitiveState: () => CognitiveState;
  };
}

const COLORS = {
  focus: '#10B981',
  confused: '#F59E0B',
  fatigue: '#EF4444'
};

export function Dashboard({ behaviorTracker }: DashboardProps) {
  const { typingMetrics, sessionData, getCognitiveState } = behaviorTracker;
  const currentState = getCognitiveState();
  const [_, setStateHistory] = useState<{ time: string; state: CognitiveState }[]>([]);
  const [wpmHistory, setWpmHistory] = useState<{ time: string; wpm: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      setStateHistory(prev => {
        const newHistory = [...prev, { time: timeStr, state: currentState }].slice(-20);
        return newHistory;
      });

      setWpmHistory(prev => {
        const newHistory = [...prev, { time: timeStr, wpm: typingMetrics.wpm }].slice(-20);
        return newHistory;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentState, typingMetrics.wpm]);

  const sessionDuration = Math.floor((Date.now() - sessionData.startTime) / 60000);
  const focusPercentage = sessionData.focusTime > 0
    ? Math.round((sessionData.focusTime / (sessionData.focusTime + sessionData.fatigueCount + sessionData.confusionCount)) * 100)
    : 0;
  const productivityScore = Math.round(
    (focusPercentage * 0.7) +
    (Math.min(typingMetrics.wpm / 40, 1) * 30)
  );

  const stateDistribution = [
    { name: 'Focused', value: sessionData.focusTime, color: COLORS.focus },
    { name: 'Confused', value: sessionData.confusionCount, color: COLORS.confused },
    { name: 'Fatigued', value: sessionData.fatigueCount, color: COLORS.fatigue }
  ].filter(item => item.value > 0);

  return (
    <div className="h-full overflow-y-auto p-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Productivity Dashboard
      </h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Clock />}
          label="Session Time"
          value={`${sessionDuration} min`}
          color="blue"
        />
        <StatCard
          icon={<Target />}
          label="Focus Time"
          value={`${focusPercentage}%`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Current WPM"
          value={Math.round(typingMetrics.wpm).toString()}
          color="purple"
        />
        <StatCard
          icon={<Award />}
          label="Productivity Score"
          value={productivityScore.toString()}
          color="yellow"
          highlight
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* WPM Trend */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Typing Speed Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wpmHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ fill: '#DC2626', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary-600" />
            Cognitive State Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stateDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Current Status & Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Status
          </h3>
          <div className="space-y-4">
            <StatusRow
              icon={<Target />}
              label="State"
              value={currentState.charAt(0).toUpperCase() + currentState.slice(1)}
              color={COLORS[currentState]}
            />
            <StatusRow
              icon={<Coffee />}
              label="Pause Time"
              value={`${(typingMetrics.pauseTime / 1000).toFixed(1)}s avg`}
              color="#6B7280"
            />
            <StatusRow
              icon={<Brain />}
              label="Error Rate"
              value={`${(typingMetrics.errorRate * 100).toFixed(1)}%`}
              color={typingMetrics.errorRate > 0.1 ? '#EF4444' : '#10B981'}
            />
          </div>
        </div>

        {/* Smart Suggestions */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💡 Smart Suggestions
          </h3>
          <div className="space-y-3">
            {currentState === 'fatigue' && (
              <>
                <Suggestion text="Take a 5-minute break" type="urgent" />
                <Suggestion text="Consider switching to a simpler task" type="warning" />
                <Suggestion text="Stay hydrated - grab some water" type="info" />
              </>
            )}
            {currentState === 'confused' && (
              <>
                <Suggestion text="Review documentation or examples" type="info" />
                <Suggestion text="Break the problem into smaller parts" type="info" />
                <Suggestion text="Consider asking for help" type="warning" />
              </>
            )}
            {currentState === 'focus' && (
              <>
                <Suggestion text="Great focus! Keep up the momentum" type="success" />
                <Suggestion text="You're in the zone - perfect for complex tasks" type="info" />
                <Suggestion text="Remember to take breaks every 90 minutes" type="info" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20'
  };

  return (
    <div className={`glass rounded-2xl p-6 ${highlight ? 'ring-2 ring-primary-500' : ''}`}>
      <div className={`w-12 h-12 rounded-xl ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${highlight ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-gray-500">{icon}</span>
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
      </div>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

function Suggestion({ text, type }: { text: string; type: 'urgent' | 'warning' | 'info' | 'success' }) {
  const styles = {
    urgent: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200'
  };

  return (
    <div className={`p-3 rounded-xl border ${styles[type]} animate-fade-in`}>
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
