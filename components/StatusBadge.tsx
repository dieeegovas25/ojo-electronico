import React from 'react';
import { AppState } from '../types';

interface StatusBadgeProps {
  status: AppState;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case AppState.IDLE:
        return { text: 'LISTO', color: 'bg-gray-600', icon: '⏸' };
      case AppState.ANALYZING:
        return { text: 'PROCESANDO...', color: 'bg-blue-600 animate-pulse', icon: '🧠' };
      case AppState.SPEAKING:
        return { text: 'HABLANDO...', color: 'bg-green-600', icon: '🔊' };
      case AppState.ERROR:
        return { text: 'ERROR', color: 'bg-red-600', icon: '⚠️' };
      default:
        return { text: 'ESPERANDO...', color: 'bg-gray-500', icon: '?' };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl ${config.color} text-white font-bold text-xl shadow-lg transition-all duration-300 w-full border-2 border-white/20`}
      role="status"
      aria-live="polite"
    >
      <span className="text-3xl" aria-hidden="true">{config.icon}</span>
      <span className="tracking-wide">{config.text}</span>
    </div>
  );
};

export default StatusBadge;