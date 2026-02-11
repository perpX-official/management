import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  marginMode: 'cross' | 'isolated';
  pnl: number;
  pnlPercentage: number;
  liquidationPrice: number;
  timestamp: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  size: number;
  price: number;
  stopPrice?: number;
  status: 'pending' | 'filled' | 'cancelled';
  timestamp: number;
  filledPrice?: number;
  filledTimestamp?: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  timestamp: number;
  pnl?: number;
}

interface DemoTradingContextType {
  balance: number;
  positions: Position[];
  orders: Order[];
  trades: Trade[];
  placeOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => void;
  closePosition: (positionId: string, currentPrice: number) => void;
  cancelOrder: (orderId: string) => void;
  updatePositionPrices: (symbol: string, currentPrice: number) => void;
  resetAccount: () => void;
}

const DemoTradingContext = createContext<DemoTradingContextType | undefined>(undefined);

const INITIAL_BALANCE = 10000;
const STORAGE_KEY = 'perpx_demo_trading';

export function DemoTradingProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setBalance(data.balance || INITIAL_BALANCE);
        setPositions(data.positions || []);
        setOrders(data.orders || []);
        setTrades(data.trades || []);
      } catch (e) {
        console.error('Failed to load demo trading data:', e);
      }
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      balance,
      positions,
      orders,
      trades,
    }));
  }, [balance, positions, orders, trades]);

  const placeOrder = (orderData: Omit<Order, 'id' | 'status' | 'timestamp'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      timestamp: Date.now(),
    };

    // For market orders, execute immediately
    if (orderData.type === 'market') {
      executeOrder(newOrder, orderData.price);
    } else {
      // For limit and stop orders, add to pending orders
      setOrders(prev => [newOrder, ...prev]);
    }
  };

  const executeOrder = (order: Order, executionPrice: number) => {
    const orderValue = order.size * executionPrice;
    
    // Check if user has enough balance
    if (orderValue > balance) {
      alert('Insufficient balance');
      return;
    }

    // Create or update position
    const existingPosition = positions.find(p => p.symbol === order.symbol);
    
    if (existingPosition) {
      // Update existing position
      const isSameSide = (order.side === 'buy' && existingPosition.side === 'long') ||
                         (order.side === 'sell' && existingPosition.side === 'short');
      
      if (isSameSide) {
        // Add to position
        const newSize = existingPosition.size + order.size;
        const newEntryPrice = (existingPosition.entryPrice * existingPosition.size + executionPrice * order.size) / newSize;
        
        setPositions(prev => prev.map(p => 
          p.id === existingPosition.id
            ? { ...p, size: newSize, entryPrice: newEntryPrice }
            : p
        ));
      } else {
        // Close or reduce position
        if (order.size >= existingPosition.size) {
          // Close position completely
          const pnl = calculatePnL(existingPosition, executionPrice);
          setBalance(prev => prev + pnl);
          setPositions(prev => prev.filter(p => p.id !== existingPosition.id));
          
          // Add trade record
          addTrade({
            symbol: order.symbol,
            side: order.side,
            size: existingPosition.size,
            price: executionPrice,
            pnl,
          });
        } else {
          // Reduce position
          const pnl = calculatePnL({...existingPosition, size: order.size}, executionPrice);
          setBalance(prev => prev + pnl);
          setPositions(prev => prev.map(p =>
            p.id === existingPosition.id
              ? { ...p, size: p.size - order.size }
              : p
          ));
          
          addTrade({
            symbol: order.symbol,
            side: order.side,
            size: order.size,
            price: executionPrice,
            pnl,
          });
        }
      }
    } else {
      // Create new position
      const newPosition: Position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol: order.symbol,
        side: order.side === 'buy' ? 'long' : 'short',
        size: order.size,
        entryPrice: executionPrice,
        currentPrice: executionPrice,
        leverage: 1, // Default leverage
        marginMode: 'cross',
        pnl: 0,
        pnlPercentage: 0,
        liquidationPrice: 0,
        timestamp: Date.now(),
      };
      
      setPositions(prev => [newPosition, ...prev]);
      setBalance(prev => prev - orderValue);
    }

    // Add to trade history
    addTrade({
      symbol: order.symbol,
      side: order.side,
      size: order.size,
      price: executionPrice,
    });

    // Mark order as filled
    setOrders(prev => prev.map(o =>
      o.id === order.id
        ? { ...o, status: 'filled', filledPrice: executionPrice, filledTimestamp: Date.now() }
        : o
    ));
  };

  const calculatePnL = (position: Position, currentPrice: number): number => {
    const priceDiff = position.side === 'long'
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;
    
    return priceDiff * position.size;
  };

  const addTrade = (tradeData: Omit<Trade, 'id' | 'timestamp'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setTrades(prev => [newTrade, ...prev]);
  };

  const closePosition = (positionId: string, currentPrice: number) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    const pnl = calculatePnL(position, currentPrice);
    setBalance(prev => prev + pnl + (position.size * position.entryPrice));
    setPositions(prev => prev.filter(p => p.id !== positionId));

    // Add trade record
    addTrade({
      symbol: position.symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      size: position.size,
      price: currentPrice,
      pnl,
    });
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'cancelled' } : o
    ));
  };

  const updatePositionPrices = (symbol: string, currentPrice: number) => {
    setPositions(prev => prev.map(position => {
      if (position.symbol !== symbol) return position;

      const pnl = calculatePnL(position, currentPrice);
      const pnlPercentage = (pnl / (position.entryPrice * position.size)) * 100;

      return {
        ...position,
        currentPrice,
        pnl,
        pnlPercentage,
      };
    }));

    // Check pending limit orders
    setOrders(prev => {
      const updatedOrders = [...prev];
      prev.forEach(order => {
        if (order.status === 'pending' && order.symbol === symbol) {
          if (order.type === 'limit') {
            const shouldExecute = (order.side === 'buy' && currentPrice <= order.price) ||
                                 (order.side === 'sell' && currentPrice >= order.price);
            if (shouldExecute) {
              executeOrder(order, currentPrice);
            }
          } else if (order.type === 'stop' && order.stopPrice) {
            const shouldExecute = (order.side === 'buy' && currentPrice >= order.stopPrice) ||
                                 (order.side === 'sell' && currentPrice <= order.stopPrice);
            if (shouldExecute) {
              executeOrder(order, currentPrice);
            }
          }
        }
      });
      return updatedOrders;
    });
  };

  const resetAccount = () => {
    setBalance(INITIAL_BALANCE);
    setPositions([]);
    setOrders([]);
    setTrades([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <DemoTradingContext.Provider
      value={{
        balance,
        positions,
        orders,
        trades,
        placeOrder,
        closePosition,
        cancelOrder,
        updatePositionPrices,
        resetAccount,
      }}
    >
      {children}
    </DemoTradingContext.Provider>
  );
}

export function useDemoTrading() {
  const context = useContext(DemoTradingContext);
  if (!context) {
    throw new Error('useDemoTrading must be used within DemoTradingProvider');
  }
  return context;
}

