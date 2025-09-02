import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ShimmerProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

const Shimmer: React.FC<ShimmerProps> = ({ children, className, duration = 0.32 }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="shimmer-effect"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration,
          ease: 'easeOut',
        }}
      />
    </div>
  );
};

export default Shimmer;
