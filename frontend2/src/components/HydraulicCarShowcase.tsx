import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CarModel3D } from "./CarModel3D";

export function HydraulicCarShowcase() {
  const [isLifted, setIsLifted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Trigger lift animation after component mounts
    const timer = setTimeout(() => {
      setIsLifted(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
      {/* Ambient Red Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[400px] bg-red-600 opacity-20 blur-[120px] rounded-full" />
      </div>

      {/* Hydraulic Lift Platform */}
      <motion.div
        className="relative"
        initial={{ y: 300, opacity: 0 }}
        animate={{ 
          y: isLifted ? 0 : 300,
          opacity: isLifted ? 1 : 0
        }}
        transition={{ 
          duration: 2,
          ease: [0.43, 0.13, 0.23, 0.96]
        }}
      >
        {/* Platform Base */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent"
          animate={{
            opacity: isLifted ? [0.3, 0.6, 0.3] : 0,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Hydraulic Cylinders */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-48 pointer-events-none">
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={i}
              className="w-4 bg-gradient-to-b from-gray-700 to-gray-900 rounded-t"
              initial={{ height: 0 }}
              animate={{ height: isLifted ? 120 : 0 }}
              transition={{ 
                duration: 2,
                ease: [0.43, 0.13, 0.23, 0.96]
              }}
            />
          ))}
        </div>

        {/* Interactive 3D Car Model Container */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLifted ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* 3D Car Model */}
          <CarModel3D 
            setIsDragging={setIsDragging}
            isLifted={isLifted}
          />

          {/* Tire Glow Effects */}
          <motion.div
            className="absolute bottom-[25%] left-[20%] w-24 h-24 bg-white rounded-full opacity-10 blur-xl pointer-events-none"
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-[25%] right-[20%] w-24 h-24 bg-white rounded-full opacity-10 blur-xl pointer-events-none"
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          />
        </motion.div>

        {/* Ground Shadow */}
        <motion.div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[700px] h-8 bg-black opacity-40 blur-2xl rounded-full"
          animate={{
            opacity: isLifted ? 0.4 : 0,
            scale: isLifted ? 1 : 0.5,
          }}
          transition={{ duration: 2 }}
        />
      </motion.div>

      {/* Interaction Hint */}
      {isLifted && !isDragging && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
        >
          <motion.div
            animate={{ x: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ←
          </motion.div>
          <span>Drag to rotate</span>
          <motion.div
            animate={{ x: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            →
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
