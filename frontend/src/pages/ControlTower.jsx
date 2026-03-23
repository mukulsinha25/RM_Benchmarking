import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Activity, AlertTriangle, TrendingUp, TrendingDown, 
  DollarSign, ShoppingCart, Zap, Globe, ArrowRight
} from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import MetricCard from "@/components/dashboard/MetricCard";
import PriceChart from "@/components/dashboard/PriceChart";
import { useCurrency } from "@/context/CurrencyContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const ControlTower = ({ materials, loading }) => {
  const [controlData, setControlData] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [history, setHistory] = useState([]);
  const { formatPrice, symbol } = useCurrency();

  useEffect(() => {
    fetchControlTowerData();
  }, []);

  useEffect(() => {
    if (materials && materials.length > 0 && !selectedMaterial) {
      setSelectedMaterial(materials[0]);
      fetchHistory(materials[0].material_id);
    }
  }, [materials]);

  const fetchControlTowerData = async () => {
    try {
      const response = await fetch(`${API}/control-tower`);
      const data = await response.json();
      setControlData(data);
    } catch (error) {
      console.error("Error fetching control tower data:", error);
    }
  };

  const fetchHistory = async (materialId) => {
    try {
      const response = await fetch(`${API}/materials/${materialId}/history?days=30`);
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material);
    fetchHistory(material.material_id);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Control Tower...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="control-tower-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500" />
          CONTROL TOWER
        </h1>
        <p className="text-gray-500 mt-1">Mission Control for Raw Material Intelligence</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Summary Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Materials"
            value={controlData?.summary?.total_materials || 0}
            icon={Globe}
            delay={0}
          />
          <MetricCard
            title="Risk Alerts"
            value={controlData?.summary?.active_alerts || 0}
            icon={AlertTriangle}
            delay={0.1}
          />
          <MetricCard
            title="Buy Now Signals"
            value={controlData?.summary?.buy_now_recommendations || 0}
            icon={ShoppingCart}
            delay={0.2}
          />
          <MetricCard
            title="Potential Savings"
            value={`${controlData?.summary?.potential_savings?.toFixed(1) || 0}%`}
            icon={DollarSign}
            delay={0.3}
          />
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Price Chart */}
          <motion.div variants={item} className="lg:col-span-2">
            <GlassCard className="h-full">
              <GlassCardHeader className="flex items-center justify-between">
                <GlassCardTitle>
                  {selectedMaterial?.name || "Material"} Price Trend
                </GlassCardTitle>
                <div className="flex items-center gap-2">
                  {selectedMaterial && (
                    <span className={`text-sm font-data ${
                      selectedMaterial.change_24h > 0 ? "text-green-400" : 
                      selectedMaterial.change_24h < 0 ? "text-red-400" : "text-gray-400"
                    }`}>
                      {selectedMaterial.change_24h > 0 ? "+" : ""}
                      {selectedMaterial.change_24h?.toFixed(2)}% 24h
                    </span>
                  )}
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <PriceChart 
                  data={history} 
                  height={280}
                  color={selectedMaterial?.change_24h >= 0 ? "#10B981" : "#EF4444"}
                />
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          {/* Right Column - Alerts */}
          <motion.div variants={item}>
            <GlassCard className="h-full">
              <GlassCardHeader className="flex items-center justify-between">
                <GlassCardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Risk Alerts
                </GlassCardTitle>
                <span className="text-xs text-gray-500">Live</span>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                {controlData?.risk_alerts?.length > 0 ? (
                  controlData.risk_alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        alert.severity === "high" 
                          ? "bg-red-500/10 border-red-500/20" 
                          : "bg-amber-500/10 border-amber-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{alert.material}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          alert.severity === "high" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {alert.type === "price_spike" ? (
                          <TrendingUp className="w-3 h-3 text-red-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-green-400" />
                        )}
                        <span className={`text-sm font-data ${
                          alert.change > 0 ? "text-red-400" : "text-green-400"
                        }`}>
                          {alert.change > 0 ? "+" : ""}{alert.change?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active alerts</p>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        </div>

        {/* Material Cards Grid */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-white">Material Prices</h2>
            <span className="text-xs text-gray-500">Click to view chart</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {materials?.map((material, idx) => (
              <motion.div
                key={material.material_id}
                variants={item}
                onClick={() => handleMaterialSelect(material)}
                className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
                  selectedMaterial?.material_id === material.material_id 
                    ? "border-blue-500/50 bg-blue-500/5" 
                    : "hover:border-white/20"
                }`}
                data-testid={`material-card-${material.material_id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider truncate">
                    {material.name}
                  </span>
                  {material.change_24h > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
                  ) : material.change_24h < 0 ? (
                    <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                  ) : null}
                </div>
                <div className="font-data text-lg font-bold text-white">
                  {formatPrice(material.current_price)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">/{material.unit}</span>
                  <span className={`text-xs font-data ${
                    material.change_24h > 0 ? "text-green-400" : 
                    material.change_24h < 0 ? "text-red-400" : "text-gray-500"
                  }`}>
                    {material.change_24h > 0 ? "+" : ""}{material.change_24h?.toFixed(2)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Row - News & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* News Highlights */}
          <motion.div variants={item}>
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Market News
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {controlData?.news_highlights?.slice(0, 4).map((news, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium line-clamp-1">{news.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{news.summary}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                        news.impact === "high" ? "bg-red-500/20 text-red-400" :
                        news.impact === "medium" ? "bg-amber-500/20 text-amber-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {news.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          {/* Quick Recommendations */}
          <motion.div variants={item}>
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-green-400" />
                  Quick Actions
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {controlData?.quick_recommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-white">{rec.material_name}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          {rec.action}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{rec.reason}</p>
                    {rec.potential_savings_pct > 0 && (
                      <p className="text-xs text-green-400 mt-1">
                        Potential savings: {rec.potential_savings_pct}%
                      </p>
                    )}
                  </div>
                ))}
                {(!controlData?.quick_recommendations || controlData.quick_recommendations.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No urgent recommendations</p>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ControlTower;
