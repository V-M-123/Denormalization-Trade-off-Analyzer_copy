import React from 'react';
import { motion } from 'motion/react';

/**
 * 21st.dev inspired Aurora Border Beam
 * Circulates a luminous polar cyan & emerald light beam along the border of the parent container
 */
export default function BorderBeam({
  colorFrom = '#22d3ee', // Aurora Cyan
  colorTo = '#34d399',   // Aurora Emerald
  duration = 8,
  className = ''
}) {
  return (
    <div 
      className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="absolute w-24 h-24 rounded-full blur-lg opacity-40 dark:opacity-60"
        style={{
          background: `radial-gradient(circle, ${colorFrom} 0%, ${colorTo} 60%, transparent 80%)`,
          offsetPath: 'rect(0% auto auto 0% round 1rem)',
        }}
        animate={{
          offsetDistance: ['0%', '100%'],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
