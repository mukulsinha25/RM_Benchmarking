import { createContext, useContext, useState, useCallback } from "react";

const CurrencyContext = createContext();

const CURRENCY_SYMBOLS = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£"
};

const EXCHANGE_RATES = {
  USD: 1,
  INR: 83.25,
  EUR: 0.92,
  GBP: 0.79
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("USD");

  const convertPrice = useCallback((priceInUSD) => {
    if (!priceInUSD) return 0;
    return priceInUSD * EXCHANGE_RATES[currency];
  }, [currency]);

  const formatPrice = useCallback((priceInUSD, showSymbol = true) => {
    if (!priceInUSD) return showSymbol ? `${CURRENCY_SYMBOLS[currency]}0` : "0";
    const converted = priceInUSD * EXCHANGE_RATES[currency];
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return showSymbol ? `${CURRENCY_SYMBOLS[currency]}${formatted}` : formatted;
  }, [currency]);

  const symbol = CURRENCY_SYMBOLS[currency];

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      convertPrice, 
      formatPrice, 
      symbol,
      currencies: Object.keys(CURRENCY_SYMBOLS)
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

export default CurrencyContext;
