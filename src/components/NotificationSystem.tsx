import { useEffect, useState, useCallback } from 'react';
import { X, Bell, Coffee, Brain, Target } from 'lucide-react';
import type { CognitiveState } from '../types';

interface Notification {
  id: string;
  type: 'fatigue' | 'focus' | 'confused' | 'system';
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationSystemProps {
  cognitiveState: CognitiveState;
  focusMode: boolean;
}

export function NotificationSystem({ cognitiveState, focusMode }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastState, setLastState] = useState<CognitiveState>('focus');
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    // Don't show notifications in focus mode (except critical ones)
    if (focusMode && notification.type !== 'fatigue') {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 5));

    // Auto-remove after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 8000);
  }, [focusMode]);

  useEffect(() => {
    // Detect state changes
    if (cognitiveState !== lastState) {
      if (cognitiveState === 'fatigue') {
        addNotification({
          type: 'fatigue',
          title: 'You seem tired! 😴',
          message: 'Consider taking a 5-minute break to recharge.'
        });
      } else if (cognitiveState === 'confused') {
        addNotification({
          type: 'confused',
          title: 'Need help? 🤔',
          message: 'Try breaking your task into smaller steps.'
        });
      } else if (cognitiveState === 'focus' && lastState !== 'focus') {
        addNotification({
          type: 'focus',
          title: 'In the zone! ⚡',
          message: 'Great focus! Keep up the momentum.'
        });
        setFocusStartTime(Date.now());
      }

      setLastState(cognitiveState);
    }
  }, [cognitiveState, lastState, addNotification]);

  useEffect(() => {
    // Check for prolonged focus sessions (45+ minutes)
    if (focusMode && focusStartTime && cognitiveState === 'focus') {
      const interval = setInterval(() => {
        const duration = Date.now() - focusStartTime;
        if (duration > 45 * 60 * 1000 && duration < 46 * 60 * 1000) {
          addNotification({
            type: 'system',
            title: 'Focus Session Duration',
            message: "You've been focused for 45 minutes. Consider taking a break soon."
          });
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [focusMode, focusStartTime, cognitiveState, addNotification]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`glass rounded-xl p-4 shadow-lg border-l-4 animate-slide-in flex items-start gap-3 ${
            notification.type === 'fatigue' ? 'border-red-500 bg-red-50/90' :
            notification.type === 'confused' ? 'border-yellow-500 bg-yellow-50/90' :
            notification.type === 'focus' ? 'border-green-500 bg-green-50/90' :
            'border-blue-500 bg-blue-50/90'
          }`}
        >
          <div className={`flex-shrink-0 ${
            notification.type === 'fatigue' ? 'text-red-600' :
            notification.type === 'confused' ? 'text-yellow-600' :
            notification.type === 'focus' ? 'text-green-600' :
            'text-blue-600'
          }`}>
            {notification.type === 'fatigue' && <Coffee className="w-5 h-5" />}
            {notification.type === 'confused' && <Brain className="w-5 h-5" />}
            {notification.type === 'focus' && <Target className="w-5 h-5" />}
            {notification.type === 'system' && <Bell className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
