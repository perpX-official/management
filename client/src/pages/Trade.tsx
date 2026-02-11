import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Star } from "lucide-react";
import TradingViewChart from "@/components/TradingViewChart";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRewardsState } from "@/hooks/useRewardsState";
import { toast } from "sonner";

// Base trading pairs configuration (prices will be updated in real-time)
const TRADING_PAIRS_CONFIG = [
  { symbol: "BTCUSDT", name: "Bitcoin", volume: "2.5B" },
  { symbol: "ETHUSDT", name: "Ethereum", volume: "1.2B" },
  { symbol: "SOLUSDT", name: "Solana", volume: "850M" },
  { symbol: "BNBUSDT", name: "BNB", volume: "420M" },
  { symbol: "XRPUSDT", name: "Ripple", volume: "680M" },
];

// Type for trading pair with real-time data
interface TradingPair {
  symbol: string;
  name: string;
  volume: string;
  price: number;
  change: number;
}

export default function Trade() {
  const { t } = useLanguage();
  const { isConnected } = useRewardsState();
  const connect = () => {
    // Trigger wallet connection modal via event or context if needed
    // For now, we rely on the Header's connect button
    toast.info("Please connect your wallet using the button in the header");
  };
  
  // Mock data for display
  const balance = 10000; // Mock balance for display
  const positions: any[] = [];
  const orders: any[] = [];
  const trades: any[] = [];
  
  // ✅ Real-time prices for ALL trading pairs
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>(
    TRADING_PAIRS_CONFIG.map(p => ({ ...p, price: 0, change: 0 }))
  );
  
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const selectedPair = tradingPairs[selectedPairIndex];

  // ✅ Real-time price state for the selected pair (displayed in header)
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  
  // WebSocket references - one for selected pair, one for all pairs
  const wsRef = useRef<WebSocket | null>(null);
  const allPairsWsRef = useRef<WebSocket | null>(null);

  const [showPairSelector, setShowPairSelector] = useState(false);
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [leverage, setLeverage] = useState(25);
  const [activeTab, setActiveTab] = useState<"positions" | "orders" | "history" | "trades">("positions");
  const [tradeMode, setTradeMode] = useState<"perpetual" | "spot">("perpetual");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");

  // ✅ Fetch initial prices via REST API (fallback for WebSocket)
  useEffect(() => {
    const fetchInitialPrices = async () => {
      try {
        const symbols = TRADING_PAIRS_CONFIG.map(p => p.symbol);
        const responses = await Promise.all(
          symbols.map(symbol => 
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
              .then(res => res.json())
          )
        );
        
        setTradingPairs(prev => prev.map((pair, index) => ({
          ...pair,
          price: parseFloat(responses[index].lastPrice),
          change: parseFloat(responses[index].priceChangePercent)
        })));
        
        // Also set current price for selected pair
        if (responses[0]) {
          setCurrentPrice(parseFloat(responses[0].lastPrice));
          setPriceChange(parseFloat(responses[0].priceChangePercent));
        }
      } catch (error) {
        console.error('Failed to fetch initial prices:', error);
      }
    };
    
    fetchInitialPrices();
  }, []);

  // ✅ Connect to Binance WebSocket for ALL trading pairs (for the dropdown list)
  useEffect(() => {
    // Create combined stream URL for all pairs
    const streams = TRADING_PAIRS_CONFIG.map(p => `${p.symbol.toLowerCase()}@ticker`).join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
    
    console.log('Connecting to Binance Combined WebSocket for all pairs');
    
    // Close existing connection
    if (allPairsWsRef.current) {
      allPairsWsRef.current.close();
    }
    
    // Create new WebSocket connection
    const ws = new WebSocket(wsUrl);
    allPairsWsRef.current = ws;
    
    ws.onopen = () => {
      console.log('All pairs WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const data = message.data;
        const symbol = data.s; // Symbol like "BTCUSDT"
        const newPrice = parseFloat(data.c); // Last price
        const priceChangePercent = parseFloat(data.P); // Price change percent
        
        // Update the specific pair in the list
        setTradingPairs(prev => prev.map(pair => 
          pair.symbol === symbol 
            ? { ...pair, price: newPrice, change: priceChangePercent }
            : pair
        ));
      } catch (error) {
        console.error('Failed to parse all pairs WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('All pairs WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('All pairs WebSocket disconnected');
    };
    
    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // ✅ Connect to Binance WebSocket for the SELECTED pair (for the header display)
  useEffect(() => {
    const symbol = selectedPair.symbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;
    
    console.log('Connecting to Binance WebSocket for selected pair:', symbol);
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Create new WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Selected pair WebSocket connected for', selectedPair.symbol);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newPrice = parseFloat(data.c); // 'c' is the last price
        const priceChangePercent = parseFloat(data.P); // 'P' is the price change percent
        
        // Update the header display
        setCurrentPrice(newPrice);
        setPriceChange(priceChangePercent);
      } catch (error) {
        console.error('Failed to parse selected pair WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Selected pair WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Selected pair WebSocket disconnected');
    };
    
    // Cleanup on unmount or symbol change
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedPair.symbol]);

  const handlePercentageClick = (percent: number) => {
    const calculatedAmount = (balance * percent) / 100;
    setAmount(calculatedAmount.toFixed(2));
  };

  const handleTrade = (side: 'buy' | 'sell') => {
    if (!isConnected) {
      toast.error('Please connect your wallet to trade');
      connect();
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
  };

  const handleClosePosition = (positionId: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to close positions');
      connect();
      return;
    }
    toast.success('Position closed successfully');
  };

  const handleCancelOrder = (orderId: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet to cancel orders');
      connect();
      return;
    }
    toast.success('Order cancelled successfully');
  };

  // Helper function to format price based on the symbol
  const formatPrice = (price: number, symbol: string) => {
    if (price === 0) return "Loading...";
    
    // XRP and other low-priced assets need more decimal places
    if (symbol === "XRPUSDT") {
      return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    // SOL, BNB need 1-2 decimal places
    if (symbol === "SOLUSDT" || symbol === "BNBUSDT") {
      return price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    }
    // BTC, ETH - standard 2 decimal places
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Perpetual/Spot Tabs */}
      <div className="bg-card/50 border-b border-white/5">
        <div className="flex">
          <button
            onClick={() => setTradeMode("perpetual")}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              tradeMode === "perpetual"
                ? "border-primary text-white"
                : "border-transparent text-white/60"
            }`}
          >
            {t('trade.perpetual')}
          </button>
          <button
            onClick={() => setTradeMode("spot")}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              tradeMode === "spot"
                ? "border-primary text-white"
                : "border-transparent text-white/60"
            }`}
          >
            {t('trade.spot')}
          </button>
        </div>
      </div>

      {/* Mobile Trading Interface */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pair Selector Header */}
        <div className="bg-card/50 border-b border-white/5 p-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowPairSelector(!showPairSelector)}
              className="flex items-center gap-2 hover:bg-white/5 rounded-lg p-2 transition-colors"
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-white font-bold">{selectedPair.symbol}</span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
            <div className="text-right">
              {/* ✅ Use real-time price from Binance WebSocket */}
              <div className="text-2xl font-bold text-white">
                {currentPrice > 0 ? formatPrice(currentPrice, selectedPair.symbol) : "Loading..."}
              </div>
              <div className={`text-sm ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        {/* Pair Selector Dropdown - ✅ NOW WITH REAL-TIME PRICES */}
        {showPairSelector && (
          <div className="bg-card border-b border-white/5 max-h-60 overflow-y-auto">
            {tradingPairs.map((pair, index) => (
              <button
                key={pair.symbol}
                onClick={() => {
                  setSelectedPairIndex(index);
                  setCurrentPrice(pair.price);
                  setPriceChange(pair.change);
                  setShowPairSelector(false);
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <Star className={`h-4 w-4 ${pair.symbol === selectedPair.symbol ? 'text-yellow-500' : 'text-white/20'}`} />
                  <div className="text-left">
                    <div className="text-white font-medium">{pair.symbol}</div>
                    <div className="text-xs text-white/60">{pair.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  {/* ✅ Real-time price for each pair */}
                  <div className="text-white">{formatPrice(pair.price, pair.symbol)}</div>
                  <div className={`text-xs ${pair.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Chart Section */}
        <div className="flex-shrink-0 bg-card/30 border-b border-white/5" style={{ height: '300px' }}>
          <TradingViewChart symbol={selectedPair.symbol} mode={tradeMode} />
        </div>

        {/* Trading Panel */}
        <div className="flex-1 overflow-y-auto bg-background p-4 space-y-4">
          {/* Margin Mode and Leverage - Only for Perpetual */}
          {tradeMode === "perpetual" && (
            <div className="flex gap-2">
              <Button
                variant={marginMode === "cross" ? "default" : "outline"}
                onClick={() => setMarginMode("cross")}
                className="flex-1"
              >
                {t('trade.cross')}
              </Button>
              <Button
                variant={marginMode === "isolated" ? "default" : "outline"}
                onClick={() => setMarginMode("isolated")}
                className="flex-1"
              >
                {t('trade.isolated')}
              </Button>
              <Button variant="outline" className="px-4">
                {leverage}x
              </Button>
            </div>
          )}

          {/* Order Type Tabs */}
          <div className="flex gap-2 bg-card/30 rounded-lg p-1">
            <button
              onClick={() => setOrderType("market")}
              className={`flex-1 py-2 rounded-md transition-colors ${
                orderType === "market" ? "bg-primary text-white" : "text-white/60"
              }`}
            >
              {t('trade.market')}
            </button>
            <button
              onClick={() => setOrderType("limit")}
              className={`flex-1 py-2 rounded-md transition-colors ${
                orderType === "limit" ? "bg-primary text-white" : "text-white/60"
              }`}
            >
              {t('trade.limit')}
            </button>
            <button
              onClick={() => setOrderType("stop")}
              className={`flex-1 py-2 rounded-md transition-colors ${
                orderType === "stop" ? "bg-primary text-white" : "text-white/60"
              }`}
            >
              {t('trade.stop')}
            </button>
          </div>

          {/* Price Inputs */}
          {orderType === "limit" && (
            <div>
              <label className="text-xs text-white/60 mb-1 block">{t('trade.limitPrice')}</label>
              <Input
                type="number"
                placeholder={currentPrice > 0 ? formatPrice(currentPrice, selectedPair.symbol) : "0.00"}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="bg-card/50 border-white/10"
              />
            </div>
          )}

          {orderType === "stop" && (
            <>
              <div>
                <label className="text-xs text-white/60 mb-1 block">{t('trade.stopPrice')}</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  className="bg-card/50 border-white/10"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">{t('trade.limitPrice')}</label>
                <Input
                  type="number"
                  placeholder={currentPrice > 0 ? formatPrice(currentPrice, selectedPair.symbol) : "0.00"}
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="bg-card/50 border-white/10"
                />
              </div>
            </>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-white/60">{t('trade.amount')} (USDT)</label>
              <span className="text-xs text-white/60">{t('trade.available')}: {balance.toLocaleString()} USDT</span>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-card/50 border-white/10"
            />
          </div>

          {/* Percentage Buttons */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <Button
                key={percent}
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handlePercentageClick(percent)}
              >
                {percent}%
              </Button>
            ))}
          </div>

          {/* Buy/Sell Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleTrade('buy')}
            >
              {tradeMode === "perpetual" ? t('trade.long') : t('trade.buy')}
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => handleTrade('sell')}
            >
              {tradeMode === "perpetual" ? t('trade.short') : t('trade.sell')}
            </Button>
          </div>

          {/* Positions/Orders Tabs */}
          <div className="mt-4">
            <div className="flex gap-2 border-b border-white/10 mb-4">
              <button
                onClick={() => setActiveTab("positions")}
                className={`pb-2 px-2 text-sm ${
                  activeTab === "positions"
                    ? "text-white border-b-2 border-primary"
                    : "text-white/60"
                }`}
              >
                {t('trade.positions')} ({positions.length})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`pb-2 px-2 text-sm ${
                  activeTab === "orders"
                    ? "text-white border-b-2 border-primary"
                    : "text-white/60"
                }`}
              >
                {t('trade.openOrders')} ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("trades")}
                className={`pb-2 px-2 text-sm ${
                  activeTab === "trades"
                    ? "text-white border-b-2 border-primary"
                    : "text-white/60"
                }`}
              >
                {t('trade.trades')} ({trades.length})
              </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[100px]">
              {activeTab === "positions" && (
                <div className="text-center text-white/40 py-8">
                  {positions.length === 0 ? t('trade.noPositions') : (
                    <div className="space-y-2">
                      {positions.map((position: any) => (
                        <Card key={position.id} className="p-3 bg-card/50">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">{position.symbol}</div>
                              <div className={`text-sm ${position.side === 'long' ? 'text-green-500' : 'text-red-500'}`}>
                                {position.side.toUpperCase()} {position.leverage}x
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} USDT
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClosePosition(position.id)}
                              >
                                {t('trade.close')}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "orders" && (
                <div className="text-center text-white/40 py-8">
                  {orders.length === 0 ? t('trade.noOrders') : (
                    <div className="space-y-2">
                      {orders.map((order: any) => (
                        <Card key={order.id} className="p-3 bg-card/50">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">{order.symbol}</div>
                              <div className="text-sm text-white/60">
                                {order.type} - {order.side}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white">{order.price}</div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelOrder(order.id)}
                              >
                                {t('trade.cancel')}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "trades" && (
                <div className="text-center text-white/40 py-8">
                  {trades.length === 0 ? t('trade.noTrades') : (
                    <div className="space-y-2">
                      {trades.map((trade: any) => (
                        <Card key={trade.id} className="p-3 bg-card/50">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">{trade.symbol}</div>
                              <div className={`text-sm ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                                {trade.side.toUpperCase()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white">{trade.price}</div>
                              <div className="text-xs text-white/60">{trade.amount}</div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
