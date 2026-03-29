import { useEffect, useState } from 'react';
import { X, Shield, Volume2 } from 'lucide-react';

interface FocusModeBlockerProps {
  enabled: boolean;
}

export function FocusModeBlocker({ enabled }: FocusModeBlockerProps) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (enabled) {
      setShowBanner(true);
      // Show banner for 5 seconds then minimize
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Focus Mode Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-green-500 text-white px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <div>
                <p className="font-semibold">Focus Mode Active</p>
                <p className="text-sm opacity-90">Notifications paused while you're in the zone</p>
              </div>
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Minimal Focus Indicator */}
      {!showBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-green-500/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Focus Mode</span>
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
        </div>
      )}

      {/* Simulated Notification Block Overlay */}
      <div className="fixed bottom-4 right-4 z-30 bg-green-50 border border-green-200 rounded-xl p-3 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 text-green-700">
          <Volume2 className="w-4 h-4" />
          <span className="text-sm font-medium">Notifications Paused</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          External notifications are being blocked while you're focused
        </p>
      </div>
    </>
  );
}
