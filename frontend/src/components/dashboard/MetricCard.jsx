import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

export const MetricCard = ({ 
  title, 
  value, 
  change, 
  unit = "", 
  icon: Icon,
  trend = null,
  delay = 0 
}) => {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="glass-card glass-card-hover p-5"
      data-testid={`metric-${title?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-400" />
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="font-data text-2xl font-bold text-white">
            {value}
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </div>
          
          {change !== undefined && (
            <div
              className={`flex items-center gap-1 mt-1 text-sm font-data ${
                isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-gray-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : isNegative ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>
                {isPositive ? "+" : ""}{change?.toFixed(2)}%
              </span>
              <span className="text-gray-600 text-xs ml-1">24h</span>
            </div>
          )}
        </div>
        
        {trend && (
          <div className="h-10 w-16">
            {/* Mini sparkline placeholder */}
            <svg viewBox="0 0 64 40" className="w-full h-full">
              <path
                d={trend}
                fill="none"
                stroke={isPositive ? "#39FF14" : isNegative ? "#FF003C" : "#666"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
