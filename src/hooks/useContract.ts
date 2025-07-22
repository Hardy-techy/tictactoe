import { useState, useEffect } from 'react';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contract';
import { PlayerStats } from '../types/contract';

export const useContract = (provider: any, account: string) => {
  const [contract, setContract] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (provider && account) {
      initContract();
    }
  }, [provider, account]);

  useEffect(() => {
    if (contract && account) {
      fetchPlayerStats();
    }
  }, [contract, account]);

  const initContract = async () => {
    try {
      // Import ethers dynamically
      const ethers = await import('ethers');
      const web3Provider = new ethers.BrowserProvider(provider);
      const signer = await web3Provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError('Failed to initialize contract');
    }
  };

  const fetchPlayerStats = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      const stats = await contract.getPlayerStats(account);
      setPlayerStats({
        totalGamesPlayed: Number(stats[0]),
        weeklyPoints: Number(stats[1]),
        dailyGamesRemaining: Number(stats[2]),
        wins: Number(stats[3]),
        draws: Number(stats[4]),
        losses: Number(stats[5]),
        todayGamesPlayed: Number(stats[6]),
      });
    } catch (err) {
      console.error('Error fetching player stats:', err);
      setError('Failed to fetch player stats');
    } finally {
      setLoading(false);
    }
  };

  const payToPlay = async () => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setLoading(true);
      const ethers = await import('ethers');
      const tx = await contract.payToPlay({
        value: ethers.parseEther('0.02'),
      });
      await tx.wait();
      await fetchPlayerStats();
      return tx;
    } catch (err) {
      console.error('Error paying to play:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const recordResult = async (outcome: 'win' | 'draw' | 'loss') => {
    if (!contract) throw new Error('Contract not initialized');

    try {
      setLoading(true);
      const tx = await contract.recordResult(outcome);
      const receipt = await tx.wait();
      console.log('Transaction Receipt:', receipt);
      
      // Parse the GameEnded event to get actual points earned/lost
      const gameEndedEvent = receipt.logs.find((log: any) => {
        try {
          const ethers = require('ethers');
          const iface = new ethers.Interface(CONTRACT_ABI);
          const parsed = iface.parseLog(log);
          return parsed.name === 'GameEnded';
        } catch {
          return false;
        }
      });
      
      if (gameEndedEvent) {
        const ethers = await import('ethers');
        const iface = new ethers.Interface(CONTRACT_ABI);
        const parsed = iface.parseLog(gameEndedEvent);
        
        const result = parsed.args.result;
        const pointsFromEvent = Number(parsed.args.points);
        const totalPoints = Number(parsed.args.totalPoints);
        
        console.log('Game ended event:', {
          result,
          points: pointsFromEvent,
          totalPoints
        });
      }
      
      // Update Supabase leaderboard via edge function
      try {
        const stats = await contract.getPlayerStats(account);
        const weeklyPoints = Number(stats[1]);
        
        // Calculate actual points change for display
        let pointsChange = 0;
        if (outcome === 'win') pointsChange = 10;
        else if (outcome === 'draw') pointsChange = 3;
        else if (outcome === 'loss') pointsChange = -5;
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-leaderboard`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player: account,
            result: outcome,
            points: pointsChange,
            weeklyPoints: weeklyPoints,
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to update leaderboard:', await response.text());
        } else {
          console.log('Leaderboard updated successfully');
        }
      } catch (leaderboardError) {
        console.error('Error updating leaderboard:', leaderboardError);
        // Don't throw here - game result was recorded successfully
      }
      
      await fetchPlayerStats();
      return { tx, pointsChange: outcome === 'win' ? 10 : outcome === 'draw' ? 3 : -5 };
    } catch (err) {
      console.error('Error recording result:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const canPlay = async () => {
    if (!contract || !account) return false;

    try {
      return await contract.canPlay(account);
    } catch (err) {
      console.error('Error checking if can play:', err);
      return false;
    }
  };

  const hasPaid = async () => {
    if (!contract || !account) return false;

    try {
      return await contract.hasPaid(account);
    } catch (err) {
      console.error('Error checking payment status:', err);
      return false;
    }
  };

  return {
    contract,
    playerStats,
    loading,
    error,
    payToPlay,
    recordResult,
    canPlay,
    hasPaid,
    fetchPlayerStats,
  };
};