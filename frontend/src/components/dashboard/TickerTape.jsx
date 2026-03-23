import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export const TickerTape = ({ materials }) => {
  const { currency, setCurrency, formatPrice, currencies } = useCurrency();

  if (!materials || materials.length === 0) return null;

  // Double the array for seamless loop
  const doubledMaterials = [...materials, ...materials];

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-10 bg-[#0a0a0a] border-b border-white/5 z-50 overflow-hidden flex"
      data-testid="ticker-tape"
    >
      {/* Currency Selector */}
      <div className="flex items-center gap-2 px-4 border-r border-white/10 bg-[#0a0a0a] z-10 flex-shrink-0">
        <DollarSign className="w-3 h-3 text-gray-500" />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          data-testid="currency-selector"
          className="bg-transparent text-xs font-data text-blue-400 border-none outline-none cursor-pointer hover:text-blue-300"
        >
          {currencies.map(curr => (
            <option key={curr} value={curr} className="bg-[#0a0a0a] text-white">
              {curr}
            </option>
          ))}
        </select>
      </div>

      {/* Ticker Content */}
      <div className="flex-1 overflow-hidden">
        <div className="ticker-tape flex items-center h-full whitespace-nowrap">
          {doubledMaterials.map((material, index) => (
            <div
              key={`${material.material_id}-${index}`}
              className="flex items-center gap-3 px-6 border-r border-white/5"
            >
              <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
                {material.name}
              </span>
              <span className="font-data text-sm text-white">
                {formatPrice(material.current_price)}
              </span>
              <span className="text-xs text-gray-500">
                /{material.unit}
              </span>
              <span
                className={`flex items-center gap-1 text-xs font-data ${
                  material.change_24h > 0
                    ? "text-green-400"
                    : material.change_24h < 0
                    ? "text-red-400"
                    : "text-gray-500"
                }`}
              >
                {material.change_24h > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : material.change_24h < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {material.change_24h > 0 ? "+" : ""}
                {material.change_24h?.toFixed(2) || '0.00'}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TickerTape;
