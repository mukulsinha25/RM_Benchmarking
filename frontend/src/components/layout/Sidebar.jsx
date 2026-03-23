import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Boxes, 
  LineChart, 
  ShoppingCart,
  Users,
  Bell,
  Newspaper,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Control Tower" },
  { path: "/prices", icon: TrendingUp, label: "Price Dashboard" },
  { path: "/bom", icon: Boxes, label: "BOM Analyzer" },
  { path: "/forecasting", icon: LineChart, label: "AI Forecasting" },
  { path: "/procurement", icon: ShoppingCart, label: "Procurement" },
  { path: "/suppliers", icon: Users, label: "Suppliers" },
  { path: "/alerts", icon: Bell, label: "Alerts" },
  { path: "/insights", icon: Newspaper, label: "Market Insights" },
  { path: "/chat", icon: MessageSquare, label: "AI Assistant" },
  { path: "/admin", icon: Settings, label: "Admin" },
];

export const Sidebar = ({ collapsed, onToggle }) => {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      className="fixed left-0 top-10 h-[calc(100vh-40px)] bg-[#0A0A0A] border-r border-white/5 z-40 flex flex-col"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <Activity className="w-8 h-8 text-blue-500 flex-shrink-0" />
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="ml-3"
          >
            <h1 className="font-heading font-bold text-lg text-white tracking-wide">RMIE</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Intelligence Engine</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        data-testid="sidebar-toggle"
        className="absolute -right-3 top-20 w-6 h-6 bg-[#1a1a1a] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-600"
          >
            <p>v1.0.0 • Live Data</p>
            <p className="flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full pulse-live"></span>
              <span>Connected</span>
            </p>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
