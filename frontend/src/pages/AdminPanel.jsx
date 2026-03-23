import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Database, Users, Cpu, Check, Save, RefreshCcw } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminPanel = () => {
  const [llmConfig, setLlmConfig] = useState({ provider: "", model: "", available_providers: {} });
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
    fetchPlantData();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API}/config/llm`);
      const data = await response.json();
      setLlmConfig(data);
      setSelectedProvider(data.provider);
      setSelectedModel(data.model);
    } catch (error) {
      console.error("Error fetching LLM config:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantData = async () => {
    try {
      const response = await fetch(`${API}/analysis/plants`);
      const data = await response.json();
      setPlantData(data.plants);
    } catch (error) {
      console.error("Error fetching plant data:", error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/config/llm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel
        })
      });
      
      if (response.ok) {
        toast.success("LLM configuration saved");
        fetchConfig();
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Settings className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="admin-panel-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-500" />
          ADMIN PANEL
        </h1>
        <p className="text-gray-500 mt-1">System configuration and management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM Configuration */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              LLM Configuration
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-6">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Current Configuration</label>
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="font-data text-white">{llmConfig.provider}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500">Model:</span>
                  <span className="font-data text-white">{llmConfig.model}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Select Provider</label>
              <select
                data-testid="llm-provider-select"
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  const models = llmConfig.available_providers?.[e.target.value];
                  if (models?.length) setSelectedModel(models[0]);
                }}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none"
              >
                {Object.keys(llmConfig.available_providers || {}).map(provider => (
                  <option key={provider} value={provider}>
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Select Model</label>
              <select
                data-testid="llm-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none"
              >
                {(llmConfig.available_providers?.[selectedProvider] || []).map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <Button
              onClick={saveConfig}
              data-testid="save-llm-config-btn"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
            >
              {saving ? (
                <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </GlassCardContent>
        </GlassCard>

        {/* Plant Comparison */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4 text-green-400" />
              Plant Comparison
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {plantData && (
              <div className="space-y-4">
                {Object.entries(plantData).map(([plantName, data]) => (
                  <div 
                    key={plantName}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <h4 className="font-medium text-white mb-3">{plantName}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Material Cost</span>
                        <div className="font-data text-lg text-white">
                          ${data.total_material_cost?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Cost/Unit</span>
                        <div className="font-data text-lg text-white">
                          ${data.cost_per_unit?.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Efficiency</span>
                        <div className={`font-data text-lg ${
                          data.efficiency_score >= 90 ? "text-green-400" : "text-amber-400"
                        }`}>
                          {data.efficiency_score?.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Inventory Days</span>
                        <div className="font-data text-lg text-white">
                          {data.inventory_days}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Material Waste</span>
                        <span className={`font-data ${
                          data.material_waste_pct <= 3 ? "text-green-400" : "text-red-400"
                        }`}>
                          {data.material_waste_pct?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Materials Overview */}
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Configured Materials
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { name: "Hot Rolled Steel", category: "Ferrous Metals" },
                { name: "Cold Rolled Steel", category: "Ferrous Metals" },
                { name: "Aluminium", category: "Non-Ferrous Metals" },
                { name: "Copper", category: "Non-Ferrous Metals" },
                { name: "Natural Rubber", category: "Polymers" },
                { name: "Synthetic Rubber", category: "Polymers" },
                { name: "ABS Plastic", category: "Polymers" },
                { name: "Polypropylene", category: "Polymers" },
                { name: "PCB Components", category: "Electronics" },
                { name: "Semiconductors", category: "Electronics" }
              ].map((mat, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-sm text-white">{mat.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{mat.category}</span>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Supplier Count */}
        <GlassCard className="lg:col-span-2">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Registered Suppliers
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: "Tata Steel", country: "India" },
                { name: "Hindalco", country: "India" },
                { name: "Aurubis AG", country: "Germany" },
                { name: "MRF Tyres", country: "India" },
                { name: "SABIC", country: "Saudi Arabia" },
                { name: "Samsung SDI", country: "South Korea" },
                { name: "JSW Steel", country: "India" },
                { name: "Codelco", country: "Chile" },
                { name: "LG Chem", country: "South Korea" },
                { name: "TSMC", country: "Taiwan" }
              ].map((sup, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-sm text-white">{sup.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{sup.country}</span>
                </div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminPanel;
