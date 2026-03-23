import { motion } from "framer-motion";

export const GlassCard = ({ 
  children, 
  className = "", 
  hover = true,
  glow = null,
  ...props 
}) => {
  const glowClasses = {
    blue: "hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]",
    green: "hover:shadow-[0_0_30px_rgba(57,255,20,0.15)]",
    red: "hover:shadow-[0_0_30px_rgba(255,0,60,0.15)]",
    amber: "hover:shadow-[0_0_30px_rgba(255,215,0,0.15)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-[#0f0f0f]/60 backdrop-blur-xl border border-white/[0.08] rounded-xl overflow-hidden
        ${hover ? "hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-0.5" : ""}
        ${glow ? glowClasses[glow] : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const GlassCardHeader = ({ children, className = "" }) => (
  <div className={`px-5 py-4 border-b border-white/5 ${className}`}>
    {children}
  </div>
);

export const GlassCardContent = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>
    {children}
  </div>
);

export const GlassCardTitle = ({ children, className = "" }) => (
  <h3 className={`font-heading font-semibold text-white tracking-wide ${className}`}>
    {children}
  </h3>
);

export default GlassCard;
