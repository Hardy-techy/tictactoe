import React from 'react';
import { Play, Loader2, Coins } from 'lucide-react';

interface GameControlsProps {
  canPlay: boolean;
  hasPaid: boolean;
  gameInProgress: boolean;
  loading: boolean;
  onPayToPlay: () => void;
  onNewGame: () => void;
  gamesRemaining: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
  canPlay,
  hasPaid,
  gameInProgress,
  loading,
  onPayToPlay,
  onNewGame,
  gamesRemaining,
}) => {
  if (!canPlay) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Game Limit Reached</h3>
          <p className="text-gray-400 mb-4">
            You have played all 10 games. Thank you for playing!
          </p>
          <div className="bg-red-900 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">No more games available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-4">Game Controls</h3>
          
          {!hasPaid ? (
            <div>
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center mb-2">
                  <Coins className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white font-medium">0.02 STT per game</span>
                </div>
                <p className="text-blue-300 text-sm">
                  Payment required to start playing
                </p>
              </div>
              
              <button
                onClick={onPayToPlay}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5 mr-2" />
                    Pay 0.02 STT to Play
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-4">
                <p className="text-green-300">Payment confirmed! You can now play.</p>
              </div>
              
              {!gameInProgress ? (
                <button
                  onClick={onNewGame}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center w-full"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start New Game
                </button>
              ) : (
                <button
                  disabled={true}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium w-full cursor-not-allowed"
                >
                  Game in Progress
                </button>
              )}
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-400">
            <p>{gamesRemaining} games remaining today</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-start bg-white/20 border border-gray-700 p-4 backdrop-blur-sm" style={{ borderRadius: '0.25rem' }}>
        <svg className="w-5 h-5 text-gray-300 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-1m0-4a4 4 0 10-4-4 4 4 0 004 4zm0 0v1m0 4h.01" />
        </svg>
        <div className="text-sm text-gray-200 font-semibold">
          <span className="font-semibold">Tip:</span> The more games you play, the easier the AI becomes, and the more points you can earn!
        </div>
      </div>
    </>
  );
};