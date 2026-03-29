import { Brain, Target, Coffee } from 'lucide-react';
import type { CognitiveState } from '../types';

interface CognitiveStateIndicatorProps {
  state: CognitiveState;
  confidence?: number;
}

const stateConfig = {
  focus: {
    icon: Target,
    label: 'Focused',
    color: 'bg-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300'
  },
  confused: {
    icon: Brain,
    label: 'Confused',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  fatigue: {
    icon: Coffee,
    label: 'Fatigued',
    color: 'bg-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300'
  }
};

export function CognitiveStateIndicator({ state, confidence }: CognitiveStateIndicatorProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} rounded-xl p-3 flex flex-col items-center gap-1 animate-fade-in`}>
      <div className={`w-3 h-3 rounded-full ${config.color} animate-pulse`} />
      <Icon className={`w-5 h-5 ${config.textColor}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
      {confidence !== undefined && (
        <span className="text-[10px] text-gray-500">
          {Math.round(confidence * 100)}% conf
        </span>
      )}
    </div>
  );
}
