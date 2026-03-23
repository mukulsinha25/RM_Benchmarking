import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Boxes, Upload, TrendingUp, TrendingDown, Calculator, Factory } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export const BOMAnalyzer = () => {
  const [components, setComponents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [priceChange, setPriceChange] = useState([10]);
  const [impactResults, setImpactResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
    fetchMaterials();
  }, []);

  const fetchComponents = async () => {
    try {
      const response = await fetch(`${API}/bom/components`);
      const data = await response.json();
      setComponents(data.components || []);
    } catch (error) {
      console.error("Error fetching components:", error);
    }
  };

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

  const runSimulation = async () => {
    if (!selectedMaterial) return;
    
    try {
      const response = await fetch(`${API}/simulation/what-if`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: selectedMaterial.material_id,
          price_change_pct: priceChange[0]
        })
      });
      const data = await response.json();
      setImpactResults(data);
    } catch (error) {
      console.error("Error running simulation:", error);
    }
  };

  // Prepare chart data
  const componentChartData = components.map((comp, idx) => ({
    name: comp.name.length > 15 ? comp.name.substring(0, 15) + '...' : comp.name,
    fullName: comp.name,
    materials: comp.materials.length,
    plantA: comp.plant_usage?.["Plant A"] || 0,
    plantB: comp.plant_usage?.["Plant B"] || 0,
    color: COLORS[idx % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Boxes className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading BOM Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="bom-analyzer-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Boxes className="w-8 h-8 text-blue-500" />
          BOM IMPACT ANALYZER
        </h1>
        <p className="text-gray-500 mt-1">Bill of Materials cost impact simulation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* What-If Simulator */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-500" />
                What-If Simulation
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Select Material</label>
                <select
                  data-testid="bom-material-select"
                  value={selectedMaterial?.material_id || ""}
                  onChange={(e) => {
                    const mat = materials.find(m => m.material_id === e.target.value);
                    setSelectedMaterial(mat);
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none"
                >
                  {materials.map(mat => (
                    <option key={mat.material_id} value={mat.material_id}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Price Change</label>
                  <span className={`font-data text-lg ${
                    priceChange[0] > 0 ? "text-red-400" : priceChange[0] < 0 ? "text-green-400" : "text-gray-400"
                  }`}>
                    {priceChange[0] > 0 ? "+" : ""}{priceChange[0]}%
                  </span>
                </div>
                <Slider
                  data-testid="bom-price-slider"
                  value={priceChange}
                  onValueChange={setPriceChange}
                  min={-20}
                  max={20}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>-20%</span>
                  <span>0%</span>
                  <span>+20%</span>
                </div>
              </div>

              <Button 
                onClick={runSimulation}
                data-testid="run-simulation-btn"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                Run Simulation
              </Button>

              {impactResults && (
                <div className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-white/5">
                  <h4 className="text-sm font-medium text-white mb-3">Impact Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Affected Components</span>
                      <span className="font-data text-white">{impactResults.impact_summary?.affected_components}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Avg Cost Impact</span>
                      <span className={`font-data ${
                        impactResults.impact_summary?.avg_cost_impact_pct > 0 ? "text-red-400" : "text-green-400"
                      }`}>
                        {impactResults.impact_summary?.avg_cost_impact_pct > 0 ? "+" : ""}
                        {impactResults.impact_summary?.avg_cost_impact_pct?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Annual Impact</span>
                      <span className={`font-data ${
                        priceChange[0] > 0 ? "text-red-400" : "text-green-400"
                      }`}>
                        ${impactResults.impact_summary?.total_annual_impact_usd?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-400">{impactResults.recommendation}</p>
                  </div>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Components Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plant Usage Chart */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Factory className="w-4 h-4 text-green-500" />
                Plant Usage by Component
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={componentChartData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#999', fontSize: 11 }}
                      width={120}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black/90 border border-white/10 rounded-lg p-3 backdrop-blur-md">
                              <p className="text-white text-sm font-medium mb-2">{payload[0]?.payload?.fullName}</p>
                              <p className="text-blue-400 text-xs">Plant A: {payload[0]?.value?.toLocaleString()} units</p>
                              <p className="text-green-400 text-xs">Plant B: {payload[1]?.value?.toLocaleString()} units</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="plantA" name="Plant A" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="plantB" name="Plant B" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-xs text-gray-400">Plant A</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-xs text-gray-400">Plant B</span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Component Details */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Component Material Mapping</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {components.map((comp, idx) => (
                  <div
                    key={comp.id}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      ></div>
                      <span className="text-sm font-medium text-white">{comp.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {comp.materials.map(mat => (
                        <span 
                          key={mat.id}
                          className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400"
                        >
                          {mat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Impact Results Table */}
          {impactResults?.component_impacts && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Detailed Impact Analysis</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Cost Impact</th>
                      <th>Plant A Usage</th>
                      <th>Plant B Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impactResults.component_impacts.map((impact, idx) => (
                      <tr key={idx}>
                        <td className="text-white">{impact.component}</td>
                        <td className={`font-data ${
                          impact.total_impact_pct > 0 ? "text-red-400" : "text-green-400"
                        }`}>
                          {impact.total_impact_pct > 0 ? "+" : ""}{impact.total_impact_pct?.toFixed(2)}%
                        </td>
                        <td className="font-data text-gray-400">
                          {impact.plant_usage?.["Plant A"]?.toLocaleString() || "-"}
                        </td>
                        <td className="font-data text-gray-400">
                          {impact.plant_usage?.["Plant B"]?.toLocaleString() || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default BOMAnalyzer;
