import { useCalibration } from '../hooks/useBehaviorTracker';
import { Target } from 'lucide-react';
import type { BaselineMetrics } from '../types';

interface CalibrationProps {
  onComplete: (baseline: BaselineMetrics) => void;
}

export function Calibration({ onComplete }: CalibrationProps) {
  const { isActive, progress, text, targetText, metrics, startCalibration, handleInput } = useCalibration();

  if (metrics) {
    onComplete(metrics);
    return null;
  }

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-12 max-w-2xl w-full text-center shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Baseline Calibration
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Let's establish your normal typing patterns. This helps us detect when you're focused, confused, or tired.
          </p>
          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-sm font-medium">1</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Type the displayed text as accurately as possible</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-sm font-medium">2</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Type at your natural, comfortable pace</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary-600 text-sm font-medium">3</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Takes about 30-60 seconds to complete</p>
            </div>
          </div>
          <button
            onClick={startCalibration}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
          >
            Start Calibration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-3xl p-8 max-w-3xl w-full shadow-2xl animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Type the text below
        </h2>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-500 mb-6">{Math.round(progress)}% complete</p>

        {/* Target Text Display */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
          <p className="text-lg leading-relaxed font-mono">
            {targetText.split('').map((char, index) => {
              const isTyped = index < text.length;
              const isCorrect = text[index] === char;
              return (
                <span
                  key={index}
                  className={`${
                    isTyped
                      ? isCorrect
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {char}
                </span>
              );
            })}
          </p>
        </div>

        {/* Input Area */}
        <textarea
          value={text}
          onChange={(e) => handleInput(e.target.value)}
          className="w-full h-32 p-4 border-2 border-primary-200 dark:border-primary-800 rounded-xl resize-none focus:outline-none focus:border-primary-500 dark:bg-gray-800 dark:text-white text-lg font-mono"
          placeholder="Start typing here..."
          autoFocus
        />
      </div>
    </div>
  );
}
