import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";
import { useCurrency } from "@/context/CurrencyContext";

export const PriceChart = ({ 
  data, 
  height = 200, 
  color = "#3B82F6",
  showAxis = true,
  gradient = true 
}) => {
  const { formatPrice, convertPrice, symbol } = useCurrency();

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  // Convert prices in data
  const convertedData = data.map(item => ({
    ...item,
    price: item.price ? convertPrice(item.price) : item.price,
    predicted: item.predicted ? convertPrice(item.predicted) : item.predicted,
    upper: item.upper ? convertPrice(item.upper) : item.upper,
    lower: item.lower ? convertPrice(item.lower) : item.lower,
  }));

  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/10 rounded-lg p-3 backdrop-blur-md shadow-xl">
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="font-data text-white">
            {symbol}{payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={convertedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis && (
            <>
              <XAxis 
                dataKey="timestamp" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 10 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#666', fontSize: 10 }}
                tickFormatter={(value) => `${symbol}${value.toLocaleString()}`}
                domain={['auto', 'auto']}
                width={70}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fill={gradient ? `url(#${gradientId})` : "none"}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default PriceChart;
