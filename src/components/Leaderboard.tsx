import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Coins, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface LeaderboardEntry {
  address: string;
  weekly_points: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  week_start: string;
}

interface LeaderboardProps {
  contract: any;
  userAccount?: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function for formatting wins/draws
const formatWinsDraws = (wins: number, draws: number) => {
  const winStr = `${wins} win${wins === 1 ? '' : 's'}`;
  if (draws > 0) {
    const drawStr = `${draws} draw${draws === 1 ? '' : 's'}`;
    return `${winStr}, ${drawStr}`;
  }
  return winStr;
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ contract, userAccount }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [prizePoolLoading, setPrizePoolLoading] = useState(false);
  const [prizePool, setPrizePool] = useState<string>('0');
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchPrizePool();
    
    // Set up real-time subscription for immediate updates
    const channel = supabase
      .channel('weekly_leaderboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weekly_leaderboard' },
        (payload) => {
          console.log('Weekly leaderboard change received!', payload);
          fetchLeaderboard(); // Re-fetch data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current week start (Monday 00:00 UTC)
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
      const currentWeekStart = new Date(now);
      currentWeekStart.setUTCDate(now.getUTCDate() - daysToMonday);
      currentWeekStart.setUTCHours(0, 0, 0, 0);
      const weekStartString = currentWeekStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .eq('week_start', weekStartString)
        .order('weekly_points', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard data.');
        setUserRank(null);
        setUserStats(null);
      } else {
        setLeaderboard(data || []);
        
        // Find user's rank and stats
        if (userAccount && data) {
          const userEntry = data.find(entry => 
            entry.address.toLowerCase() === userAccount.toLowerCase()
          );
          
          if (userEntry) {
            const rank = data.findIndex(entry => 
              entry.address.toLowerCase() === userAccount.toLowerCase()
            ) + 1;
            setUserRank(rank);
            setUserStats(userEntry);
          } else {
            // User not in top 10, fetch their actual rank
            fetchUserRank(userAccount, weekStartString);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching leaderboard:', err);
      setError('An unexpected error occurred.');
      setUserRank(null);
      setUserStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async (userAddress: string, weekStart: string) => {
    try {
      // Get user's stats
      const { data: userData } = await supabase
        .from('weekly_leaderboard')
        .select('*')
        .eq('address', userAddress)
        .eq('week_start', weekStart)
        .single();
      
      if (userData) {
        setUserStats(userData);
        
        // Count how many players have more points
        const { count } = await supabase
          .from('weekly_leaderboard')
          .select('*', { count: 'exact', head: true })
          .eq('week_start', weekStart)
          .gt('weekly_points', userData.weekly_points);
        
        setUserRank((count || 0) + 1);
      } else {
        setUserRank(null);
        setUserStats(null);
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
      setUserRank(null);
      setUserStats(null);
    }
  };
  const fetchPrizePool = async () => {
    if (!contract) return;
    
    try {
      setPrizePoolLoading(true);
      const balance = await contract.getContractBalance();
      const ethers = await import('ethers');
      const balanceInSTT = ethers.formatEther(balance);
      setPrizePool(parseFloat(balanceInSTT).toFixed(4));
    } catch (error) {
      console.error('Error fetching prize pool:', error);
      setPrizePool('0');
    } finally {
      setPrizePoolLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLeaderboard();
    fetchPrizePool();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <span className="text-gray-400 font-bold">{rank}</span>;
    }
  };

  const isCurrentUser = (address: string) => {
    return userAccount && address.toLowerCase() === userAccount.toLowerCase();
  };
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Prize Pool Loading */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        
        {/* Leaderboard Loading */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Prize Pool */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Coins className="w-5 h-5 text-yellow-500 mr-2" />
            Prize Pool
          </h3>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-400">{prizePool} STT</p>
            <p className="text-gray-400 text-sm mt-1">Total contract balance</p>
          </div>
        </div>
        
        {/* Leaderboard Error */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Weekly Leaderboard
          </h3>
          <div className="text-center">
            <p className="text-red-400 mb-2">Failed to load weekly leaderboard</p>
            <button
              onClick={handleRefresh}
              className="text-cyan-400 hover:text-cyan-300 text-sm underline flex items-center justify-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="space-y-6">
        {/* Prize Pool */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Coins className="w-5 h-5 text-yellow-500 mr-2" />
            Prize Pool
          </h3>
          <div className="text-center">
            {prizePoolLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-24 mx-auto"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-yellow-400">{prizePool} STT</p>
                <p className="text-gray-400 text-sm mt-1">Total contract balance</p>
              </>
            )}
          </div>
        </div>
        
        {/* Empty Leaderboard */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Weekly Leaderboard
          </h3>
          <div className="text-center">
            <p className="text-gray-400 mb-2">No weekly leaderboard data yet.</p>
            <p className="text-gray-500 text-sm">Play a game to get started!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prize Pool */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Coins className="w-5 h-5 text-yellow-500 mr-2" />
            Prize Pool
          </h3>
          <button
            onClick={fetchPrizePool}
            disabled={prizePoolLoading}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${prizePoolLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="text-center">
          {prizePoolLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-24 mx-auto"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-yellow-400">{prizePool} STT</p>
              <p className="text-gray-400 text-sm mt-1">Total contract balance</p>
            </>
          )}
        </div>
      </div>
      
      {/* Leaderboard */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Weekly Leaderboard
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.address}
             className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-600 transition-colors ${
               isCurrentUser(entry.address) 
                 ? 'bg-cyan-900 border border-cyan-700' 
                 : 'bg-gray-700'
             }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>
                <div>
                 <p className={`font-medium ${
                   isCurrentUser(entry.address) ? 'text-cyan-300' : 'text-white'
                 }`}>
                   {formatAddress(entry.address)}
                   {isCurrentUser(entry.address) && (
                     <span className="ml-2 text-xs bg-cyan-700 px-2 py-1 rounded">YOU</span>
                   )}
                 </p>
                 <p className="text-gray-400 text-sm">{formatWinsDraws(entry.wins, entry.draws)}</p>
                </div>
              </div>
              <div className="text-right">
               <p className={`font-bold ${
                 isCurrentUser(entry.address) ? 'text-cyan-300' : 'text-cyan-400'
               }`}>
                 {entry.weekly_points}
               </p>
                <p className="text-gray-400 text-sm">points</p>
              </div>
            </div>
          ))}
        </div>
        
       {/* User Rank Section */}
       {userAccount && (
         <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
           <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
             <Trophy className="w-4 h-4 text-cyan-400 mr-2" />
             Your Rank
           </h4>
           
           {userRank && userStats ? (
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 flex items-center justify-center">
                   {getRankIcon(userRank)}
                 </div>
                 <div>
                   <p className="text-cyan-300 font-medium">
                     #{userRank} - {formatAddress(userStats.address)}
                   </p>
                   <p className="text-gray-400 text-sm">{formatWinsDraws(userStats.wins, userStats.draws)}</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="text-cyan-300 font-bold">{userStats.weekly_points}</p>
                 <p className="text-gray-400 text-sm">points</p>
               </div>
             </div>
           ) : (
             <div className="text-center py-4">
               <p className="text-gray-400">No ranking data available</p>
               <p className="text-gray-500 text-sm">Play a game to get ranked!</p>
             </div>
           )}
         </div>
       )}
       
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>This week's top players • Resets Monday 00:00 UTC</p>
        </div>
      </div>
    </div>
  );
};