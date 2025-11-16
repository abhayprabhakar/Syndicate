import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Upload,
  Grid3x3,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  Shield,
  Save,
  Image as ImageIcon,
  Camera,
  Activity,
  AlertTriangle,
  TrendingUp,
  Eye,
  Gauge,
  Wind,
  Plane,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { toast } from "sonner";

// API Base URL
const API_BASE_URL = 'https://giovanna-unpredatory-ronin.ngrok-free.dev';

interface ResultsPageProps {
  onNavigate?: (page: string) => void;
  isAutoCapture?: boolean;
  analysisMode?: string;
  selectedRegion?: any;
}

export function ResultsPage({ onNavigate, isAutoCapture = false, analysisMode = "entire", selectedRegion }: ResultsPageProps) {
  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", id: "dashboard", icon: BarChart3 },
    { name: "Upload & Analyze", id: "upload", icon: Upload },
    { name: "Modules", id: "modules", icon: Grid3x3 },
    { name: "Results", id: "results", icon: BarChart3 },
    { name: "Ledger", id: "ledger", icon: BookOpen },
  ];

  // State
  const [showChangeIntensityPrediction, setShowChangeIntensityPrediction] = useState(true);
  const [expandedParts, setExpandedParts] = useState<string[]>([]);
  
  // ✅ NEW: State for alignment images
  const [baselineOriginal, setBaselineOriginal] = useState<string | null>(null);
  const [currentUnaligned, setCurrentUnaligned] = useState<string | null>(null);
  const [alignmentOverlay, setAlignmentOverlay] = useState<string | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  // ✅ NEW: Fetch alignment images on mount
  useEffect(() => {
    const jobId = sessionStorage.getItem("currentJobId");
    
    if (!jobId) {
      console.log("⚠️ No job_id found for ResultsPage");
      setIsLoadingImages(false);
      return;
    }

    console.log("🖼️ ResultsPage: Fetching alignment images for job_id:", jobId);

    const fetchAlignmentImages = async () => {
      try {
        // Fetch baseline original
        console.log("📥 Fetching baseline_original...");
        const baselineResponse = await fetch(`${API_BASE_URL}/images/${jobId}/baseline_original`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (baselineResponse.ok) {
          const baselineBlob = await baselineResponse.blob();
          const baselineUrl = URL.createObjectURL(baselineBlob);
          setBaselineOriginal(baselineUrl);
          console.log("✅ Baseline original loaded!");
          
          // Auto-download
          const link = document.createElement('a');
          link.href = baselineUrl;
          link.download = `baseline_original_${jobId}.jpg`;
          link.click();
          console.log("💾 Baseline original saved to Downloads");
        } else {
          console.warn("⚠️ baseline_original not found (might not be generated yet)");
        }

        // Fetch current unaligned
        console.log("📥 Fetching current_unaligned...");
        const currentResponse = await fetch(`${API_BASE_URL}/images/${jobId}/current_unaligned`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (currentResponse.ok) {
          const currentBlob = await currentResponse.blob();
          const currentUrl = URL.createObjectURL(currentBlob);
          setCurrentUnaligned(currentUrl);
          console.log("✅ Current unaligned loaded!");
          
          // Auto-download
          const link = document.createElement('a');
          link.href = currentUrl;
          link.download = `current_unaligned_${jobId}.jpg`;
          link.click();
          console.log("💾 Current unaligned saved to Downloads");
        } else {
          console.warn("⚠️ current_unaligned not found");
        }

        // Fetch alignment overlay
        console.log("📥 Fetching alignment_overlay...");
        const overlayResponse = await fetch(`${API_BASE_URL}/images/${jobId}/alignment_overlay`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (overlayResponse.ok) {
          const overlayBlob = await overlayResponse.blob();
          const overlayUrl = URL.createObjectURL(overlayBlob);
          setAlignmentOverlay(overlayUrl);
          console.log("✅ Alignment overlay loaded!");
          
          // Auto-download
          const link = document.createElement('a');
          link.href = overlayUrl;
          link.download = `alignment_overlay_${jobId}.jpg`;
          link.click();
          console.log("💾 Alignment overlay saved to Downloads");
        } else {
          console.warn("⚠️ alignment_overlay not found");
        }

        setIsLoadingImages(false);
        toast.success("Alignment images loaded successfully!");

      } catch (error: any) {
        console.error("❌ Failed to load alignment images:", error);
        setImageError(error.message);
        setIsLoadingImages(false);
        toast.error("Failed to load alignment images");
      }
    };

    fetchAlignmentImages();
  }, []);

  // Metrics data
  const metricsCards = [
    {
      title: "Affected Parts",
      value: "7",
      description: "Sections detected",
      icon: Grid3x3,
      color: "text-red-500",
    },
    {
      title: "Severity Level",
      value: "Moderate",
      description: "Yellow zone",
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      title: "Confidence Score",
      value: "94%",
      description: "High reliability",
      icon: Activity,
      color: "text-green-500",
    },
    {
      title: "Anomalies Detected",
      value: "12",
      description: "Points of interest",
      icon: TrendingUp,
      color: "text-red-500",
    },
  ];

  // Change intensity over time data
  const changeIntensityData = [
    { time: "0s", actual: 12, predicted: 14 },
    { time: "5s", actual: 24, predicted: 26 },
    { time: "10s", actual: 38, predicted: 36 },
    { time: "15s", actual: 52, predicted: 54 },
    { time: "20s", actual: 67, predicted: 65 },
    { time: "25s", actual: 78, predicted: 80 },
    { time: "30s", actual: null, predicted: 92 },
  ];

  // Part-wise change breakdown data
  const partChangeData = [
    { part: "Front Wing", value: 78, severity: "severe" },
    { part: "Floor Edge", value: 62, severity: "moderate" },
    { part: "Sidepod", value: 45, severity: "moderate" },
    { part: "Halo", value: 28, severity: "minor" },
    { part: "Rear Wing", value: 53, severity: "moderate" },
  ];

  // Color shift data
  const colorShiftData = [
    { x: 12, y: 34, deltaE: 8 },
    { x: 45, y: 67, deltaE: 15 },
    { x: 78, y: 23, deltaE: 22 },
    { x: 34, y: 89, deltaE: 12 },
    { x: 90, y: 45, deltaE: 18 },
    { x: 23, y: 56, deltaE: 9 },
    { x: 67, y: 78, deltaE: 25 },
    { x: 56, y: 12, deltaE: 14 },
  ];

  // Model confidence trend data
  const confidenceData = [
    { step: "Step 1", confidence: 65 },
    { step: "Step 2", confidence: 72 },
    { step: "Step 3", confidence: 81 },
    { step: "Step 4", confidence: 87 },
    { step: "Step 5", confidence: 94 },
  ];

  // Detected parts list
  const detectedParts = [
    {
      id: "1",
      name: "Front Wing Endplate",
      area: "124.5",
      length: "45.2",
      deltaE: "18.3",
      confidence: "96%",
      details: "Surface wear detected on outer edge. Possible impact damage from debris.",
    },
    {
      id: "2",
      name: "Floor Edge Plank",
      area: "98.7",
      length: "32.8",
      deltaE: "12.7",
      confidence: "92%",
      details: "Abrasion marks consistent with high-speed contact. Minor material loss.",
    },
    {
      id: "3",
      name: "Sidepod Inlet",
      area: "67.3",
      length: "28.4",
      deltaE: "8.9",
      confidence: "89%",
      details: "Color variation detected. Potential decal shift or surface contamination.",
    },
    {
      id: "4",
      name: "Rear Wing DRS Actuator",
      area: "54.2",
      length: "18.6",
      deltaE: "15.2",
      confidence: "95%",
      details: "Mechanical wear on moving parts. Operating within acceptable parameters.",
    },
    {
      id: "5",
      name: "Halo Structure",
      area: "23.8",
      length: "9.3",
      deltaE: "6.4",
      confidence: "88%",
      details: "Minor surface scratches. No structural integrity concerns.",
    },
  ];

  // Toggle part expansion
  const togglePartExpansion = (partId: string) => {
    setExpandedParts((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    );
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "#e10600";
      case "moderate":
        return "#ff9800";
      case "minor":
        return "#4caf50";
      default:
        return "#9e9e9e";
    }
  };

  // Handle action buttons
  const handleSaveToLedger = () => {
    toast.success("Saved successfully", {
      description: "Analysis results saved to ledger",
    });
  };

  const handleAnchorHash = () => {
    toast.success("Hash anchored", {
      description: "Transaction hash: 0x7a8f9e3b2c...",
    });
  };

  const handleDownloadPDF = () => {
    toast.success("PDF downloaded", {
      description: "Summary report downloaded successfully",
    });
  };

  return (
    <div className="min-h-screen flex bg-black relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 50%, rgba(225, 6, 0, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(225, 6, 0, 0.1) 0%, transparent 50%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 60% 30%, rgba(255, 0, 0, 0.08) 0%, transparent 50%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Left Sidebar Navigation */}
      <motion.aside className="fixed left-0 top-0 h-screen w-64 bg-black/80 backdrop-blur-md border-r border-red-900/30 z-50">
        {/* Logo Section */}
        <div className="p-6 border-b border-red-900/30">
          <motion.div
            className="flex items-center justify-center cursor-pointer"
            onClick={() => onNavigate?.("home")}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img src="/trackshift logo.png" alt="TrackShift" className="h-15 w-auto" />
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "results";
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group border ${
                  isActive
                    ? "bg-red-600 text-white border-red-600 shadow-[0_0_20px_rgba(225,6,0,0.4)]"
                    : "text-white/70 hover:text-white hover:bg-red-600/10 border-transparent hover:border-red-600/30"
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "group-hover:text-red-500"}`} />
                <span className="tracking-wide">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64">
        <div className="max-w-[1920px] mx-auto px-12 py-8 relative z-10">
          {/* Auto-Capture Live Stream Panel */}
          <AnimatePresence>
            {isAutoCapture && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="fixed top-6 right-6 z-40"
              >
                <Card className="bg-[#0a0a0a] border-red-600/30 shadow-[0_0_30px_rgba(225,6,0,0.3)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-white text-sm">Live Stream Active</p>
                        <p className="text-white/60 text-xs">Auto-updating from camera feed</p>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-400 text-xs">Active</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-white/60 text-xs">Camera: Pit Lane Cam 1</p>
                      <p className="text-white/60 text-xs">Interval: 10 seconds</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-3xl mb-2">Results</h1>
                <p className="text-white/60">Analysis summary of the latest inspection</p>
              </div>
              {/* Analysis Mode Indicator */}
              {analysisMode === "region" && selectedRegion && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 text-sm px-4 py-2">
                  Analyzing Selected Region
                </Badge>
              )}
              {analysisMode === "entire" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-sm px-4 py-2">
                  Full Image Analysis
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Before/After Comparison Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Image Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Before Image */}
                  <div>
                    <div className="aspect-video bg-black/50 rounded-lg border border-red-600/20 flex items-center justify-center mb-3 overflow-hidden">
                      {isLoadingImages ? (
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-white/60 text-sm">Loading...</p>
                        </div>
                      ) : baselineOriginal ? (
                        <img 
                          src={baselineOriginal} 
                          alt="Baseline Original" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-2" />
                          <p className="text-white/60 text-sm">Not available</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-semibold">Before Image</p>
                      <p className="text-white/60 text-sm">2016 Baseline (Reference)</p>
                      <p className="text-white/60 text-sm">Manual Upload</p>
                      <p className="text-white/60 text-sm">Original unaligned</p>
                    </div>
                  </div>

                  {/* After Image */}
                  <div>
                    <div className="aspect-video bg-black/50 rounded-lg border border-red-600/20 flex items-center justify-center mb-3 overflow-hidden">
                      {isLoadingImages ? (
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-white/60 text-sm">Loading...</p>
                        </div>
                      ) : currentUnaligned ? (
                        <img 
                          src={currentUnaligned} 
                          alt="Current Unaligned" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-2" />
                          <p className="text-white/60 text-sm">Not available</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-semibold">After Image</p>
                      <p className="text-white/60 text-sm">2025 Current (Unaligned)</p>
                      <p className="text-white/60 text-sm">Manual Upload</p>
                      <p className="text-white/60 text-sm">Before alignment</p>
                    </div>
                  </div>

                  {/* Aligned Overlay */}
                  <div>
                    <div className="aspect-video bg-black/50 rounded-lg border border-red-600/20 flex items-center justify-center mb-3 overflow-hidden relative">
                      {isLoadingImages ? (
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-white/60 text-sm">Loading...</p>
                        </div>
                      ) : alignmentOverlay ? (
                        <>
                          <img 
                            src={alignmentOverlay} 
                            alt="Alignment Overlay" 
                            className="w-full h-full object-contain"
                          />
                          <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-xs">
                            Aligned
                          </Badge>
                        </>
                      ) : (
                        <>
                          <div className="text-center">
                            <ImageIcon className="w-16 h-16 text-white/40 mx-auto mb-2" />
                            <p className="text-white/60 text-sm">Not available</p>
                          </div>
                          <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-xs">
                            Aligned
                          </Badge>
                        </>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-semibold">Aligned Overlay</p>
                      <p className="text-white/60 text-sm">Red=2016, Green=2025</p>
                      <p className="text-white/60 text-sm">Gray = Perfect alignment</p>
                      <p className="text-white/60 text-sm">Algorithm: LoFTR</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Heatmap Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Detected Visual Changes</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Heatmap Visualization */}
                  <div className="col-span-2">
                    <div className="aspect-video bg-gradient-to-br from-red-900/20 via-yellow-900/20 to-green-900/20 rounded-lg border border-red-600/20 flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="w-20 h-20 text-red-500 mx-auto mb-4" />
                        <p className="text-white/60">Heatmap Visualization</p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-black/30 border border-red-600/20">
                      <p className="text-white/60 text-sm mb-1">Change Severity Score</p>
                      <p className="text-white text-2xl">67/100</p>
                      <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600" style={{ width: "67%" }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-black/30 border border-red-600/20">
                      <p className="text-white/60 text-sm mb-1">Total Change Area</p>
                      <p className="text-white text-2xl">368.5 cm²</p>
                    </div>

                    <div className="p-4 rounded-lg bg-black/30 border border-red-600/20">
                      <p className="text-white/60 text-sm mb-1">Crack Length</p>
                      <p className="text-white text-2xl">134.3 mm</p>
                    </div>

                    <div className="p-4 rounded-lg bg-black/30 border border-red-600/20">
                      <p className="text-white/60 text-sm mb-1">Decal Shift</p>
                      <p className="text-white text-2xl">2.8 mm</p>
                    </div>

                    <Button
                      onClick={() => onNavigate?.("transaction-report")}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metrics Cards Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-4 gap-6 mb-8"
          >
            {metricsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                >
                  <Card className="bg-[#0a0a0a] border-red-600/20 hover:border-red-600/40 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-white/60 text-sm mb-2">{card.title}</p>
                          <h3 className="text-white text-3xl">{card.value}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/20">
                          <Icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                      </div>
                      <p className="text-white/40 text-xs">{card.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Performance Impact Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Performance Impact Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6 mb-4">
                  {/* Speed Change Prediction */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Card className="bg-black/30 border-red-600/20 hover:border-red-600/40 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-white/60 text-sm mb-2">Speed Change Prediction</p>
                            <h3 className="text-red-500 text-4xl">-1.2 km/h</h3>
                          </div>
                          <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/20">
                            <Gauge className="w-6 h-6 text-red-500" />
                          </div>
                        </div>
                        <p className="text-white/40 text-xs">Estimated top-speed impact</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Downforce Change */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.45 }}
                  >
                    <Card className="bg-black/30 border-red-600/20 hover:border-red-600/40 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-white/60 text-sm mb-2">Downforce Change</p>
                            <h3 className="text-red-500 text-4xl">-3.8%</h3>
                          </div>
                          <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/20">
                            <Wind className="w-6 h-6 text-red-500" />
                          </div>
                        </div>
                        <p className="text-white/40 text-xs">Downforce variation based on detected part changes</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Drag Coefficient Change */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <Card className="bg-black/30 border-red-600/20 hover:border-red-600/40 transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-white/60 text-sm mb-2">Drag Coefficient Change</p>
                            <h3 className="text-red-500 text-4xl">+1.4%</h3>
                          </div>
                          <div className="p-3 rounded-lg bg-red-600/10 border border-red-600/20">
                            <Plane className="w-6 h-6 text-red-500" />
                          </div>
                        </div>
                        <p className="text-white/40 text-xs">Aerodynamic drag variation</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
                <p className="text-white/50 text-xs text-center">
                  Predictions based on aero-model estimation from detected structural changes.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Graphs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="grid grid-cols-2 gap-6 mb-8"
          >
            {/* Graph 1: Change Intensity Over Time */}
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Change Intensity Over Time</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="intensity-pred" className="text-white/60 text-sm">
                      Predictions
                    </Label>
                    <Switch
                      id="intensity-pred"
                      checked={showChangeIntensityPrediction}
                      onCheckedChange={setShowChangeIntensityPrediction}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={changeIntensityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid rgba(225, 6, 0, 0.3)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#e10600"
                      strokeWidth={3}
                      dot={{ fill: "#e10600", r: 5 }}
                      name="Current"
                    />
                    {showChangeIntensityPrediction && (
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#ff6b6b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: "#ff6b6b", r: 4 }}
                        name="Predicted"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graph 2: Part-wise Change Breakdown */}
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Part-wise Change Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={partChangeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="part" stroke="rgba(255,255,255,0.6)" angle={-20} textAnchor="end" height={80} />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid rgba(225, 6, 0, 0.3)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {partChangeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graph 3: Color Shift (ΔE) */}
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Color Shift (ΔE)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="x" stroke="rgba(255,255,255,0.6)" name="X Position" />
                    <YAxis dataKey="y" stroke="rgba(255,255,255,0.6)" name="Y Position" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid rgba(225, 6, 0, 0.3)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      cursor={{ strokeDasharray: "3 3" }}
                    />
                    <Scatter name="Color Shift" data={colorShiftData} fill="#e10600">
                      {colorShiftData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`rgba(225, 6, 0, ${entry.deltaE / 30})`} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graph 4: Model Confidence Trend */}
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Model Confidence Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={confidenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="step" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid rgba(225, 6, 0, 0.3)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidence"
                      stroke="#e10600"
                      fill="#e10600"
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detected Parts List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Detected Parts</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {detectedParts.map((part, index) => (
                    <motion.div
                      key={part.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                      className="border border-red-600/20 rounded-lg overflow-hidden"
                    >
                      <div
                        className="p-4 bg-black/30 hover:bg-black/50 transition-colors cursor-pointer"
                        onClick={() => togglePartExpansion(part.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 bg-black/50 rounded border border-red-600/20 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-8 h-8 text-white/40" />
                          </div>

                          {/* Part Info */}
                          <div className="flex-1 grid grid-cols-5 gap-4">
                            <div>
                              <p className="text-white text-sm">{part.name}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Area</p>
                              <p className="text-white text-sm">{part.area} cm²</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Length</p>
                              <p className="text-white text-sm">{part.length} mm</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">ΔE</p>
                              <p className="text-white text-sm">{part.deltaE}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Confidence</p>
                              <p className="text-white text-sm">{part.confidence}</p>
                            </div>
                          </div>

                          {/* Expand Icon */}
                          <div>
                            {expandedParts.includes(part.id) ? (
                              <ChevronUp className="w-5 h-5 text-white/60" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-white/60" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedParts.includes(part.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-black/50 border-t border-red-600/20">
                              <p className="text-white/80 text-sm">{part.details}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Button onClick={handleSaveToLedger} className="bg-red-600 hover:bg-red-700 text-white flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save to Ledger
                  </Button>
                  <Button
                    onClick={handleAnchorHash}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 flex-1"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Anchor Hash
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}