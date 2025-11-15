import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function HydraulicCarShowcase() {
  const [isLifted, setIsLifted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);
  
  const rotateY = useMotionValue(0);
  const scale = useTransform(rotateY, [-200, 0, 200], [0.95, 1, 0.95]);

  useEffect(() => {
    // Trigger lift animation after component mounts
    const timer = setTimeout(() => {
      setIsLifted(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-rotate when not dragging
    if (!isDragging && isLifted) {
      const interval = setInterval(() => {
        rotateY.set((rotateY.get() + 0.5) % 360);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isDragging, isLifted, rotateY]);

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

        {/* Interactive Car Container */}
        <motion.div
          ref={constraintsRef}
          className="relative cursor-grab active:cursor-grabbing"
          style={{
            perspective: 1200,
          }}
        >
          <motion.div
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            onDrag={(_, info) => {
              rotateY.set(rotateY.get() + info.delta.x * 0.5);
            }}
            style={{
              rotateY,
              scale,
              transformStyle: "preserve-3d",
            }}
            className="relative"
          >
            {/* F1 Car Image */}
            <motion.div
              className="relative w-[800px] h-[500px] flex items-center justify-center"
              animate={{
                filter: isLifted 
                  ? ["brightness(0.8)", "brightness(1)", "brightness(0.8)"]
                  : "brightness(0.8)",
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758742250570-fd039e3aafa6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtdWxhJTIwMSUyMHJhY2UlMjBjYXIlMjBmcm9udHxlbnwxfHx8fDE3NjA5NTQwMDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="F1 Race Car"
                className="w-full h-full object-contain drop-shadow-2xl"
              />

              {/* Glowing Accents */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Front Lights */}
                <div className="absolute top-1/2 left-[15%] w-4 h-4 bg-red-500 rounded-full blur-md" />
                <div className="absolute top-1/2 right-[15%] w-4 h-4 bg-red-500 rounded-full blur-md" />
                
                {/* Rear Wing Glow */}
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-32 h-1 bg-red-600 blur-sm" />
              </motion.div>

              {/* Tire Glow Effects */}
              <motion.div
                className="absolute bottom-[25%] left-[20%] w-24 h-24 bg-white rounded-full opacity-10 blur-xl"
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
                className="absolute bottom-[25%] right-[20%] w-24 h-24 bg-white rounded-full opacity-10 blur-xl"
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
          </motion.div>
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
