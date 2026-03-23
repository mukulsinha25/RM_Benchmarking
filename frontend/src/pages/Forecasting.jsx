import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, TrendingUp, TrendingDown, Target, Calendar, AlertCircle } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Forecasting = () => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [forecastDays, setForecastDays] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (selectedMaterial) {
      fetchForecast(selectedMaterial.material_id, parseInt(forecastDays));
      fetchHistory(selectedMaterial.material_id);
    }
  }, [selectedMaterial, forecastDays]);

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

  const fetchForecast = async (materialId, days) => {
    try {
      const response = await fetch(`${API}/materials/${materialId}/forecast?days=${days}`);
      const data = await response.json();
      setForecast(data.forecasts || []);
    } catch (error) {
      console.error("Error fetching forecast:", error);
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

  // Combine history and forecast for chart
  const combinedData = [
    ...history.slice(-14).map(h => ({
      date: new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: h.price,
      type: 'history'
    })),
    ...forecast.map(f => ({
      date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: f.predicted_price,
      upper: f.upper_bound,
      lower: f.lower_bound,
      confidence: f.confidence,
      type: 'forecast'
    }))
  ];

  // Calculate forecast summary
  const forecastSummary = forecast.length > 0 ? {
    startPrice: selectedMaterial?.current_price,
    endPrice: forecast[forecast.length - 1]?.predicted_price,
    change: ((forecast[forecast.length - 1]?.predicted_price - selectedMaterial?.current_price) / selectedMaterial?.current_price * 100),
    avgConfidence: forecast.reduce((acc, f) => acc + f.confidence, 0) / forecast.length * 100,
    minPrice: Math.min(...forecast.map(f => f.lower_bound)),
    maxPrice: Math.max(...forecast.map(f => f.upper_bound))
  } : null;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <LineChart className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Forecasts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="forecasting-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <LineChart className="w-8 h-8 text-blue-500" />
          AI PRICE FORECASTING
        </h1>
        <p className="text-gray-500 mt-1">Machine learning powered price predictions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Material Selector */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full">
            <GlassCardHeader>
              <GlassCardTitle>Select Material</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="p-0 max-h-[500px] overflow-y-auto">
              {materials.map(mat => (
                <div
                  key={mat.material_id}
                  onClick={() => setSelectedMaterial(mat)}
                  data-testid={`forecast-material-${mat.material_id}`}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b border-white/5 ${
                    selectedMaterial?.material_id === mat.material_id
                      ? "bg-blue-500/10 border-l-2 border-l-blue-500"
                      : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{mat.name}</span>
                    {mat.change_24h > 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : mat.change_24h < 0 ? (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    ) : null}
                  </div>
                  <div className="font-data text-xs text-gray-500 mt-1">
                    ${mat.current_price?.toLocaleString()} / {mat.unit}
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Forecast Chart & Analysis */}
        <div className="lg:col-span-3 space-y-6">
          {selectedMaterial && (
            <>
              {/* Forecast Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard hover={false} className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Current Price</div>
                  <div className="font-data text-xl text-white">
                    ${selectedMaterial.current_price?.toLocaleString()}
                  </div>
                </GlassCard>
                <GlassCard hover={false} className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Predicted ({forecastDays}d)</div>
                  <div className={`font-data text-xl ${
                    forecastSummary?.change > 0 ? "text-red-400" : "text-green-400"
                  }`}>
                    ${forecastSummary?.endPrice?.toLocaleString()}
                  </div>
                </GlassCard>
                <GlassCard hover={false} className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Expected Change</div>
                  <div className={`font-data text-xl flex items-center gap-1 ${
                    forecastSummary?.change > 0 ? "text-red-400" : "text-green-400"
                  }`}>
                    {forecastSummary?.change > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {forecastSummary?.change > 0 ? "+" : ""}{forecastSummary?.change?.toFixed(2)}%
                  </div>
                </GlassCard>
                <GlassCard hover={false} className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Avg Confidence</div>
                  <div className="font-data text-xl text-blue-400 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {forecastSummary?.avgConfidence?.toFixed(0)}%
                  </div>
                </GlassCard>
              </div>

              {/* Main Chart */}
              <GlassCard>
                <GlassCardHeader className="flex items-center justify-between">
                  <GlassCardTitle className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    {selectedMaterial.name} Forecast
                  </GlassCardTitle>
                  <Tabs value={forecastDays} onValueChange={setForecastDays}>
                    <TabsList className="bg-white/5">
                      <TabsTrigger value="7" className="text-xs">7 Days</TabsTrigger>
                      <TabsTrigger value="30" className="text-xs">30 Days</TabsTrigger>
                      <TabsTrigger value="90" className="text-xs">90 Days</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.1} />
                            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#666', fontSize: 10 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#666', fontSize: 10 }}
                          tickFormatter={(v) => `$${v.toLocaleString()}`}
                          domain={['auto', 'auto']}
                          width={70}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-black/90 border border-white/10 rounded-lg p-3 backdrop-blur-md">
                                  <p className="text-xs text-gray-400 mb-2">{label}</p>
                                  {data.price && (
                                    <p className="text-blue-400 text-sm">
                                      Actual: ${data.price?.toLocaleString()}
                                    </p>
                                  )}
                                  {data.predicted && (
                                    <>
                                      <p className="text-amber-400 text-sm">
                                        Predicted: ${data.predicted?.toLocaleString()}
                                      </p>
                                      <p className="text-gray-500 text-xs mt-1">
                                        Range: ${data.lower?.toLocaleString()} - ${data.upper?.toLocaleString()}
                                      </p>
                                      <p className="text-gray-500 text-xs">
                                        Confidence: {(data.confidence * 100)?.toFixed(0)}%
                                      </p>
                                    </>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Confidence interval */}
                        <Area
                          type="monotone"
                          dataKey="upper"
                          stroke="none"
                          fill="url(#colorConfidence)"
                        />
                        <Area
                          type="monotone"
                          dataKey="lower"
                          stroke="none"
                          fill="#050505"
                        />
                        {/* Historical data */}
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          fill="url(#colorHistory)"
                          dot={false}
                        />
                        {/* Forecast */}
                        <Area
                          type="monotone"
                          dataKey="predicted"
                          stroke="#F59E0B"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          fill="url(#colorForecast)"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-blue-500"></div>
                      <span className="text-xs text-gray-400">Historical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-amber-500" style={{ borderTop: '2px dashed #F59E0B' }}></div>
                      <span className="text-xs text-gray-400">Forecast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-amber-500/10 rounded"></div>
                      <span className="text-xs text-gray-400">Confidence Range</span>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Forecast Insight */}
              <GlassCard glow={forecastSummary?.change > 0 ? "red" : "green"}>
                <GlassCardContent>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      forecastSummary?.change > 0 ? "bg-red-500/10" : "bg-green-500/10"
                    }`}>
                      <AlertCircle className={`w-6 h-6 ${
                        forecastSummary?.change > 0 ? "text-red-400" : "text-green-400"
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">AI Insight</h3>
                      <p className="text-gray-400">
                        {forecastSummary?.change > 0 ? (
                          <>
                            <span className="text-red-400 font-medium">{selectedMaterial.name}</span> prices are expected to 
                            <span className="text-red-400 font-medium"> increase by {Math.abs(forecastSummary?.change)?.toFixed(1)}%</span> over 
                            the next {forecastDays} days. Consider accelerating procurement or hedging strategies.
                          </>
                        ) : (
                          <>
                            <span className="text-green-400 font-medium">{selectedMaterial.name}</span> prices are expected to 
                            <span className="text-green-400 font-medium"> decrease by {Math.abs(forecastSummary?.change)?.toFixed(1)}%</span> over 
                            the next {forecastDays} days. Consider delaying non-urgent purchases.
                          </>
                        )}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          Price range: <span className="font-data text-white">
                            ${forecastSummary?.minPrice?.toLocaleString()} - ${forecastSummary?.maxPrice?.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
