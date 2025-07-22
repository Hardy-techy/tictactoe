import React from 'react';
import { Trophy, Target, Clock, Award } from 'lucide-react';
import { PlayerStats as PlayerStatsType } from '../types/contract';

interface PlayerStatsProps {
  stats: PlayerStatsType | null;
  loading: boolean;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400 text-center">No stats available</p>
      </div>
    );
  }

  const winRate = stats.totalGamesPlayed > 0 ? (stats.wins / stats.totalGamesPlayed * 100).toFixed(1) : '0';

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
        Player Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-cyan-400 mr-1" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.weeklyPoints}</p>
          <p className="text-gray-400 text-sm">Weekly Points</p>
        </div>
        
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 text-green-400 mr-1" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.dailyGamesRemaining}</p>
          <p className="text-gray-400 text-sm">Games Left Today</p>
        </div>
        
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <Award className="w-4 h-4 text-purple-400 mr-1" />
          </div>
          <p className="text-2xl font-bold text-white">{winRate}%</p>
          <p className="text-gray-400 text-sm">Win Rate</p>
        </div>
        
        <div className="text-center p-3 bg-gray-700 rounded-lg">
          <p className="text-2xl font-bold text-white">{stats.todayGamesPlayed}</p>
          <p className="text-gray-400 text-sm">Played Today</p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
        <div className="text-center mb-2">
          <p className="text-white font-medium">Total Games: {stats.totalGamesPlayed}</p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-green-400">Wins: {stats.wins}</span>
          <span className="text-yellow-400">Draws: {stats.draws}</span>
          <span className="text-red-400">Losses: {stats.losses}</span>
        </div>
      </div>
    </div>
  );
};