import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "@/components/layout/Sidebar";
import ControlTower from "@/pages/ControlTower";
import PriceDashboard from "@/pages/PriceDashboard";
import BOMAnalyzer from "@/pages/BOMAnalyzer";
import Forecasting from "@/pages/Forecasting";
import Procurement from "@/pages/Procurement";
import SupplierIntelligence from "@/pages/SupplierIntelligence";
import Alerts from "@/pages/Alerts";
import MarketInsights from "@/pages/MarketInsights";
import AIChat from "@/pages/AIChat";
import AdminPanel from "@/pages/AdminPanel";
import TickerTape from "@/components/dashboard/TickerTape";
import { CurrencyProvider } from "@/context/CurrencyContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await fetch(`${API}/materials/prices`);
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
    const interval = setInterval(fetchMaterials, 30000);
    return () => clearInterval(interval);
  }, [fetchMaterials]);

  return (
    <CurrencyProvider>
      <div className="App min-h-screen bg-[#050505]" data-testid="app-root">
        <BrowserRouter>
          <Toaster position="top-right" theme="dark" />
          
          {/* Ticker Tape */}
          <TickerTape materials={materials} />
          
          <div className="flex">
            {/* Sidebar */}
            <Sidebar 
              collapsed={sidebarCollapsed} 
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
            
            {/* Main Content */}
            <main 
              className={`flex-1 min-h-screen transition-all duration-300 ${
                sidebarCollapsed ? 'ml-16' : 'ml-64'
              } pt-10`}
            >
              <AnimatePresence mode="wait">
                <Routes>
                  <Route 
                    path="/" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ControlTower materials={materials} loading={loading} />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/prices" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PriceDashboard />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/bom" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <BOMAnalyzer />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/forecasting" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Forecasting />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/procurement" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Procurement />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/suppliers" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SupplierIntelligence />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/alerts" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Alerts />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/insights" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MarketInsights />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/chat" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AIChat />
                      </motion.div>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AdminPanel />
                      </motion.div>
                    } 
                  />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
        </BrowserRouter>
      </div>
    </CurrencyProvider>
  );
}

export default App;
