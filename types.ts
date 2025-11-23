export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
}

export type TransactionStatus = 'open' | 'win' | 'loss' | 'breakeven';

export interface Transaction {
  id: string;
  date: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal';
  symbol: string; // e.g., AAPL, 2330.TW, or "CASH" for funds
  price: number;
  quantity: number;
  strategy?: string;
  takeProfit?: number;
  stopLoss?: number;
  closePrice?: number; // Price at exit
  status: TransactionStatus;
  imageUrl?: string;
  notes?: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  transactionCount: number;
  netPrincipal: number; // Deposits - Withdrawals + Realized P/L
  hasFundTransactions: boolean;
  winRate: number;
}