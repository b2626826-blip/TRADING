import React, { useState } from 'react';
import { Transaction, PortfolioSummary, TransactionStatus } from './types';
import { Plus, Trash2, TrendingUp, DollarSign, PieChart, Upload, Image as ImageIcon, X, Target, List, ArrowDownCircle, ArrowUpCircle, Wallet, Percent, Edit, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const STRATEGY_OPTIONS = [
  "趨勢跟蹤",
  "突破交易",
  "反轉交易",
  "震盪操作",
  "長期投資",
  "當沖交易",
  "事件交易",
  "其他"
];

// --- Sub-component: Profit/Loss Calendar ---
interface CalendarProps {
  transactions: Transaction[];
  onClose: () => void;
}

const ProfitLossCalendar: React.FC<CalendarProps> = ({ transactions, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Calculate Daily P/L map
  const dailyPnL = transactions.reduce((acc, tx) => {
    // Only count closed trades with valid P/L
    if (tx.status === 'open' || tx.type === 'deposit' || tx.type === 'withdrawal' || !tx.closePrice) {
      return acc;
    }

    // P/L Calculation logic
    const diff = tx.closePrice - tx.price;
    let pnl = diff * tx.quantity;
    if (tx.type === 'sell') pnl = -pnl; // For short selling/selling, logic depends on perspective, assuming Short Sell here: (Entry - Exit) * Qty = - (Exit - Entry)

    const dateStr = tx.date; // Format: YYYY-MM-DD
    acc[dateStr] = (acc[dateStr] || 0) + pnl;
    return acc;
  }, {} as Record<string, number>);

  const days = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-100"></div>);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const pnl = dailyPnL[dateStr];
    
    let bgColor = "bg-white";
    let textColor = "text-slate-700";
    let borderColor = "border-slate-100";

    if (pnl !== undefined) {
      if (pnl > 0) {
        bgColor = "bg-emerald-50";
        textColor = "text-emerald-700";
        borderColor = "border-emerald-200";
      } else if (pnl < 0) {
        bgColor = "bg-red-50";
        textColor = "text-red-700";
        borderColor = "border-red-200";
      } else {
        bgColor = "bg-slate-100";
        textColor = "text-slate-500";
      }
    }

    days.push(
      <div key={day} className={`h-24 border p-2 flex flex-col justify-between transition-colors hover:shadow-md ${borderColor} ${bgColor}`}>
        <span className="text-xs font-semibold text-slate-400">{day}</span>
        {pnl !== undefined && (
          <div className="text-right">
             <div className={`text-sm font-bold ${textColor}`}>
               {pnl > 0 ? '+' : ''}{Math.round(pnl).toLocaleString()}
             </div>
             <div className="text-[10px] text-slate-400">已實現</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" size={20} /> 盈虧日曆 (Realized P/L)
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft /></button>
          <div className="text-lg font-bold text-slate-800">
            {year}年 {month + 1}月
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight /></button>
        </div>

        <div className="grid grid-cols-7 text-center border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 py-2">
          <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
        </div>

        <div className="grid grid-cols-7 overflow-y-auto">
          {days}
        </div>
        
        <div className="p-3 bg-slate-50 text-xs text-slate-400 text-center border-t border-slate-200">
           *僅顯示已平倉(Closed)交易的已實現損益
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  // Mock initial data - Added a Deposit so Pie Chart shows up immediately
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 'init_fund', date: '2023-01-01', type: 'deposit', symbol: '入金', price: 1000000, quantity: 1, strategy: '資金管理', status: 'open', notes: '初始本金' },
    { id: '1', date: '2023-10-01', type: 'buy', symbol: '2330.TW', price: 580, quantity: 1000, strategy: '趨勢跟蹤', takeProfit: 800, stopLoss: 500, status: 'open', notes: '看好先進製程' },
    { id: '2', date: '2023-11-15', type: 'buy', symbol: 'NVDA', price: 450, quantity: 10, strategy: '突破交易', status: 'win', closePrice: 500, notes: 'AI 趨勢' },
    { id: '3', date: '2023-12-01', type: 'buy', symbol: 'TSLA', price: 240, quantity: 20, strategy: '反轉交易', status: 'loss', closePrice: 200, notes: '止損出場' }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isCustomStrategy, setIsCustomStrategy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'buy',
    date: new Date().toISOString().split('T')[0],
    quantity: 0,
    price: 0,
    strategy: '趨勢跟蹤',
    status: 'open'
  });

  // State for image preview modal in the table
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Extended summary calculation with Win Rate and Realized P/L integration
  const summary = transactions.reduce((acc, curr) => {
    const amount = curr.price * curr.quantity;
    
    // 1. Calculate Funds (Deposits/Withdrawals) & Update Principal
    if (curr.type === 'deposit') {
      acc.netPrincipal += amount;
      acc.hasFundTransactions = true;
    } else if (curr.type === 'withdrawal') {
      acc.netPrincipal -= amount;
      acc.hasFundTransactions = true;
    } 
    // 2. Handle Trades
    else {
      if (curr.type === 'buy') acc.totalInvested += amount;
      if (curr.type === 'sell') acc.totalInvested -= amount;

      // Realized P/L Calculation: Update Principal if trade is closed
      if (curr.status !== 'open' && curr.closePrice !== undefined) {
        const diff = curr.closePrice - curr.price;
        const pnl = diff * curr.quantity;
        const finalPnL = curr.type === 'sell' ? -pnl : pnl;
        
        acc.netPrincipal += finalPnL;
        
        // Win Rate Logic (only for trades, not funds)
        acc.closedCount++;
        
        if (curr.status === 'win') {
          acc.winCount++;
        } else if (curr.status === 'breakeven') {
          // If Hedging (Breakeven): Positive P/L counts as Win
          // Negative or Zero P/L counts as Loss (in terms of win rate denominator)
          if (finalPnL > 0) {
            acc.winCount++;
          }
        }
      }
    }

    acc.transactionCount++;
    return acc;
  }, { 
    totalInvested: 0, 
    transactionCount: 0, 
    netPrincipal: 0, 
    hasFundTransactions: false,
    winRate: 0,
    closedCount: 0,
    winCount: 0
  });

  // Finalize Win Rate
  const finalSummary: PortfolioSummary = {
    ...summary,
    winRate: summary.closedCount > 0 ? (summary.winCount / summary.closedCount) * 100 : 0
  };

  const handleAddTransaction = () => {
    // Validation: 
    // For funds: requires price (amount)
    // For trades: requires symbol, price, quantity
    const isFund = newTx.type === 'deposit' || newTx.type === 'withdrawal';
    if (!newTx.price) return;
    if (!isFund && (!newTx.symbol || !newTx.quantity)) return;
    
    const transactionData: Transaction = {
      id: editingId || Date.now().toString(),
      date: newTx.date || new Date().toISOString().split('T')[0],
      type: newTx.type as any,
      symbol: isFund ? (newTx.type === 'deposit' ? '入金' : '出金') : newTx.symbol!.toUpperCase(),
      price: Number(newTx.price),
      quantity: isFund ? 1 : Number(newTx.quantity), // Fund qty is 1, price is amount
      strategy: isFund ? '資金管理' : (newTx.strategy || '未分類'),
      takeProfit: newTx.takeProfit ? Number(newTx.takeProfit) : undefined,
      stopLoss: newTx.stopLoss ? Number(newTx.stopLoss) : undefined,
      status: isFund ? 'open' : (newTx.status as TransactionStatus || 'open'), // Reuse open for funds
      closePrice: newTx.closePrice ? Number(newTx.closePrice) : undefined,
      imageUrl: newTx.imageUrl,
      notes: newTx.notes
    };

    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? transactionData : t));
    } else {
      setTransactions([...transactions, transactionData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewTx({ 
      type: 'buy', 
      date: new Date().toISOString().split('T')[0], 
      quantity: 0, 
      price: 0, 
      symbol: '', 
      strategy: '趨勢跟蹤',
      status: 'open',
      imageUrl: undefined, 
      takeProfit: undefined, 
      stopLoss: undefined,
      closePrice: undefined,
      notes: ''
    });
    setIsCustomStrategy(false);
  };

  const openFundForm = (type: 'deposit' | 'withdrawal') => {
    setEditingId(null);
    setNewTx({
      type: type,
      date: new Date().toISOString().split('T')[0],
      quantity: 1, // Default to 1 for calculation convenience
      price: 0,
      symbol: type === 'deposit' ? 'DEPOSIT' : 'WITHDRAWAL',
      strategy: '資金管理',
      status: 'open',
      notes: ''
    });
    setShowForm(true);
  };

  const handleEdit = (tx: Transaction, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(tx.id);
    
    // Check if strategy is custom
    const isStandardStrategy = STRATEGY_OPTIONS.includes(tx.strategy || '');
    setIsCustomStrategy(!isStandardStrategy && tx.strategy !== '資金管理');

    setNewTx({
      ...tx
    });
    setShowForm(true);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // Directly delete without confirmation dialog
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTx({ ...newTx, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to calculate Projected P/L (for Open trades based on targets)
  const calculateProjectedPnL = (tx: Transaction, targetPrice: number | undefined) => {
    if (!targetPrice) return null;
    const diff = targetPrice - tx.price;
    const totalPnL = diff * tx.quantity;
    
    if (tx.type === 'sell') {
      return -totalPnL;
    }
    return totalPnL;
  };

  // Helper to calculate Realized P/L (for Closed trades)
  const calculateRealizedPnL = (tx: Transaction) => {
    if (!tx.closePrice) return 0;
    const diff = tx.closePrice - tx.price;
    const totalPnL = diff * tx.quantity;
    
    if (tx.type === 'sell') {
      return -totalPnL;
    }
    return totalPnL;
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'win':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">止盈 (Win)</span>;
      case 'loss':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">止損 (Loss)</span>;
      case 'breakeven':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">套保 (Hedging)</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">持倉中 (Open)</span>;
    }
  };

  const isFundTx = newTx.type === 'deposit' || newTx.type === 'withdrawal';

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 font-sans">
      
      {/* Calendar Modal */}
      {showCalendar && (
        <ProfitLossCalendar transactions={transactions} onClose={() => setShowCalendar(false)} />
      )}

      {/* MAIN PANEL: Portfolio Management */}
      <div className="w-full flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-center shadow-sm z-10 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="text-indigo-600" /> 
              交易紀錄
            </h1>
            <p className="text-slate-500 text-sm mt-1">追蹤您的每一筆交易與資金流向</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCalendar(true)}
              className="bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium shadow-sm"
              title="查看盈虧日曆"
            >
              <CalendarIcon size={16} /> <span className="hidden sm:inline">盈虧日曆</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button 
              onClick={() => openFundForm('deposit')}
              className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
            >
              <ArrowDownCircle size={16} /> <span className="hidden sm:inline">入金</span>
            </button>
            <button 
              onClick={() => openFundForm('withdrawal')}
              className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
            >
              <ArrowUpCircle size={16} /> <span className="hidden sm:inline">出金</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button 
              onClick={() => {
                setEditingId(null);
                setNewTx({ type: 'buy', date: new Date().toISOString().split('T')[0], quantity: 0, price: 0, strategy: '趨勢跟蹤', status: 'open' });
                setShowForm(!showForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-medium"
            >
              <Plus size={18} /> 新增
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="p-6 grid grid-cols-2 gap-4 shrink-0">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  {finalSummary.hasFundTransactions ? <Wallet size={16} /> : <DollarSign size={16} />}
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {finalSummary.hasFundTransactions ? "總本金 (Total Equity)" : "估算投入 (Est. Invested)"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  ${finalSummary.hasFundTransactions ? finalSummary.netPrincipal.toLocaleString() : finalSummary.totalInvested.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                   <span>{finalSummary.hasFundTransactions ? "含入出金與已實現損益" : "尚未紀錄入金"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <TrendingUp size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">交易概況</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {finalSummary.transactionCount} <span className="text-sm font-normal text-slate-400">筆紀錄</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="flex items-center gap-1 text-slate-500 mb-2 justify-end">
                    <Percent size={14} />
                    <span className="text-xs font-semibold uppercase tracking-wider">勝率</span>
                  </div>
                  <div className={`text-xl font-bold ${finalSummary.winRate >= 50 ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {finalSummary.winRate.toFixed(1)}%
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Form Modal / Area */}
        {showForm && (
          <div className="mx-6 mb-6 bg-white p-6 rounded-xl shadow-lg border border-indigo-100 animate-in fade-in slide-in-from-top-4 overflow-y-auto max-h-[60vh] z-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800 text-lg">
                {editingId 
                  ? '編輯交易/款項' 
                  : (isFundTx ? (newTx.type === 'deposit' ? '新增入金紀錄' : '新增出金紀錄') : '新增交易')
                }
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-5 mb-6">
              {/* Fund Transaction Form (Simplified) */}
              {isFundTx ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">日期</label>
                    <input 
                      type="date" 
                      value={newTx.date}
                      onChange={e => setNewTx({...newTx, date: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">金額</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={newTx.price || ''}
                        onChange={e => setNewTx({...newTx, price: parseFloat(e.target.value)})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 pl-8 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">備註 (來源/用途)</label>
                    <textarea 
                        rows={2}
                        placeholder="例如：銀行轉入、獲利出金..." 
                        value={newTx.notes || ''}
                        onChange={e => setNewTx({...newTx, notes: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" 
                    />
                  </div>
                </div>
              ) : (
                /* Regular Trading Form */
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">基本資訊</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">日期</label>
                        <input 
                          type="date" 
                          value={newTx.date}
                          onChange={e => setNewTx({...newTx, date: e.target.value})}
                          className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">類型</label>
                        <select 
                          value={newTx.type}
                          onChange={e => setNewTx({...newTx, type: e.target.value as any})}
                          className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                          <option value="buy">買入 (Buy)</option>
                          <option value="sell">賣出 (Sell)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">代碼 (Symbol)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., AAPL" 
                        value={newTx.symbol}
                        onChange={e => setNewTx({...newTx, symbol: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-sm" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">開倉價格</label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          value={newTx.price || ''}
                          onChange={e => setNewTx({...newTx, price: parseFloat(e.target.value)})}
                          className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">數量</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={newTx.quantity || ''}
                          onChange={e => setNewTx({...newTx, quantity: parseFloat(e.target.value)})}
                          className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-emerald-600 mb-1">止盈目標 (TP)</label>
                        <input 
                          type="number" 
                          placeholder="選填" 
                          value={newTx.takeProfit || ''}
                          onChange={e => setNewTx({...newTx, takeProfit: parseFloat(e.target.value)})}
                          className="w-full border border-emerald-200 rounded-lg p-2.5 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-red-600 mb-1">止損目標 (SL)</label>
                        <input 
                          type="number" 
                          placeholder="選填" 
                          value={newTx.stopLoss || ''}
                          onChange={e => setNewTx({...newTx, stopLoss: parseFloat(e.target.value)})}
                          className="w-full border border-red-200 rounded-lg p-2.5 bg-red-50/50 focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">策略與狀態</h4>
                     
                     <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">策略類型</label>
                        {!isCustomStrategy ? (
                          <select
                            value={STRATEGY_OPTIONS.includes(newTx.strategy || '') ? newTx.strategy : '__custom__'}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '__custom__') {
                                setIsCustomStrategy(true);
                                setNewTx({...newTx, strategy: ''});
                              } else {
                                setNewTx({...newTx, strategy: val});
                              }
                            }}
                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          >
                            {STRATEGY_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value="__custom__">✎ 自訂輸入...</option>
                          </select>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTx.strategy || ''}
                              onChange={e => setNewTx({...newTx, strategy: e.target.value})}
                              placeholder="輸入自訂策略名稱"
                              className="flex-1 border border-indigo-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                              autoFocus
                            />
                            <button 
                              onClick={() => {
                                setIsCustomStrategy(false);
                                setNewTx({...newTx, strategy: STRATEGY_OPTIONS[0]});
                              }}
                              className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"
                              title="返回列表選擇"
                            >
                              <List size={18} />
                            </button>
                          </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">當前狀態</label>
                          <select 
                            value={newTx.status || 'open'}
                            onChange={e => setNewTx({...newTx, status: e.target.value as TransactionStatus})}
                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          >
                            <option value="open">持倉中 (Open)</option>
                            <option value="win">止盈 (Win)</option>
                            <option value="loss">止損 (Loss)</option>
                            <option value="breakeven">套保 (Hedging)</option>
                          </select>
                       </div>
                       {newTx.status !== 'open' && (
                         <div className="animate-in fade-in slide-in-from-left-2">
                            <label className="block text-xs font-medium text-slate-600 mb-1">平倉價格</label>
                            <input 
                              type="number" 
                              placeholder="Exited at..." 
                              value={newTx.closePrice || ''}
                              onChange={e => setNewTx({...newTx, closePrice: parseFloat(e.target.value)})}
                              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                            />
                         </div>
                       )}
                     </div>

                     <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-600 mb-1">備註</label>
                        <textarea 
                            rows={2}
                            placeholder="紀錄進場原因、市場狀況..." 
                            value={newTx.notes || ''}
                            onChange={e => setNewTx({...newTx, notes: e.target.value})}
                            className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" 
                        />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">上傳圖片 (線圖/筆記)</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {newTx.imageUrl ? (
                          <div className="relative h-20 w-full">
                             <img src={newTx.imageUrl} alt="Preview" className="h-full w-full object-contain mx-auto" />
                             <span className="text-xs text-indigo-600 mt-1 block">點擊更換</span>
                          </div>
                        ) : (
                          <div className="py-2">
                            <Upload className="mx-auto text-slate-400 mb-1" size={20} />
                            <span className="text-xs text-slate-500">點擊上傳圖片</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                onClick={resetForm}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button 
                onClick={handleAddTransaction}
                className={`px-6 py-2 text-white rounded-lg text-sm shadow-sm font-medium ${
                  newTx.type === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                  newTx.type === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {editingId ? '儲存變更' : (isFundTx ? '確認款項' : '儲存交易')}
              </button>
            </div>
          </div>
        )}

        {/* Transaction Table */}
        <div className="flex-1 overflow-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-[600px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">日期/類型</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">代碼/策略</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">開倉/止盈損</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">數量</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">損益 (P/L)</th>
                  <th className="p-4 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      尚無交易紀錄，請點擊上方「新增交易」。
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => {
                    const isTxFund = tx.type === 'deposit' || tx.type === 'withdrawal';
                    
                    if (isTxFund) {
                       return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="p-4 pl-6 text-center text-slate-300">
                              {tx.type === 'deposit' ? <ArrowDownCircle className="text-emerald-400 mx-auto" /> : <ArrowUpCircle className="text-red-400 mx-auto" />}
                           </td>
                           <td className="p-4">
                            <div className="text-sm text-slate-600 font-medium">{tx.date}</div>
                            <div className={`text-xs inline-block mt-1 px-2 py-0.5 rounded-full font-medium ${
                              tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {tx.type === 'deposit' ? '入金' : '出金'}
                            </div>
                           </td>
                           <td className="p-4">
                             <div className="text-sm font-bold text-slate-800">{tx.type === 'deposit' ? '資金存入' : '資金取出'}</div>
                             <div className="text-xs text-slate-400 mt-1">{tx.notes || '---'}</div>
                           </td>
                           <td className="p-4 text-right">
                             <div className="text-sm text-slate-700 font-semibold">${tx.price.toLocaleString()}</div>
                           </td>
                           <td className="p-4 text-right text-slate-400 text-sm">---</td>
                           <td className="p-4 text-right">---</td>
                           <td className="p-4 text-right pr-6">
                            <div className="flex justify-end gap-1">
                              <button 
                                type="button"
                                onClick={(e) => handleEdit(tx, e)}
                                className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                                title="編輯"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => handleDelete(tx.id, e)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                title="刪除"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                       );
                    }

                    // Standard Trade Rendering
                    const isOpen = tx.status === 'open';
                    const projectedWin = calculateProjectedPnL(tx, tx.takeProfit);
                    const projectedLoss = calculateProjectedPnL(tx, tx.stopLoss);
                    const realizedPnL = calculateRealizedPnL(tx);
                    
                    return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4 pl-6 text-center">
                        {tx.imageUrl ? (
                          <button 
                            onClick={() => setPreviewImage(tx.imageUrl || null)} 
                            className="w-10 h-10 block rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-indigo-500 transition-all mx-auto bg-white"
                          >
                            <img src={tx.imageUrl} alt="縮圖" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 mx-auto rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-600 font-medium">{tx.date}</div>
                        <div className={`text-xs inline-block mt-1 px-2 py-0.5 rounded-full font-medium ${
                          tx.type === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {tx.type === 'buy' ? '買入' : '賣出'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-800">{tx.symbol}</div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {tx.strategy && (
                             <span className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 w-fit px-1.5 py-0.5 rounded">
                               <Target size={10} /> {tx.strategy}
                             </span>
                          )}
                          {tx.notes && <span className="text-xs text-slate-400 truncate max-w-[100px]">{tx.notes}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="text-sm text-slate-700 font-semibold">${tx.price.toLocaleString()}</div>
                        {(tx.takeProfit || tx.stopLoss) && (
                          <div className="text-[10px] mt-1 flex flex-col items-end gap-0.5">
                            {tx.takeProfit && <span className="text-emerald-600 bg-emerald-50 px-1 rounded">TP: {tx.takeProfit}</span>}
                            {tx.stopLoss && <span className="text-red-600 bg-red-50 px-1 rounded">SL: {tx.stopLoss}</span>}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-600 text-right">{tx.quantity.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        {/* P/L Amount */}
                        <div className={`text-sm font-bold ${
                           isOpen ? 'text-slate-400' 
                           : realizedPnL > 0 ? 'text-emerald-600' 
                           : realizedPnL < 0 ? 'text-red-600' 
                           : 'text-orange-600'
                        }`}>
                          {isOpen ? '---' : (realizedPnL > 0 ? '+' : '') + Math.round(realizedPnL).toLocaleString()}
                        </div>
                        
                        {/* Status Badge */}
                        <div className="mt-1 flex flex-col items-end gap-1">
                           {getStatusBadge(tx.status)}
                           
                           {/* Show Projected if Open */}
                           {isOpen && (
                             <div className="flex flex-col items-end gap-0.5 opacity-70">
                                {projectedWin !== null && (
                                  <div className="text-[10px] font-medium text-emerald-600">
                                    預期: +{Math.round(projectedWin).toLocaleString()}
                                  </div>
                                )}
                                {projectedLoss !== null && (
                                  <div className="text-[10px] font-medium text-red-600">
                                    風險: {Math.round(projectedLoss).toLocaleString()}
                                  </div>
                                )}
                             </div>
                           )}
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex justify-end gap-1">
                           <button 
                            type="button"
                            onClick={(e) => handleEdit(tx, e)}
                            className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                            title="編輯"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleDelete(tx.id, e)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="刪除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Full Preview" className="max-w-full max-h-[90vh] rounded shadow-2xl" />
            <button 
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
              onClick={() => setPreviewImage(null)}
            >
              <X size={32} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;