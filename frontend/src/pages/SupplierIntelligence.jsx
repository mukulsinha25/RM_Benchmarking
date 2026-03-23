import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Star, Globe, Clock, TrendingDown, TrendingUp, Award } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import { Progress } from "@/components/ui/progress";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SupplierIntelligence = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialSuppliers, setMaterialSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (selectedMaterial) {
      fetchMaterialSuppliers(selectedMaterial.material_id);
    }
  }, [selectedMaterial]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API}/suppliers`);
      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API}/materials/prices`);
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchMaterialSuppliers = async (materialId) => {
    try {
      const response = await fetch(`${API}/suppliers/${materialId}`);
      const data = await response.json();
      setMaterialSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Error fetching material suppliers:", error);
    }
  };

  const getReliabilityColor = (score) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-amber-400";
    return "text-red-400";
  };

  const getReliabilityBg = (score) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-amber-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Users className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Supplier Data...</p>
        </div>
      </div>
    );
  }

  // Sort suppliers by reliability
  const topSuppliers = [...suppliers].sort((a, b) => b.reliability_score - a.reliability_score).slice(0, 5);

  return (
    <div className="p-6" data-testid="supplier-intelligence-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          SUPPLIER INTELLIGENCE
        </h1>
        <p className="text-gray-500 mt-1">Supplier benchmarking and comparison</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Suppliers */}
        <div className="lg:col-span-1">
          <GlassCard className="h-full">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top Suppliers
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              {topSuppliers.map((supplier, idx) => (
                <div
                  key={supplier.id}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? "bg-amber-500 text-black" :
                        idx === 1 ? "bg-gray-400 text-black" :
                        idx === 2 ? "bg-amber-700 text-white" :
                        "bg-white/10 text-gray-400"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-white">{supplier.name}</span>
                    </div>
                    <span className={`font-data text-sm ${getReliabilityColor(supplier.reliability_score)}`}>
                      {supplier.reliability_score}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="w-3 h-3" />
                    {supplier.country}
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* All Suppliers Table */}
        <div className="lg:col-span-2">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>All Suppliers</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Country</th>
                    <th>Reliability</th>
                    <th>Price Score</th>
                    <th>Lead Time</th>
                    <th>Materials</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map(supplier => (
                    <tr key={supplier.id} data-testid={`supplier-row-${supplier.id}`}>
                      <td>
                        <span className="text-white font-medium">{supplier.name}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Globe className="w-3 h-3" />
                          {supplier.country}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={supplier.reliability_score} 
                            className="w-16 h-1.5"
                          />
                          <span className={`font-data text-sm ${getReliabilityColor(supplier.reliability_score)}`}>
                            {supplier.reliability_score}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-data text-sm text-gray-400">
                          {supplier.price_competitiveness?.toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span className="font-data">{supplier.lead_time_days}d</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {supplier.materials?.slice(0, 2).map(mat => (
                            <span 
                              key={mat}
                              className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400"
                            >
                              {mat.replace("_", " ")}
                            </span>
                          ))}
                          {supplier.materials?.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{supplier.materials.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* Material-wise Comparison */}
      <div className="mt-6">
        <GlassCard>
          <GlassCardHeader className="flex items-center justify-between">
            <GlassCardTitle>Compare Suppliers by Material</GlassCardTitle>
            <select
              data-testid="supplier-material-select"
              value={selectedMaterial?.material_id || ""}
              onChange={(e) => {
                const mat = materials.find(m => m.material_id === e.target.value);
                setSelectedMaterial(mat);
              }}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none"
            >
              <option value="">Select a material</option>
              {materials.map(mat => (
                <option key={mat.material_id} value={mat.material_id}>
                  {mat.name}
                </option>
              ))}
            </select>
          </GlassCardHeader>
          <GlassCardContent>
            {selectedMaterial && materialSuppliers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materialSuppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{supplier.name}</h4>
                      <div className={`flex items-center gap-1 text-xs ${
                        supplier.avg_price_deviation < 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {supplier.avg_price_deviation < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {supplier.avg_price_deviation > 0 ? "+" : ""}{supplier.avg_price_deviation?.toFixed(1)}%
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Reliability</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getReliabilityBg(supplier.reliability_score)}`}
                              style={{ width: `${supplier.reliability_score}%` }}
                            />
                          </div>
                          <span className={`font-data ${getReliabilityColor(supplier.reliability_score)}`}>
                            {supplier.reliability_score}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Price Score</span>
                        <span className="font-data text-gray-300">{supplier.price_competitiveness?.toFixed(1)}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Lead Time</span>
                        <span className="font-data text-gray-300">{supplier.lead_time_days} days</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 text-xs text-gray-500">
                      <Globe className="w-3 h-3" />
                      {supplier.country}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a material to compare suppliers</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
};

export default SupplierIntelligence;
