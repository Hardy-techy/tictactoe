export interface PlayerStats {
  totalGamesPlayed: number;
  weeklyPoints: number;
  dailyGamesRemaining: number;
  wins: number;
  draws: number;
  losses: number;
  todayGamesPlayed: number;
}

export interface GameState {
  board: (string | null)[];
  currentPlayer: 'X' | 'O';
  playerSymbol: 'X' | 'O';
  aiSymbol: 'X' | 'O';
  winner: string | null;
  isDraw: boolean;
  isGameOver: boolean;
}

export interface ContractConfig {
  address: string;
  abi: any[];
}