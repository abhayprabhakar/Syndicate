import { motion } from "motion/react";
import { RaceNavbar } from "./RaceNavbar";
import { HydraulicCarShowcase } from "./HydraulicCarShowcase";
import { ChevronRight, Gauge, Zap, Target } from "lucide-react";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 0, 0, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Top Red Accent Lines */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Navbar */}
      <RaceNavbar onNavigate={onNavigate} />

      {/* Main Content */}
      <div className="relative pt-24 pb-16">
        {/* Hero Text Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.h1
            className="text-6xl mb-4 tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-white">AI-Powered Visual Analysis</span>
            <br />
            <span className="text-white">for </span>
            <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              F1 Performance
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl text-white/60 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Precision engineering meets artificial intelligence. Track every change, 
            measure every upgrade, dominate every race.
          </motion.p>
        </motion.div>

        {/* Car Showcase */}
        <HydraulicCarShowcase />

        {/* CTA Button */}
        <motion.div
          className="flex justify-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
        >
          <motion.button
            onClick={() => onNavigate("upload")}
            className="group relative px-12 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-red-500 blur-xl opacity-0 group-hover:opacity-50"
              transition={{ duration: 0.3 }}
            />
            
            <span className="relative z-10 flex items-center gap-3 tracking-wide uppercase">
              Start Your Analysis
              <ChevronRight className="w-5 h-5" />
            </span>

            {/* Animated Border */}
            <motion.div
              className="absolute inset-0 border-2 border-white/20 rounded-lg"
              animate={{
                borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.2)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          className="flex justify-center gap-8 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
        >
          {[
            { icon: Gauge, label: "Real-Time Analysis", value: "< 2s" },
            { icon: Target, label: "Precision", value: "98.5%" },
            { icon: Zap, label: "AI Modules", value: "7 Active" },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-red-900/30 rounded-full backdrop-blur-sm"
                whileHover={{ 
                  borderColor: "rgba(220, 38, 38, 0.6)",
                  backgroundColor: "rgba(255, 255, 255, 0.08)"
                }}
              >
                <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-white/60 text-xs uppercase tracking-wider">{feature.label}</div>
                  <div className="text-white">{feature.value}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-24 left-0 w-32 h-32 border-l-2 border-t-2 border-red-600/30" />
      <div className="absolute top-24 right-0 w-32 h-32 border-r-2 border-t-2 border-red-600/30" />
      <div className="absolute bottom-8 left-0 w-32 h-32 border-l-2 border-b-2 border-red-600/30" />
      <div className="absolute bottom-8 right-0 w-32 h-32 border-r-2 border-b-2 border-red-600/30" />
    </div>
  );
}