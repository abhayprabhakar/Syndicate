import { useState, useEffect } from "react";
import { FileText, Download, Zap, AlertTriangle, Settings, Gauge } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "motion/react";

export function ReportsPage() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Get current timestamp
  const currentDate = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const CircularMetric = ({ value, label, icon: Icon }: { value: number; label: string; icon: any }) => {
    const circumference = 2 * Math.PI * 50;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40">
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-0"
            animate={{ opacity: animated ? [0, 0.3, 0] : 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* SVG Circle */}
          <svg className="w-full h-full transform -rotate-90 relative z-10">
            <circle
              cx="80"
              cy="80"
              r="50"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="10"
              fill="none"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="50"
              stroke="#e10600"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: animated ? strokeDashoffset : circumference }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className="w-8 h-8 text-red-500 mb-2" />
            <motion.span
              className="text-3xl text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: animated ? 1 : 0, scale: animated ? 1 : 0.5 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {value}%
            </motion.span>
          </div>
        </div>
        <p className="text-white mt-4 text-center">{label}</p>
      </div>
    );
  };

  const DamageItem = ({ title, severity, delay }: { title: string; severity: number; delay: number }) => {
    return (
      <motion.div
        className="flex items-center justify-between p-4 glass rounded-lg border border-red-900/30 group hover:border-red-600/60 transition-colors"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: animated ? 1 : 0, x: animated ? 0 : -20 }}
        transition={{ duration: 0.5, delay }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center border border-red-600/40"
            animate={{ 
              boxShadow: ["0 0 0 0 rgba(225,6,0,0.7)", "0 0 0 10px rgba(225,6,0,0)", "0 0 0 0 rgba(225,6,0,0)"]
            }}
            transition={{ duration: 2, repeat: Infinity, delay }}
          >
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </motion.div>
          <div>
            <p className="text-white">{title}</p>
            <p className="text-white/60">Severity: {severity}%</p>
          </div>
        </div>
        <div className="w-24">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-red-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: animated ? `${severity}%` : 0 }}
              transition={{ duration: 1.5, delay: delay + 0.3 }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-[1920px] mx-auto px-8 py-8">
      {/* Animated Border Frame */}
      <div className="absolute top-0 left-0 right-0 h-1">
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-red-600 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-white mb-2">Detailed AI Report</h1>
        <p className="text-white/60 mb-4">Generated by TrackShift Visual Intelligence Engine</p>
        <div className="h-1 w-48 mx-auto bg-gradient-to-r from-transparent via-red-600 to-transparent" />
      </motion.div>

      {/* Top Section - Large Car Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Card className="border-0 glass mb-8 overflow-hidden relative">
          {/* Animated corner borders */}
          <motion.div
            className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-red-600 z-10"
            animate={{ 
              borderColor: ["rgba(225,6,0,0.3)", "rgba(225,6,0,1)", "rgba(225,6,0,0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-red-600 z-10"
            animate={{ 
              borderColor: ["rgba(225,6,0,0.3)", "rgba(225,6,0,1)", "rgba(225,6,0,0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-red-600 z-10"
            animate={{ 
              borderColor: ["rgba(225,6,0,0.3)", "rgba(225,6,0,1)", "rgba(225,6,0,0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-red-600 z-10"
            animate={{ 
              borderColor: ["rgba(225,6,0,0.3)", "rgba(225,6,0,1)", "rgba(225,6,0,0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />

          <CardContent className="p-0">
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1729843606560-e41b0be7fc7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxGMSUyMGNhciUyMHRlY2huaWNhbCUyMGluc3BlY3Rpb258ZW58MXx8fHwxNzYxMjMyODM3fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="F1 Car Inspection"
                className="w-full h-[500px] object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Center text overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Zap className="w-8 h-8 text-red-600" fill="#e10600" />
                    <h2 className="text-3xl text-white tracking-wider">F1-2025-XT ANALYSIS</h2>
                  </div>
                  <p className="text-white/80 text-xl">Complete Vehicle Inspection Report</p>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Middle Section - Two Panels */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Left Panel - Damage Summary */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-0 glass h-full">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-white">Damage Summary</h3>
              </div>

              <div className="space-y-4 mb-8">
                <DamageItem title="Rear Wing Damage" severity={78} delay={0.5} />
                <DamageItem title="Front Tire Impact" severity={45} delay={0.6} />
                <DamageItem title="Side Panel Scratches" severity={32} delay={0.7} />
                <DamageItem title="Underfloor Wear" severity={23} delay={0.8} />
              </div>

              {/* Overall Severity Bar */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white">Overall Severity</span>
                  <motion.span
                    className="text-2xl text-red-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: animated ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    45%
                  </motion.span>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-600 to-red-700 rounded-full shadow-[0_0_15px_rgba(225,6,0,0.7)]"
                    initial={{ width: 0 }}
                    animate={{ width: animated ? "45%" : 0 }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Panel - Performance Insights */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-0 glass h-full">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <Gauge className="w-6 h-6 text-red-600" />
                <h3 className="text-white">Performance Insights</h3>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <CircularMetric value={87} label="Lap Consistency" icon={Gauge} />
                <CircularMetric value={68} label="Tire Wear" icon={Settings} />
                <CircularMetric value={92} label="Track Condition" icon={Zap} />
              </div>

              {/* Additional Stats */}
              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Average Speed</span>
                  <span className="text-white">287 km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Best Lap Time</span>
                  <span className="text-white">1:27.394</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Downforce Level</span>
                  <span className="text-white">High</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Fuel Efficiency</span>
                  <span className="text-white">94.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section - Export & Timestamp */}
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        {/* Export Button */}
        <Button className="px-16 py-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white relative overflow-hidden group shadow-[0_0_40px_rgba(225,6,0,0.4)]">
          <motion.div
            className="absolute inset-0 bg-red-500 blur-2xl opacity-0 group-hover:opacity-70"
            transition={{ duration: 0.3 }}
          />
          <span className="relative z-10 flex items-center gap-3 tracking-wider uppercase">
            <Download className="w-6 h-6" />
            Export as PDF
          </span>
          {/* Animated border */}
          <motion.div
            className="absolute inset-0 border-2 border-white/30 rounded-lg"
            animate={{
              borderColor: [
                "rgba(255,255,255,0.3)",
                "rgba(255,255,255,0.8)",
                "rgba(255,255,255,0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </Button>

        {/* Timestamp */}
        <motion.p
          className="text-white/40 text-sm"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          Last updated: {currentDate}
        </motion.p>

        {/* Tech Line Animation */}
        <div className="w-full max-w-2xl h-px relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-red-600 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </motion.div>

      {/* Decorative Corner Elements */}
      <div className="fixed top-24 left-8 w-24 h-24 border-l border-t border-red-600/30 pointer-events-none" />
      <div className="fixed top-24 right-8 w-24 h-24 border-r border-t border-red-600/30 pointer-events-none" />
      <div className="fixed bottom-8 left-8 w-24 h-24 border-l border-b border-red-600/30 pointer-events-none" />
      <div className="fixed bottom-8 right-8 w-24 h-24 border-r border-b border-red-600/30 pointer-events-none" />
    </div>
  );
}
