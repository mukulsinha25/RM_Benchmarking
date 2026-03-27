import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Clock, ChevronRight, ChevronLeft, Layers } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import PriceChart from "@/components/dashboard/PriceChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PriceDashboard = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState({});
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [grades, setGrades] = useState([]);
  const [history, setHistory] = useState([]);
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("materials"); // "materials" or "grades"
  const { formatPrice, symbol, convertPrice } = useCurrency();

  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedMaterial && viewMode === "materials") {
      fetchHistory(selectedMaterial.material_id, parseInt(timeRange));
    }
  }, [selectedMaterial, timeRange, viewMode]);

  useEffect(() => {
    if (selectedMaterial && viewMode === "grades") {
      fetchGrades(selectedMaterial.material_id);
    }
  }, [selectedMaterial, viewMode]);

  useEffect(() => {
    if (selectedGrade && viewMode === "grades") {
      fetchGradeHistory(selectedMaterial.material_id, selectedGrade.grade_id, parseInt(timeRange));
    }
  }, [selectedGrade, timeRange, viewMode]);

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

  const fetchGrades = async (materialId) => {
    try {
      const response = await fetch(`${API}/materials/${materialId}/grades`);
      const data = await response.json();
      setGrades(data.grades || []);
      if (data.grades?.length > 0) {
        setSelectedGrade(data.grades[0]);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const fetchGradeHistory = async (materialId, gradeId, days) => {
    try {
      const response = await fetch(`${API}/materials/${materialId}/grades/${gradeId}/history?days=${days}`);
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching grade history:", error);
    }
  };

  const handleMaterialClick = (material) => {
    setSelectedMaterial(material);
    if (viewMode === "grades") {
      fetchGrades(material.material_id);
    }
  };

  const handleDrillDown = () => {
    setViewMode("grades");
    if (selectedMaterial) {
      fetchGrades(selectedMaterial.material_id);
    }
  };

  const handleBackToMaterials = () => {
    setViewMode("materials");
    setSelectedGrade(null);
    if (selectedMaterial) {
      fetchHistory(selectedMaterial.material_id, parseInt(timeRange));
    }
  };

  const currentItem = viewMode === "grades" && selectedGrade ? selectedGrade : selectedMaterial;

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
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mt-4 text-sm">
          <button 
            onClick={handleBackToMaterials}
            className={`${viewMode === "materials" ? "text-blue-400" : "text-gray-500 hover:text-white"} transition-colors`}
          >
            Materials
          </button>
          {viewMode === "grades" && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <span className="text-blue-400">{selectedMaterial?.name} Grades</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Materials or Grades List */}
        <div className="lg:col-span-1 space-y-4">
          <AnimatePresence mode="wait">
            {viewMode === "materials" ? (
              <motion.div
                key="materials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      Materials
                    </GlassCardTitle>
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
                              onClick={() => handleMaterialClick(material)}
                              data-testid={`price-material-${mat.id}`}
                              className={`px-4 py-3 cursor-pointer transition-colors ${
                                selectedMaterial?.material_id === mat.id
                                  ? "bg-blue-500/10 border-l-2 border-blue-500"
                                  : "hover:bg-white/[0.02] border-l-2 border-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white">{mat.name}</span>
                                <div className="flex items-center gap-2">
                                  {material.change_24h > 0 ? (
                                    <TrendingUp className="w-3 h-3 text-green-400" />
                                  ) : material.change_24h < 0 ? (
                                    <TrendingDown className="w-3 h-3 text-red-400" />
                                  ) : null}
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                </div>
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
              </motion.div>
            ) : (
              <motion.div
                key="grades"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <GlassCard>
                  <GlassCardHeader>
                    <div className="flex items-center justify-between">
                      <GlassCardTitle className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        {selectedMaterial?.name} Grades
                      </GlassCardTitle>
                      <button 
                        onClick={handleBackToMaterials}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="p-0 max-h-[600px] overflow-y-auto">
                    {grades.map((grade) => (
                      <div
                        key={grade.grade_id}
                        onClick={() => setSelectedGrade(grade)}
                        data-testid={`grade-${grade.grade_id}`}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-white/5 last:border-0 ${
                          selectedGrade?.grade_id === grade.grade_id
                            ? "bg-amber-500/10 border-l-2 border-amber-500"
                            : "hover:bg-white/[0.02] border-l-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-white font-medium">{grade.name}</span>
                            <p className="text-xs text-gray-500 mt-0.5">{grade.description}</p>
                          </div>
                          {grade.change_24h > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : grade.change_24h < 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-data text-sm text-gray-400">
                            {formatPrice(grade.current_price)}
                          </span>
                          <span className={`font-data text-xs ${
                            grade.change_24h > 0 ? "text-green-400" :
                            grade.change_24h < 0 ? "text-red-400" : "text-gray-500"
                          }`}>
                            {grade.change_24h > 0 ? "+" : ""}{grade.change_24h?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - Chart & Details */}
        <div className="lg:col-span-3 space-y-6">
          {currentItem && (
            <>
              {/* Price Header */}
              <GlassCard>
                <GlassCardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="font-heading text-2xl font-bold text-white">
                          {viewMode === "grades" && selectedGrade ? selectedGrade.name : selectedMaterial?.name}
                        </h2>
                        {viewMode === "materials" && (
                          <Button
                            onClick={handleDrillDown}
                            variant="outline"
                            size="sm"
                            data-testid="view-grades-btn"
                            className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          >
                            <Layers className="w-3 h-3 mr-1" />
                            View Grades
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        {viewMode === "grades" && selectedGrade 
                          ? selectedGrade.description 
                          : selectedMaterial?.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-data text-3xl font-bold text-white">
                        {formatPrice(viewMode === "grades" && selectedGrade 
                          ? selectedGrade.current_price 
                          : selectedMaterial?.current_price)}
                        <span className="text-sm text-gray-500 ml-1">
                          /{viewMode === "grades" && selectedGrade 
                            ? selectedGrade.unit 
                            : selectedMaterial?.unit}
                        </span>
                      </div>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        (viewMode === "grades" && selectedGrade ? selectedGrade.change_24h : selectedMaterial?.change_24h) > 0 
                          ? "text-green-400" 
                          : (viewMode === "grades" && selectedGrade ? selectedGrade.change_24h : selectedMaterial?.change_24h) < 0 
                            ? "text-red-400" 
                            : "text-gray-500"
                      }`}>
                        {(viewMode === "grades" && selectedGrade ? selectedGrade.change_24h : selectedMaterial?.change_24h) > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (viewMode === "grades" && selectedGrade ? selectedGrade.change_24h : selectedMaterial?.change_24h) < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        <span className="font-data">
                          {(viewMode === "grades" && selectedGrade ? selectedGrade.change_24h : selectedMaterial?.change_24h) > 0 ? "+" : ""}
                          {(viewMode === "grades" && selectedGrade ? selectedGrade.change_24h : selectedMaterial?.change_24h)?.toFixed(2)}%
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
                        {formatPrice(viewMode === "grades" && selectedGrade 
                          ? selectedGrade.high_24h 
                          : selectedMaterial?.high_24h)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-500">24h Low</span>
                      <div className="font-data text-sm text-white mt-1">
                        {formatPrice(viewMode === "grades" && selectedGrade 
                          ? selectedGrade.low_24h 
                          : selectedMaterial?.low_24h)}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-500">7d Change</span>
                      <div className={`font-data text-sm mt-1 ${
                        (viewMode === "grades" && selectedGrade ? selectedGrade.change_7d : selectedMaterial?.change_7d) > 0 
                          ? "text-green-400" 
                          : (viewMode === "grades" && selectedGrade ? selectedGrade.change_7d : selectedMaterial?.change_7d) < 0 
                            ? "text-red-400" 
                            : "text-gray-400"
                      }`}>
                        {(viewMode === "grades" && selectedGrade ? selectedGrade.change_7d : selectedMaterial?.change_7d) > 0 ? "+" : ""}
                        {(viewMode === "grades" && selectedGrade ? selectedGrade.change_7d : selectedMaterial?.change_7d)?.toFixed(2)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-500">30d Change</span>
                      <div className={`font-data text-sm mt-1 ${
                        (viewMode === "grades" && selectedGrade ? selectedGrade.change_30d : selectedMaterial?.change_30d) > 0 
                          ? "text-green-400" 
                          : (viewMode === "grades" && selectedGrade ? selectedGrade.change_30d : selectedMaterial?.change_30d) < 0 
                            ? "text-red-400" 
                            : "text-gray-400"
                      }`}>
                        {(viewMode === "grades" && selectedGrade ? selectedGrade.change_30d : selectedMaterial?.change_30d) > 0 ? "+" : ""}
                        {(viewMode === "grades" && selectedGrade ? selectedGrade.change_30d : selectedMaterial?.change_30d)?.toFixed(2)}%
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
                    color={(viewMode === "grades" && selectedGrade ? selectedGrade.change_24h : selectedMaterial?.change_24h) >= 0 ? "#10B981" : "#EF4444"}
                  />
                </GlassCardContent>
              </GlassCard>

              {/* Grade Comparison (when in grades view) */}
              {viewMode === "grades" && grades.length > 1 && (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle>Grade Comparison</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Grade</th>
                            <th>Price</th>
                            <th>24h</th>
                            <th>7d</th>
                            <th>30d</th>
                            <th>Premium</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map(grade => (
                            <tr 
                              key={grade.grade_id}
                              onClick={() => setSelectedGrade(grade)}
                              className={`cursor-pointer ${selectedGrade?.grade_id === grade.grade_id ? "bg-amber-500/5" : ""}`}
                            >
                              <td>
                                <div>
                                  <span className="text-white font-medium">{grade.name}</span>
                                  <p className="text-xs text-gray-500">{grade.description}</p>
                                </div>
                              </td>
                              <td className="font-data text-white">{formatPrice(grade.current_price)}</td>
                              <td className={`font-data ${grade.change_24h > 0 ? "text-green-400" : grade.change_24h < 0 ? "text-red-400" : "text-gray-400"}`}>
                                {grade.change_24h > 0 ? "+" : ""}{grade.change_24h?.toFixed(2)}%
                              </td>
                              <td className={`font-data ${grade.change_7d > 0 ? "text-green-400" : grade.change_7d < 0 ? "text-red-400" : "text-gray-400"}`}>
                                {grade.change_7d > 0 ? "+" : ""}{grade.change_7d?.toFixed(2)}%
                              </td>
                              <td className={`font-data ${grade.change_30d > 0 ? "text-green-400" : grade.change_30d < 0 ? "text-red-400" : "text-gray-400"}`}>
                                {grade.change_30d > 0 ? "+" : ""}{grade.change_30d?.toFixed(2)}%
                              </td>
                              <td className="font-data text-amber-400">
                                {grade.price_modifier > 1 ? "+" : ""}{((grade.price_modifier - 1) * 100).toFixed(0)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceDashboard;
