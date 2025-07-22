import React, { useEffect, useRef } from 'react';

interface GameResultNotificationProps {
  open: boolean;
  onClose: () => void;
  result: 'win' | 'draw' | 'loss';
  pointsMessage: string;
}

const getResultStyles = (result: 'win' | 'draw' | 'loss') => {
  switch (result) {
    case 'win':
      return 'border-green-400 bg-gradient-to-br from-green-800/90 to-gray-900/90';
    case 'draw':
      return 'border-yellow-400 bg-gradient-to-br from-yellow-800/90 to-gray-900/90';
    case 'loss':
      return 'border-red-400 bg-gradient-to-br from-red-800/90 to-gray-900/90';
    default:
      return 'border-gray-600 bg-gray-800/90';
  }
};

export const GameResultNotification: React.FC<GameResultNotificationProps> = ({ open, onClose, result, pointsMessage }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  // Fade in/out animation
  useEffect(() => {
    if (ref.current) {
      if (open) {
        ref.current.style.opacity = '1';
        ref.current.style.transform = 'translateY(0)';
      } else {
        ref.current.style.opacity = '0';
        ref.current.style.transform = 'translateY(-20px)';
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`fixed top-8 right-8 z-50 min-w-[260px] max-w-xs transition-all duration-300 ease-in-out opacity-0 pointer-events-auto`}
      style={{ boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)', borderRadius: '0.75rem' }}
    >
      <div
        className={`border-l-4 p-4 pr-6 flex flex-col gap-1 ${getResultStyles(result)} text-white shadow-lg rounded-lg relative`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-sm p-1 rounded transition"
          aria-label="Close notification"
          tabIndex={0}
        >
          ×
        </button>
        <div className="text-base font-semibold capitalize tracking-wide">
          Game over! You {result}!
        </div>
        <div className="text-sm opacity-90">{pointsMessage}</div>
      </div>
    </div>
  );
}; 