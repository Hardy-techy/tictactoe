import { useState, useEffect } from 'react';
import { SOMNIA_TESTNET_CONFIG } from '../config/contract';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWeb3 = () => {
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string>('');

  useEffect(() => {
    checkConnection();
    checkNetwork();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          setProvider(window.ethereum);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setIsCorrectNetwork(chainId === SOMNIA_TESTNET_CONFIG.chainId);
      } catch (error) {
        console.error('Error checking network:', error);
      }
    }
  };

  const connectWallet = async () => {
    setConnectionError('');
    
    if (!window.ethereum) {
      const errorMsg = 'Please install MetaMask to use this application';
      setConnectionError(errorMsg);
      alert(errorMsg);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setIsConnected(true);
      setProvider(window.ethereum);
      await switchToSomniaNetwork();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      let errorMessage = 'Failed to connect to MetaMask. ';
      
      if (error.code === 4001) {
        errorMessage += 'Connection was rejected by user.';
      } else if (error.code === -32002) {
        errorMessage += 'Connection request is already pending. Please check MetaMask.';
      } else if (error.message?.includes('MetaMask')) {
        errorMessage += 'Please ensure MetaMask is unlocked and try again.';
      } else {
        errorMessage += 'Please refresh the page and try again.';
      }
      
      setConnectionError(errorMessage);
      alert(errorMessage);
    }
  };

  const switchToSomniaNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_TESTNET_CONFIG.chainId }],
      });
      setIsCorrectNetwork(true);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_TESTNET_CONFIG],
          });
          setIsCorrectNetwork(true);
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', switchError);
      }
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setIsConnected(false);
    setProvider(null);
  };

  return {
    account,
    isConnected,
    isCorrectNetwork,
    provider,
    connectionError,
    connectWallet,
    disconnectWallet,
    switchToSomniaNetwork,
  };
};