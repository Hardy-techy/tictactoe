import React, { useState, useEffect } from 'react';
import { Grid3X3, AlertCircle, Trophy, Hash } from 'lucide-react';
import { WalletConnection } from './components/WalletConnection';
import { PlayerStats } from './components/PlayerStats';
import { GameBoard } from './components/GameBoard';
import { GameControls } from './components/GameControls';
import { useWeb3 } from './hooks/useWeb3';
import { useContract } from './hooks/useContract';
import { 
  createInitialGameState, 
  makePlayerMove, 
  makeAIMove, 
  getGameOutcome 
} from './utils/gameLogic';
import { GameState } from './types/contract';
import { CONTRACT_ADDRESS } from './config/contract';
import { GameResultNotification } from './components/GameResultNotification';

type Page = 'game' | 'leaderboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('game');
  const {
    account,
    isConnected,
    isCorrectNetwork,
    provider,
    connectionError,
    connectWallet,
    disconnectWallet,
    switchToSomniaNetwork,
  } = useWeb3();

  const {
    contract,
    playerStats,
    loading,
    error,
    payToPlay,
    recordResult,
    canPlay,
    hasPaid,
    fetchPlayerStats,
  } = useContract(provider, account);

  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [gameInProgress, setGameInProgress] = useState(false);
  const [playerCanPlay, setPlayerCanPlay] = useState(false);
  const [playerHasPaid, setPlayerHasPaid] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationResult, setNotificationResult] = useState<'win' | 'draw' | 'loss' | null>(null);
  const [notificationPoints, setNotificationPoints] = useState('');

  // Lazy load leaderboard component
  const [LeaderboardComponent, setLeaderboardComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    if (currentPage === 'leaderboard') {
      import('./components/Leaderboard').then(module => {
        setLeaderboardComponent(() => module.Leaderboard);
      });
    }
  }, [currentPage]);

  // Check player status when contract or account changes
  useEffect(() => {
    checkPlayerStatus();
  }, [contract, account]);

  // Handle AI moves
  useEffect(() => {
    if (gameInProgress && gameState.currentPlayer === gameState.aiSymbol && !gameState.isGameOver) {
      const timer = setTimeout(() => {
        setGameState(prevState => makeAIMove(prevState));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.aiSymbol, gameInProgress, gameState.isGameOver]);

  // Handle game end
  useEffect(() => {
    if (gameInProgress && gameState.isGameOver) {
      handleGameEnd();
    }
  }, [gameState.isGameOver, gameInProgress]);

  const checkPlayerStatus = async () => {
    if (!contract || !account) return;

    try {
      const [canPlayResult, hasPaidResult] = await Promise.all([
        canPlay(),
        hasPaid(),
      ]);
      setPlayerCanPlay(canPlayResult);
      setPlayerHasPaid(hasPaidResult);
    } catch (error) {
      console.error('Error checking player status:', error);
    }
  };

  const handlePayToPlay = async () => {
    try {
      await payToPlay();
      await checkPlayerStatus();
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handleNewGame = () => {
    if (!playerHasPaid) {
      alert('Please pay to play first');
      return;
    }
    
    const newGameState = createInitialGameState();
    console.log('Starting new game. Player:', newGameState.playerSymbol, 'AI:', newGameState.aiSymbol, 'First player:', newGameState.currentPlayer);
    setGameState(newGameState);
    setGameInProgress(true);
  };

  const handleCellClick = (index: number) => {
    if (!gameInProgress || gameState.currentPlayer !== gameState.playerSymbol) return;
    
    const newGameState = makePlayerMove(gameState, index);
    setGameState(newGameState);
  };

  const handleGameEnd = async () => {
    if (!contract || submittingResult) return;

    try {
      setSubmittingResult(true);
      const outcome = getGameOutcome(gameState);
      
      console.log('Recording game result:', outcome);
      const result = await recordResult(outcome);
      
      setGameInProgress(false);
      setPlayerHasPaid(false);
      
      // Show result message
      let pointsMessage = '';
      if (outcome === 'win') {
        pointsMessage = 'Weekly points earned: +30';
      } else if (outcome === 'draw') {
        pointsMessage = 'Weekly points earned: +15';
      } else {
        pointsMessage = 'Weekly points deducted: -5';
      }
      
      // alert(`Game over! You ${outcome}! ${pointsMessage}`);
      setNotificationResult(outcome);
      setNotificationPoints(pointsMessage);
      setNotificationOpen(true);
      
    } catch (error) {
      console.error('Error recording result:', error);
      // alert('Error recording game result. Please try again.');
      setNotificationResult('loss');
      setNotificationPoints('Error recording game result. Please try again.');
      setNotificationOpen(true);
    } finally {
      setSubmittingResult(false);
    }
  };

  // Check if contract is deployed
  const isContractDeployed = CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';

  if (!isContractDeployed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-4">Contract Not Deployed</h1>
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-yellow-300 mb-4">
                The smart contract needs to be deployed to the Somnia Testnet before you can play.
              </p>
              <div className="text-left space-y-2 text-sm text-yellow-200">
                <p><strong>Deployment Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Open Remix IDE at <a href="https://remix.ethereum.org" className="text-cyan-400 underline" target="_blank" rel="noopener noreferrer">remix.ethereum.org</a></li>
                  <li>Create a new file and copy the TicTacToeGame.sol contract</li>
                  <li>Compile the contract</li>
                  <li>Connect to Somnia Testnet using MetaMask</li>
                  <li>Deploy the contract</li>
                  <li>Update the CONTRACT_ADDRESS in src/config/contract.ts</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Bar with Wallet Connection */}
        {isConnected && isCorrectNetwork && (
          <div className="flex justify-between items-center mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-4">
              <img src="https://img.icons8.com/external-tal-revivo-tritone-tal-revivo/32/external-tic-tak-toe-cross-and-circle-matrix-game-with-work-strategy-concept-business-tritone-tal-revivo.png" alt="TicTacToe Logo" className="w-10 h-10" />
              <h1 className="text-xl font-bold text-white">TicTacToe vs AI</h1>
            </div>
            
            {/* Wallet Connection Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-300">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-600 hover:border-gray-500 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          {(!isConnected || !isCorrectNetwork) && (
            <div className="flex items-center justify-center mb-4">
              <img src="https://img.icons8.com/external-tal-revivo-tritone-tal-revivo/32/external-tic-tak-toe-cross-and-circle-matrix-game-with-work-strategy-concept-business-tritone-tal-revivo.png" alt="TicTacToe Logo" className="w-12 h-12 mr-3" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">TicTacToe vs AI</h1>
            </div>
          )}
          
          {/* Navigation - Only show when connected */}
          {isConnected && isCorrectNetwork && (
            <div className="flex justify-center space-x-2 sm:space-x-4 mb-4">
              <button
                onClick={() => setCurrentPage('game')}
                className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  currentPage === 'game'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Game
              </button>
              <button
                onClick={() => setCurrentPage('leaderboard')}
                className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  currentPage === 'leaderboard'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-1 sm:mr-2" />
                Leaderboard
              </button>
            </div>
          )}
          
          
          {(!isConnected || !isCorrectNetwork) && (
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg px-4">
              Play Tic-Tac-Toe on Somnia Testnet • Earn points and climb the leaderboard
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6 mx-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Main Content */}


        {!isConnected || !isCorrectNetwork ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <WalletConnection
              account={account}
              isConnected={isConnected}
              isCorrectNetwork={isCorrectNetwork}
              connectionError={connectionError}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              onSwitchNetwork={switchToSomniaNetwork}
            />
          </div>
        ) : currentPage === 'game' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <PlayerStats stats={playerStats} loading={loading} />
            </div>

            {/* Center Column */}
            <div className="space-y-6">
              <GameBoard
                gameState={gameState}
                onCellClick={handleCellClick}
                disabled={!gameInProgress || submittingResult}
              />
              
              {submittingResult && (
                <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 text-center">
                  <p className="text-blue-300">Recording game result...</p>
                </div>
              )}
            </div>

            {/* Right Column - Game Controls */}
            <div>
              <GameControls
                canPlay={playerCanPlay}
                hasPaid={playerHasPaid}
                gameInProgress={gameInProgress}
                loading={loading || submittingResult}
                onPayToPlay={handlePayToPlay}
                onNewGame={handleNewGame}
                gamesRemaining={playerStats?.dailyGamesRemaining || 0}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {contract && LeaderboardComponent ? (
              <LeaderboardComponent contract={contract} userAccount={account} />
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
                <p className="text-gray-400">
                  Loading leaderboard...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="w-full mt-16 text-center text-gray-400 text-xs sm:text-sm px-4">
          Built on Somnia Testnet • Smart Contract Powered • Decentralized Gaming
        </div>
      </div>
      <GameResultNotification
        open={notificationOpen && !!notificationResult}
        onClose={() => setNotificationOpen(false)}
        result={notificationResult || 'draw'}
        pointsMessage={notificationPoints}
      />
    </div>
  );
}

export default App;