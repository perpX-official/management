import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Star, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import Header from "@/components/Header";
import TradingViewChart from "@/components/TradingViewChart";

export default function TradeMobile() {
  const [tradeMode, setTradeMode] = useState<"perpetual" | "spot">("perpetual");
  const [orderType, setOrderType] = useState("Market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [leverage, setLeverage] = useState("25x");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <Header />

      {/* Fixed Trade Mode Tabs */}
      <div className="border-b border-white/10 bg-card flex-shrink-0">
        <div className="flex items-center px-3">
          <button
            onClick={() => setTradeMode("perpetual")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              tradeMode === "perpetual"
                ? "border-primary text-white"
                : "border-transparent text-white/60"
            }`}
          >
            Perpetual
          </button>
          <button
            onClick={() => setTradeMode("spot")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              tradeMode === "spot"
                ? "border-primary text-white"
                : "border-transparent text-white/60"
            }`}
          >
            Spot
          </button>
        </div>
      </div>

      {/* Fixed Market Info Bar */}
      <div className="border-b border-white/10 bg-card flex-shrink-0">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold text-white">BTCUSDT</span>
              <ChevronDown className="h-3 w-3 text-white/60" />
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-white">111,062.6</div>
              <div className="text-xs text-green-500">+3.17%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Chart Section - Fixed Height */}
        <div className="h-[300px] bg-card border-b border-white/10">
          <TradingViewChart symbol="BINANCE:BTCUSDT" />
        </div>

        {/* Trading Panel */}
        <div className="p-3 space-y-3">
          {/* Buy/Sell Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide("buy")}
              className={`py-3 rounded-lg font-medium transition-colors ${
                side === "buy"
                  ? "bg-green-500/20 text-green-500 border-2 border-green-500"
                  : "bg-white/5 text-white/60 border border-white/10"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Buy / Long
              </div>
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`py-3 rounded-lg font-medium transition-colors ${
                side === "sell"
                  ? "bg-red-500/20 text-red-500 border-2 border-red-500"
                  : "bg-white/5 text-white/60 border border-white/10"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Sell / Short
              </div>
            </button>
          </div>

          {/* Leverage & Order Type */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white/5 rounded-lg text-sm text-white border border-white/10">
              Cross
            </button>
            <button className="px-4 py-2 bg-white/5 rounded-lg text-sm text-white border border-white/10">
              {leverage}
            </button>
            <button
              onClick={() => setOrderType("Market")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                orderType === "Market"
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/60"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType("Limit")}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                orderType === "Limit"
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/60"
              }`}
            >
              Limit
            </button>
          </div>

          {/* Price Input (Limit only) */}
          {orderType === "Limit" && (
            <div>
              <label className="text-xs text-white/60 mb-1 block">Price (USDT)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="111,073.6"
                className="bg-white/5 border-white/10"
              />
            </div>
          )}

          {/* Size Input */}
          <div>
            <label className="text-xs text-white/60 mb-1 block">Size</label>
            <Input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Percentage Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {["0%", "25%", "50%", "75%", "100%"].map((pct) => (
              <button
                key={pct}
                className="py-2 bg-white/5 rounded text-xs text-white/60 hover:bg-white/10 transition-colors"
              >
                {pct}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <Button
            className={`w-full py-6 text-base font-semibold ${
              side === "buy"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {side === "buy" ? "Buy / Long" : "Sell / Short"}
          </Button>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60 mb-1">Available</div>
              <div className="text-sm font-semibold text-white">0.00 USDT</div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-white/60 mb-1">Max</div>
              <div className="text-sm font-semibold text-white">0.0 USDT</div>
            </div>
          </div>
        </div>

        {/* Positions & Orders Tabs */}
        <div className="border-t border-white/10 bg-card">
          <Tabs defaultValue="positions" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-white/10 rounded-none h-auto p-0">
              <TabsTrigger
                value="positions"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                Positions
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 py-3"
              >
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="positions" className="p-4">
              <div className="text-center text-white/60 py-8">
                No open positions
              </div>
            </TabsContent>
            <TabsContent value="orders" className="p-4">
              <div className="text-center text-white/60 py-8">
                No open orders
              </div>
            </TabsContent>
            <TabsContent value="history" className="p-4">
              <div className="text-center text-white/60 py-8">
                No trade history
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

