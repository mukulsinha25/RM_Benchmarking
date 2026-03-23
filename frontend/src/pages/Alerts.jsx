import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    material: "",
    alert_type: "price_above",
    threshold: ""
  });

  useEffect(() => {
    fetchAlerts();
    fetchMaterials();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API}/alerts`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
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

  const createAlert = async () => {
    if (!newAlert.material || !newAlert.threshold) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(`${API}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAlert)
      });
      const data = await response.json();
      
      if (data.alert) {
        setAlerts([...alerts, data.alert]);
        toast.success("Alert created successfully");
        setDialogOpen(false);
        setNewAlert({ material: "", alert_type: "price_above", threshold: "" });
      }
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await fetch(`${API}/alerts/${alertId}`, { method: "DELETE" });
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success("Alert deleted");
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete alert");
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case "price_above": return "Price Above";
      case "price_below": return "Price Below";
      case "change_percent": return "% Change";
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-center">
          <Bell className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading Alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="alerts-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-500" />
            ALERT MANAGEMENT
          </h1>
          <p className="text-gray-500 mt-1">Configure price alerts and notifications</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="create-alert-btn"
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0a0a] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Material</label>
                <select
                  data-testid="alert-material-select"
                  value={newAlert.material}
                  onChange={(e) => setNewAlert({ ...newAlert, material: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="">Select material</option>
                  {materials.map(mat => (
                    <option key={mat.material_id} value={mat.material_id}>
                      {mat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Alert Type</label>
                <select
                  data-testid="alert-type-select"
                  value={newAlert.alert_type}
                  onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="price_above">Price Above</option>
                  <option value="price_below">Price Below</option>
                  <option value="change_percent">% Change</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Threshold {newAlert.alert_type === "change_percent" ? "(%)" : "(USD)"}
                </label>
                <Input
                  data-testid="alert-threshold-input"
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) })}
                  placeholder="Enter threshold value"
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
              
              <Button 
                onClick={createAlert}
                data-testid="save-alert-btn"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Alerts</div>
              <div className="font-data text-2xl text-white">{alerts.length}</div>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Active Alerts</div>
              <div className="font-data text-2xl text-green-400">
                {alerts.filter(a => a.enabled).length}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Triggered Today</div>
              <div className="font-data text-2xl text-amber-400">0</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Alerts List */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Configured Alerts</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert, idx) => {
                const material = materials.find(m => m.material_id === alert.material);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    data-testid={`alert-item-${alert.id}`}
                    className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        alert.alert_type === "price_above" ? "bg-red-500/10" : "bg-green-500/10"
                      }`}>
                        {alert.alert_type === "price_above" ? (
                          <TrendingUp className="w-5 h-5 text-red-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-green-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {material?.name || alert.material}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
                            {getAlertTypeLabel(alert.alert_type)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Threshold: <span className="font-data text-white">
                            {alert.alert_type === "change_percent" ? `${alert.threshold}%` : `$${alert.threshold?.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.enabled ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                      }`}>
                        {alert.enabled ? "Active" : "Paused"}
                      </span>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        data-testid={`delete-alert-${alert.id}`}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500">No alerts configured</p>
              <p className="text-sm text-gray-600 mt-1">Create an alert to get notified about price changes</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};

export default Alerts;
