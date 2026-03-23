import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Clock } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import PriceChart from "@/components/dashboard/PriceChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/context/CurrencyContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PriceDashboard = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const { formatPrice, symbol, convertPrice } = useCurrency();

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedMaterial) {
      fetchHistory(selectedMaterial.material_id, parseInt(timeRange));
    }
  }, [selectedMaterial, timeRange]);

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API}/materials/prices`);
      const data = await response.json();
      setMaterials(data.materials || []);
      if (data.materials?.length > 0) {
        setSelectedMaterial(data.materials[0]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API}/materials/categories`);
      const data = await response.json();
      setCategories(data.categories || {});
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchHistory = async (materialId, days) => {
    try {
      const response = await fetch(`${API}/materials/${materialId}/history?days=${days}`);
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Price Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="price-dashboard-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          PRICE DASHBOARD
        </h1>
        <p className="text-gray-500 mt-1">Real-time commodity price tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Material List */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Materials</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-0 max-h-[600px] overflow-y-auto">
              {Object.entries(categories).map(([category, mats]) => (
                <div key={category} className="border-b border-white/5 last:border-0">
                  <div className="px-4 py-2 bg-white/[0.02]">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{category}</span>
                  </div>
                  {mats.map((mat) => {
                    const material = materials.find(m => m.material_id === mat.id);
                    if (!material) return null;
                    return (
                      <div
                        key={mat.id}
                        onClick={() => setSelectedMaterial(material)}
                        data-testid={`price-material-${mat.id}`}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          selectedMaterial?.material_id === mat.id
                            ? "bg-blue-500/10 border-l-2 border-blue-500"
                            : "hover:bg-white/[0.02] border-l-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white">{mat.name}</span>
                          {material.change_24h > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : material.change_24h < 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-data text-sm text-gray-400">
                            {formatPrice(material.current_price)}
                          </span>
                          <span className={`font-data text-xs ${
                            material.change_24h > 0 ? "text-green-400" :
                            material.change_24h < 0 ? "text-red-400" : "text-gray-500"
                          }`}>
                            {material.change_24h > 0 ? "+" : ""}{material.change_24h?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Chart & Details */}
        <div className="lg:col-span-3 space-y-6">
          {selectedMaterial && (
            <>
              {/* Price Header */}
              <GlassCard>
                <GlassCardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-heading text-2xl font-bold text-white">{selectedMaterial.name}</h2>
                      <p className="text-gray-500 text-sm">{selectedMaterial.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-data text-3xl font-bold text-white">
                        {formatPrice(selectedMaterial.current_price)}
                        <span className="text-sm text-gray-500 ml-1">/{selectedMaterial.unit}</span>
                      </div>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        selectedMaterial.change_24h > 0 ? "text-green-400" :
                        selectedMaterial.change_24h < 0 ? "text-red-400" : "text-gray-500"
                      }`}>
                        {selectedMaterial.change_24h > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : selectedMaterial.change_24h < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        <span className="font-data">
                          {selectedMaterial.change_24h > 0 ? "+" : ""}{selectedMaterial.change_24h?.toFixed(2)}%
                        </span>
                        <span className="text-gray-500 text-sm">24h</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-500">24h High</span>
                      <div className="font-data text-sm text-white mt-1">
                        {formatPrice(selectedMaterial.high_24h)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-500">24h Low</span>
                      <div className="font-data text-sm text-white mt-1">
                        {formatPrice(selectedMaterial.low_24h)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-500">7d Change</span>
                      <div className={`font-data text-sm mt-1 ${
                        selectedMaterial.change_7d > 0 ? "text-green-400" :
                        selectedMaterial.change_7d < 0 ? "text-red-400" : "text-gray-400"
                      }`}>
                        {selectedMaterial.change_7d > 0 ? "+" : ""}{selectedMaterial.change_7d?.toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-500">30d Change</span>
                      <div className={`font-data text-sm mt-1 ${
                        selectedMaterial.change_30d > 0 ? "text-green-400" :
                        selectedMaterial.change_30d < 0 ? "text-red-400" : "text-gray-400"
                      }`}>
                        {selectedMaterial.change_30d > 0 ? "+" : ""}{selectedMaterial.change_30d?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Chart */}
              <GlassCard>
                <GlassCardHeader className="flex items-center justify-between">
                  <GlassCardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    Price History
                  </GlassCardTitle>
                  <Tabs value={timeRange} onValueChange={setTimeRange}>
                    <TabsList className="bg-white/5">
                      <TabsTrigger value="7" className="text-xs">7D</TabsTrigger>
                      <TabsTrigger value="30" className="text-xs">30D</TabsTrigger>
                      <TabsTrigger value="90" className="text-xs">90D</TabsTrigger>
                      <TabsTrigger value="365" className="text-xs">1Y</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </GlassCardHeader>
                <GlassCardContent>
                  <PriceChart 
                    data={history}
                    height={400}
                    color={selectedMaterial.change_24h >= 0 ? "#10B981" : "#EF4444"}
                  />
                </GlassCardContent>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceDashboard;
