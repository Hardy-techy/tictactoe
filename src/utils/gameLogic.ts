import { GameState } from '../types/contract';

let gameCount = 0;

export const createInitialGameState = (playerSymbol?: 'X' | 'O'): GameState => {
  // Alternate between X and O every 5 games
  let symbol: 'X' | 'O';
  if (playerSymbol) {
    symbol = playerSymbol;
  } else {
    const cyclePosition = gameCount % 10;
    symbol = cyclePosition < 5 ? 'X' : 'O';
  }
  
  gameCount++;
  
  const aiSymbol = symbol === 'X' ? 'O' : 'X';
  // X always goes first in tic-tac-toe
  const currentPlayer = 'X';
  
  console.log('Creating game state:', { playerSymbol: symbol, aiSymbol, currentPlayer, gameCount });
  
  return {
    board: Array(9).fill(null),
    currentPlayer,
    playerSymbol: symbol,
    aiSymbol,
    winner: null,
    isDraw: false,
    isGameOver: false,
  };
};

export const checkWinner = (board: (string | null)[]): string | null => {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6], // Diagonals
  ];

  for (const [a, b, c] of winningCombinations) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
};

export const checkDraw = (board: (string | null)[]): boolean => {
  return board.every(cell => cell !== null) && !checkWinner(board);
};

export const makePlayerMove = (
  gameState: GameState,
  index: number
): GameState => {
  if (gameState.board[index] || gameState.isGameOver) {
    return gameState;
  }

  const newBoard = [...gameState.board];
  newBoard[index] = gameState.playerSymbol;

  const winner = checkWinner(newBoard);
  const isDraw = checkDraw(newBoard);

  return {
    ...gameState,
    board: newBoard,
    currentPlayer: gameState.aiSymbol,
    winner,
    isDraw,
    isGameOver: winner !== null || isDraw,
  };
};

export const makeAIMove = (gameState: GameState, playerScore: number = 0): GameState => {
  if (gameState.isGameOver || gameState.currentPlayer !== gameState.aiSymbol) {
    return gameState;
  }

  console.log('AI making move. AI symbol:', gameState.aiSymbol, 'Current player:', gameState.currentPlayer, 'Player score:', playerScore);

  const bestMove = findBestMove(gameState.board, gameState.aiSymbol, gameState.playerSymbol, playerScore);
  
  if (bestMove === -1) {
    console.log('No moves available for AI');
    return gameState; // No moves available
  }

  console.log('AI choosing position:', bestMove);

  const newBoard = [...gameState.board];
  newBoard[bestMove] = gameState.aiSymbol;

  const winner = checkWinner(newBoard);
  const isDraw = checkDraw(newBoard);

  return {
    ...gameState,
    board: newBoard,
    currentPlayer: gameState.playerSymbol,
    winner,
    isDraw,
    isGameOver: winner !== null || isDraw,
  };
};

const findBestMove = (
  board: (string | null)[],
  aiSymbol: 'X' | 'O',
  playerSymbol: 'X' | 'O',
  playerScore: number = 0
): number => {
  // Set faulty move chance based on playerScore
  let faultyChance = 0;
  if (playerScore > 100) faultyChance = 0.4;
  else if (playerScore >= 50) faultyChance = 0.2;
  // else 0

  const shouldMakeWeakMove = Math.random() < faultyChance;
  
  if (shouldMakeWeakMove) {
    // Make a random move instead of optimal to simulate AI making mistakes
    const availableSpots = board
      .map((spot, index) => (spot === null ? index : null))
      .filter(spot => spot !== null) as number[];
    if (availableSpots.length > 0) {
      return availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }
  }

  // Try to win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = aiSymbol;
      if (checkWinner(board) === aiSymbol) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // Try to block player's win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = playerSymbol;
      if (checkWinner(board) === playerSymbol) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // Take center if available
  if (!board[4]) {
    return 4;
  }

  // Take corners
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(i => !board[i]);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }

  // Take any available spot
  const availableSpots = board
    .map((spot, index) => (spot === null ? index : null))
    .filter(spot => spot !== null) as number[];

  return availableSpots.length > 0 
    ? availableSpots[Math.floor(Math.random() * availableSpots.length)]
    : -1;
};

export const getGameOutcome = (gameState: GameState): 'win' | 'draw' | 'loss' => {
  if (gameState.winner === gameState.playerSymbol) return 'win';
  if (gameState.isDraw) return 'draw';
  return 'loss';
};