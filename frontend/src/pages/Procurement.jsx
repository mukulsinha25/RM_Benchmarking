import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, TrendingUp, TrendingDown, ArrowRight, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/context/CurrencyContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Procurement = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`${API}/procurement/recommendations`);
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecs = filter === "all" 
    ? recommendations 
    : recommendations.filter(r => r.action.toLowerCase().replace(" ", "_") === filter);

  const getActionIcon = (action) => {
    switch (action) {
      case "BUY NOW": return <CheckCircle className="w-4 h-4" />;
      case "WAIT": return <Clock className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "BUY NOW": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "WAIT": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-amber-500/20 text-amber-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Recommendations...</p>
        </div>
      </div>
    );
  }

  // Summary stats
  const buyNowCount = recommendations.filter(r => r.action === "BUY NOW").length;
  const waitCount = recommendations.filter(r => r.action === "WAIT").length;
  const monitorCount = recommendations.filter(r => r.action === "MONITOR").length;
  const totalSavings = recommendations
    .filter(r => r.action === "BUY NOW")
    .reduce((acc, r) => acc + (r.potential_savings_pct || 0), 0);

  return (
    <div className="p-6" data-testid="procurement-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-500" />
          PROCUREMENT RECOMMENDATIONS
        </h1>
        <p className="text-gray-500 mt-1">AI-powered sourcing decisions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <GlassCard 
          className={`p-4 cursor-pointer ${filter === 'buy_now' ? 'border-green-500/50' : ''}`}
          onClick={() => setFilter(filter === 'buy_now' ? 'all' : 'buy_now')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Buy Now</div>
              <div className="font-data text-2xl text-green-400">{buyNowCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard 
          className={`p-4 cursor-pointer ${filter === 'wait' ? 'border-blue-500/50' : ''}`}
          onClick={() => setFilter(filter === 'wait' ? 'all' : 'wait')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Wait</div>
              <div className="font-data text-2xl text-blue-400">{waitCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard 
          className={`p-4 cursor-pointer ${filter === 'monitor' ? 'border-amber-500/50' : ''}`}
          onClick={() => setFilter(filter === 'monitor' ? 'all' : 'monitor')}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Monitor</div>
              <div className="font-data text-2xl text-amber-400">{monitorCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Potential Savings</div>
              <div className="font-data text-2xl text-white">{totalSavings.toFixed(1)}%</div>
            </div>
            <div className="p-2 rounded-lg bg-white/5">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recommendations List */}
      <GlassCard>
        <GlassCardHeader className="flex items-center justify-between">
          <GlassCardTitle>
            {filter === "all" ? "All Recommendations" : `${filter.replace("_", " ").toUpperCase()} Recommendations`}
          </GlassCardTitle>
          {filter !== "all" && (
            <button 
              onClick={() => setFilter("all")}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Clear filter
            </button>
          )}
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <div className="divide-y divide-white/5">
            {filteredRecs.map((rec, idx) => (
              <motion.div
                key={rec.material_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                data-testid={`recommendation-${rec.material_id}`}
                className="p-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white">{rec.material_name}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${getActionColor(rec.action)}`}>
                        {getActionIcon(rec.action)}
                        {rec.action}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getUrgencyColor(rec.urgency)}`}>
                        {rec.urgency} urgency
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">{rec.reason}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Current Price: </span>
                        <span className="font-data text-white">{formatPrice(rec.current_price)}/{rec.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Suggested Qty: </span>
                        <span className="font-data text-white">{rec.suggested_quantity?.toLocaleString()} {rec.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Best Supplier: </span>
                        <span className="text-blue-400">{rec.best_supplier}</span>
                      </div>
                      {rec.potential_savings_pct > 0 && (
                        <div>
                          <span className="text-gray-500">Potential Savings: </span>
                          <span className="text-green-400">{rec.potential_savings_pct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};

export default Procurement;
