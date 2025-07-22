import React from 'react';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';

interface WalletConnectionProps {
  account: string;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connectionError: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  account,
  isConnected,
  isCorrectNetwork,
  connectionError,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 w-full max-w-md mx-auto">
        <div className="text-center">
          <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-sm sm:text-base text-gray-400 mb-4 px-2">
            Connect your wallet to start playing Tic-Tac-Toe on Somnia Testnet
          </p>
          
          {connectionError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              <p>{connectionError}</p>
              <p className="text-xs mt-1">
                Try: Unlock your wallet → Refresh page → Connect again
              </p>
            </div>
          )}
          
          <button
            onClick={onConnect}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm sm:text-base text-white font-medium">Wallet Connected</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-xs sm:text-sm">Address</label>
          <p className="text-sm sm:text-base text-white font-mono break-all">{formatAddress(account)}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isCorrectNetwork ? (
            <>
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              <span className="text-green-500 text-xs sm:text-sm">Somnia Testnet</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              <span className="text-yellow-500 text-xs sm:text-sm">Wrong Network</span>
              <button
                onClick={onSwitchNetwork}
                className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm underline"
              >
                Switch to Somnia
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};