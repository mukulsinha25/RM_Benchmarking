import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Newspaper, Globe, TrendingUp, TrendingDown, AlertCircle, ExternalLink } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const MarketInsights = () => {
  const [news, setNews] = useState([]);
  const [costDrivers, setCostDrivers] = useState(null);
  const [tradeFlows, setTradeFlows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [newsRes, costRes, tradeRes] = await Promise.all([
        fetch(`${API}/news`),
        fetch(`${API}/analysis/cost-drivers`),
        fetch(`${API}/analysis/trade-flows`)
      ]);
      
      const newsData = await newsRes.json();
      const costData = await costRes.json();
      const tradeData = await tradeRes.json();
      
      setNews(newsData.news || []);
      setCostDrivers(costData.cost_drivers || null);
      setTradeFlows(tradeData.trade_flows || []);
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case "bullish": return "text-red-400";
      case "bearish": return "text-green-400";
      default: return "text-gray-400";
    }
  };

  const getImpactBadge = (impact) => {
    switch (impact) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-amber-500/20 text-amber-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Newspaper className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Market Insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="market-insights-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-blue-500" />
          MARKET INSIGHTS
        </h1>
        <p className="text-gray-500 mt-1">Global news and market analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Feed */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Global Market News
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {news.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  data-testid={`news-item-${item.id}`}
                  className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${getImpactBadge(item.impact)}`}>
                      {item.impact}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{item.summary}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{item.source}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs flex items-center gap-1 ${getSentimentColor(item.sentiment)}`}>
                        {item.sentiment === "bullish" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : item.sentiment === "bearish" ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {item.sentiment}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {item.affected_materials?.map(mat => (
                        <span 
                          key={mat}
                          className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400"
                        >
                          {mat.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Sidebar - Cost Drivers & Trade Flows */}
        <div className="space-y-6">
          {/* Cost Drivers */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Cost Drivers</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {costDrivers && Object.entries(costDrivers).map(([key, data]) => (
                <div key={key} className="p-3 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 capitalize">
                      {key.replace("_", " ")}
                    </span>
                    <span className="font-data text-white">{data.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={`${
                      data.trend === "increasing" ? "text-red-400" :
                      data.trend === "decreasing" ? "text-green-400" : "text-gray-500"
                    }`}>
                      {data.trend}
                    </span>
                    <span className={`font-data ${
                      data.change_30d > 0 ? "text-red-400" : "text-green-400"
                    }`}>
                      {data.change_30d > 0 ? "+" : ""}{data.change_30d}%
                    </span>
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>

          {/* Trade Flows Summary */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Trade Flows</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              {tradeFlows.slice(0, 6).map(flow => (
                <div 
                  key={flow.code}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(flow.code)}</span>
                    <div>
                      <span className="text-sm text-white">{flow.name}</span>
                      <span className={`text-xs ml-2 ${
                        flow.type === "exporter" ? "text-green-400" : "text-blue-400"
                      }`}>
                        {flow.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-data text-sm ${
                      flow.avg_price_deviation < 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {flow.avg_price_deviation > 0 ? "+" : ""}{flow.avg_price_deviation?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// Helper function for country flags
const getCountryFlag = (code) => {
  const flags = {
    CN: "🇨🇳", IN: "🇮🇳", JP: "🇯🇵", DE: "🇩🇪", 
    US: "🇺🇸", KR: "🇰🇷", BR: "🇧🇷", AU: "🇦🇺"
  };
  return flags[code] || "🌍";
};

export default MarketInsights;
