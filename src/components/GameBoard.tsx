import React from 'react';
import { X, Circle } from 'lucide-react';
import { GameState } from '../types/contract';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (index: number) => void;
  disabled: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCellClick,
  disabled,
}) => {
  const renderCell = (index: number) => {
    const value = gameState.board[index];
    const isEmpty = !value;
    const isWinning = gameState.winner && checkWinningCell(index, gameState.board);

    return (
      <button
        key={index}
        onClick={() => onCellClick(index)}
        disabled={disabled || !isEmpty || gameState.isGameOver || gameState.currentPlayer !== gameState.playerSymbol}
        className={`
          w-20 h-20 border-2 border-gray-600 rounded-lg flex items-center justify-center
          transition-all duration-200 hover:border-cyan-400 hover:bg-gray-700
          ${isWinning ? 'bg-green-600 border-green-400' : 'bg-gray-800'}
          ${disabled || !isEmpty || gameState.isGameOver || gameState.currentPlayer !== gameState.playerSymbol ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isEmpty && !disabled && !gameState.isGameOver ? 'hover:scale-105' : ''}
        `}
      >
        {value === 'X' && <X className="w-8 h-8 text-cyan-400" />}
        {value === 'O' && <Circle className="w-8 h-8 text-red-400" />}
      </button>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-white mb-2">Tic-Tac-Toe</h3>
        {gameState.isGameOver ? (
          <div className="text-lg font-medium">
            {gameState.winner ? (
              <span className={gameState.winner === gameState.playerSymbol ? 'text-green-400' : 'text-red-400'}>
                {gameState.winner === gameState.playerSymbol ? 'You Win! 🎉' : 'AI Wins! 🤖'}
              </span>
            ) : (
              <span className="text-yellow-400">It's a Draw! 🤝</span>
            )}
          </div>
        ) : (
          <div className="text-lg font-medium text-gray-300">
            {gameState.currentPlayer === gameState.playerSymbol ? 'Your Turn' : 'AI Turn'}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {Array.from({ length: 9 }, (_, index) => renderCell(index))}
      </div>
    </div>
  );
};

const checkWinningCell = (index: number, board: (string | null)[]): boolean => {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
  ];

  return winningCombinations.some(([a, b, c]) => {
    const hasWinningCombo = board[a] && board[a] === board[b] && board[a] === board[c];
    return hasWinningCombo && (index === a || index === b || index === c);
  });
};