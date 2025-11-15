import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Download,
  Zap,
  Upload,
  Grid3x3,
  BarChart3,
  BookOpen,
  Copy,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  X,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Gauge,
  Wind,
  Plane,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
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
} from "recharts";
import { toast } from "sonner";

interface TransactionReportPageProps {
  transactionId: string;
  onNavigate?: (page: string) => void;
}

export function TransactionReportPage({ transactionId, onNavigate }: TransactionReportPageProps) {
  const [showPredictions, setShowPredictions] = useState(true);
  const [expandedChanges, setExpandedChanges] = useState<number[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", id: "dashboard", icon: BarChart3 },
    { name: "Upload & Analyze", id: "upload", icon: Upload },
    { name: "Modules", id: "modules", icon: Grid3x3 },
    { name: "Results", id: "results", icon: BarChart3 },
    { name: "Ledger", id: "ledger", icon: BookOpen },
  ];

  // Transaction data mapped by ID
  const transactionData: Record<string, any> = {
    "1": {
      id: "1",
      timestamp: "2025-11-15T14:32:18Z",
      transactionId: "0x7a9f3c2e",
      blockHash: "0x4f2e8a...9d3c1b",
      type: "Automated Scan",
      status: "Completed",
      carId: "RB19-001",
      confidence: 94.2,
      detectedChanges: [
        {
          region: "Front wing endplate",
          area: 124.5,
          length: 45.2,
          colorDelta: 12.3,
          confidence: 96.5,
          rationale: "New carbon exposure; likely kerb strike at T10",
          thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        },
        {
          region: "Rear diffuser",
          area: 89.3,
          length: 32.1,
          colorDelta: 8.7,
          confidence: 92.1,
          rationale: "Minor paint chipping detected on trailing edge",
          thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        },
      ],
    },
    "2": {
      id: "2",
      timestamp: "2025-11-15T13:18:45Z",
      transactionId: "0x5b4d8f1a",
      blockHash: "0x3a1f7e...4c2d8f",
      type: "Manual Inspection",
      status: "Reviewed",
      carId: "RB19-002",
      confidence: 98.7,
      detectedChanges: [
        {
          region: "Front wing main plane",
          area: 156.2,
          length: 52.8,
          colorDelta: 18.5,
          confidence: 98.7,
          rationale: "Significant structural deformation detected",
          thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        },
      ],
    },
    "3": {
      id: "3",
      timestamp: "2025-11-15T12:05:33Z",
      transactionId: "0x9e2c4a6b",
      blockHash: "0x8d5c3f...7a2e9b",
      type: "Report Export",
      status: "Completed",
      carId: "RB19-003",
      confidence: 91.5,
      detectedChanges: [
        {
          region: "Rear wing endplate",
          area: 98.4,
          length: 38.6,
          colorDelta: 10.2,
          confidence: 91.5,
          rationale: "Minor surface scratches from testing",
          thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        },
      ],
    },
    "4": {
      id: "4",
      timestamp: "2025-11-15T11:22:11Z",
      transactionId: "0x3f8e2d5c",
      blockHash: "0x2e9a4f...6d1c8e",
      type: "Hash Anchor",
      status: "Pending",
      carId: "RB19-001",
      confidence: 88.3,
      detectedChanges: [
        {
          region: "Floor edge",
          area: 67.9,
          length: 24.3,
          colorDelta: 7.8,
          confidence: 88.3,
          rationale: "Wear pattern from ground contact",
          thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        },
      ],
    },
    "5": {
      id: "5",
      timestamp: "2025-11-15T10:47:29Z",
      transactionId: "0x6d1a9c4e",
      blockHash: "0x9f3e2d...5a7c4b",
      type: "Automated Scan",
      status: "Failed",
      carId: "RB19-004",
      confidence: 67.3,
      detectedChanges: [
        {
          region: "Side pod",
          area: 145.6,
          length: 48.2,
          colorDelta: 14.7,
          confidence: 67.3,
          rationale: "Possible debris impact requiring manual review",
          thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
        },
      ],
    },
  };

  // Get transaction data or use default
  const transaction = transactionData[transactionId] || transactionData["1"];

  // Mock transaction data - keeping for reference
  const oldTransaction = {
    id: transactionId,
    timestamp: "2025-11-15T14:32:18Z",
    transactionId: "0x7a9f3c2e",
    blockHash: "0x4f2e8a...9d3c1b",
    type: "Automated Scan",
    status: "Completed",
    carId: "RB19-001",
    confidence: 94.2,
    detectedChanges: [
      {
        region: "Front wing endplate",
        area: 124.5,
        length: 45.2,
        colorDelta: 12.3,
        confidence: 96.5,
        rationale: "New carbon exposure; likely kerb strike at T10",
        thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      },
      {
        region: "Rear diffuser",
        area: 89.3,
        length: 32.1,
        colorDelta: 8.7,
        confidence: 92.1,
        rationale: "Minor paint chipping detected on trailing edge",
        thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      },
      {
        region: "Side pod",
        area: 156.8,
        length: 62.4,
        colorDelta: 15.2,
        confidence: 89.7,
        rationale: "Surface abrasion consistent with debris contact",
        thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      },
      {
        region: "Floor edge",
        area: 78.9,
        length: 28.6,
        colorDelta: 6.4,
        confidence: 94.8,
        rationale: "Expected wear pattern from ground effect interaction",
        thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
      },
    ],
  };

  // Graph data - Line Chart (Damage Area Over Time)
  const damageAreaData = [
    { session: "FP1", actual: 45, predicted: 48 },
    { session: "FP2", actual: 78, predicted: 75 },
    { session: "FP3", actual: 112, predicted: 115 },
    { session: "Quali", actual: 156, predicted: 160 },
    { session: "Race", actual: 449.5, predicted: 445 },
  ];

  // Graph data - Bar Chart (Changes by Component)
  const componentData = [
    { component: "Front Wing", count: 12, predictedCount: 14 },
    { component: "Floor", count: 8, predictedCount: 7 },
    { component: "Diffuser", count: 6, predictedCount: 8 },
    { component: "Sidepod", count: 4, predictedCount: 5 },
    { component: "Rear Wing", count: 3, predictedCount: 3 },
  ];

  // Graph data - Area Chart (Confidence Distribution)
  const confidenceData = [
    { range: "70-75%", actual: 2, predicted: 3 },
    { range: "75-80%", actual: 5, predicted: 4 },
    { range: "80-85%", actual: 8, predicted: 9 },
    { range: "85-90%", actual: 12, predicted: 11 },
    { range: "90-95%", actual: 18, predicted: 19 },
    { range: "95-100%", actual: 15, predicted: 16 },
  ];

  // Graph data - Scatter Plot (Area vs Color Delta)
  const scatterData = showPredictions
    ? [
        { area: 45.2, colorDelta: 12.3, type: "actual" },
        { area: 89.3, colorDelta: 8.7, type: "actual" },
        { area: 156.8, colorDelta: 15.2, type: "actual" },
        { area: 78.9, colorDelta: 6.4, type: "actual" },
        { area: 124.5, colorDelta: 12.3, type: "actual" },
        { area: 52.1, colorDelta: 11.8, type: "predicted" },
        { area: 95.6, colorDelta: 9.2, type: "predicted" },
        { area: 162.3, colorDelta: 14.8, type: "predicted" },
        { area: 72.4, colorDelta: 7.1, type: "predicted" },
        { area: 118.9, colorDelta: 13.5, type: "predicted" },
      ]
    : [
        { area: 45.2, colorDelta: 12.3, type: "actual" },
        { area: 89.3, colorDelta: 8.7, type: "actual" },
        { area: 156.8, colorDelta: 15.2, type: "actual" },
        { area: 78.9, colorDelta: 6.4, type: "actual" },
        { area: 124.5, colorDelta: 12.3, type: "actual" },
      ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/20 text-green-400 border-green-500/40";
      case "Pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "Failed":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/40";
    }
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
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate?.("home")}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" fill="white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-red-500 rounded blur-md opacity-50"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg text-white tracking-wider" style={{ fontFamily: "system-ui" }}>
                TRACKSHIFT AI
              </span>
              <div className="h-0.5 w-full bg-gradient-to-r from-red-600 to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "ledger";
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
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              onClick={() => onNavigate?.("ledger")}
              className="text-white/70 hover:text-white hover:bg-white/5 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Ledger
            </Button>
          </motion.div>

          {/* Transaction Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-white text-2xl">Transaction Report</h1>
                      <Badge className="bg-red-600/20 text-red-400 border-red-600/40 border">
                        ID: {transaction.id}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="text-white/60 text-sm">{transaction.transactionId}</code>
                      <button onClick={() => copyToClipboard(transaction.transactionId, "Transaction ID")}>
                        <Copy className="w-4 h-4 text-white/40 hover:text-red-500" />
                      </button>
                      <Badge className={`${getStatusColor(transaction.status)} border text-xs`}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Report
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Timestamp</p>
                    <p className="text-white text-sm">{new Date(transaction.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Car ID</p>
                    <p className="text-white text-sm">{transaction.carId}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Block Hash</p>
                    <div className="flex items-center gap-2">
                      <code className="text-white text-sm">{transaction.blockHash}</code>
                      <button onClick={() => copyToClipboard(transaction.blockHash, "Block hash")}>
                        <Copy className="w-3 h-3 text-white/40 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-1">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                          style={{ width: `${transaction.confidence}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{transaction.confidence}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Images Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-white text-xl mb-4">Visual Analysis</h2>
            <div className="grid grid-cols-3 gap-6">
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Before</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="aspect-video rounded-lg overflow-hidden border border-red-600/20 cursor-pointer hover:border-red-600/40 transition-all group relative"
                    onClick={() => setLightboxImage({ 
                      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200", 
                      title: "Before Image" 
                    })}
                  >
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm">After</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="aspect-video rounded-lg overflow-hidden border border-red-600/20 cursor-pointer hover:border-red-600/40 transition-all group relative"
                    onClick={() => setLightboxImage({ 
                      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200", 
                      title: "After Image" 
                    })}
                  >
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Change Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="aspect-video rounded-lg overflow-hidden border border-red-600/20 bg-gradient-to-br from-red-900/40 via-orange-900/30 to-yellow-900/20 flex items-center justify-center relative cursor-pointer hover:border-red-600/40 transition-all group"
                    onClick={() => setLightboxImage({ 
                      src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200", 
                      title: "Change Heatmap" 
                    })}
                  >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                    <span className="text-white/60 text-sm relative z-10 group-hover:opacity-0 transition-opacity">Heatmap Visualization</span>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                      <Maximize2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Prediction Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white mb-1">Prediction Analytics</h3>
                    <p className="text-white/60 text-sm">
                      Toggle to show/hide predicted values across all graphs
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="predictions" className="text-white/80">
                      Show Predictions
                    </Label>
                    <Switch
                      id="predictions"
                      checked={showPredictions}
                      onCheckedChange={setShowPredictions}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Graphs Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-white text-xl mb-4">Analytics & Predictions</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Line Chart */}
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Cumulative Damage Area Over Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={damageAreaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="session" stroke="rgba(255,255,255,0.6)" />
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
                        strokeWidth={2}
                        dot={{ fill: "#e10600", r: 4 }}
                        name="Actual (cm²)"
                      />
                      {showPredictions && (
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="#ff6b6b"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: "#ff6b6b", r: 4 }}
                          name="Predicted (cm²)"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bar Chart */}
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-red-500" />
                    Changes by Component
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={componentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="component" stroke="rgba(255,255,255,0.6)" angle={-45} textAnchor="end" height={80} />
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
                      <Bar dataKey="count" fill="#e10600" name="Actual Changes" />
                      {showPredictions && (
                        <Bar dataKey="predictedCount" fill="#ff6b6b" name="Predicted Changes" opacity={0.6} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Area Chart */}
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    Confidence Score Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={confidenceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="range" stroke="rgba(255,255,255,0.6)" />
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
                      <Area
                        type="monotone"
                        dataKey="actual"
                        stroke="#e10600"
                        fill="#e10600"
                        fillOpacity={0.6}
                        name="Actual Count"
                      />
                      {showPredictions && (
                        <Area
                          type="monotone"
                          dataKey="predicted"
                          stroke="#ff6b6b"
                          fill="#ff6b6b"
                          fillOpacity={0.3}
                          strokeDasharray="5 5"
                          name="Predicted Count"
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Scatter Chart */}
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5 text-red-500" />
                    Area vs Color Delta Correlation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        type="number"
                        dataKey="area"
                        name="Area"
                        unit=" cm²"
                        stroke="rgba(255,255,255,0.6)"
                      />
                      <YAxis
                        type="number"
                        dataKey="colorDelta"
                        name="Color Delta"
                        unit=" ΔE"
                        stroke="rgba(255,255,255,0.6)"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid rgba(225, 6, 0, 0.3)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                        cursor={{ strokeDasharray: "3 3" }}
                      />
                      <Legend />
                      <Scatter
                        name="Actual Data"
                        data={scatterData.filter((d) => d.type === "actual")}
                        fill="#e10600"
                      />
                      {showPredictions && (
                        <Scatter
                          name="Predicted Data"
                          data={scatterData.filter((d) => d.type === "predicted")}
                          fill="#ff6b6b"
                          shape="cross"
                        />
                      )}
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Detected Changes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-white text-xl mb-4">Detected Changes ({transaction.detectedChanges.length})</h2>
            <div className="grid grid-cols-2 gap-4">
              {transaction.detectedChanges.map((change, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                >
                  <Card className="bg-[#0a0a0a] border-red-600/20 hover:border-red-600/40 transition-all">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-red-600/20 flex-shrink-0">
                          <ImageWithFallback
                            src={change.thumbnail}
                            alt={change.region}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="text-white mb-2">{change.region}</h3>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <p className="text-white/60 text-xs">Area</p>
                              <p className="text-white text-sm">{change.area} cm²</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Length</p>
                              <p className="text-white text-sm">{change.length} mm</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Color Delta</p>
                              <p className="text-white text-sm">ΔE {change.colorDelta}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs">Confidence</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                                    style={{ width: `${change.confidence}%` }}
                                  />
                                </div>
                                <span className="text-white text-xs">{change.confidence}%</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-white/60 text-xs italic">{change.rationale}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Performance Impact Analysis Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Performance Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Speed Impact Graph & Downforce vs Drag Chart */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Speed Impact Graph */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white">Speed Impact</h3>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="speed-pred" className="text-white/60 text-sm">
                          Predictions
                        </Label>
                        <Switch
                          id="speed-pred"
                          checked={showPredictions}
                          onCheckedChange={setShowPredictions}
                          className="data-[state=checked]:bg-red-600"
                        />
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart
                        data={[
                          { speed: 100, baseline: 320, predicted: 318.8 },
                          { speed: 150, baseline: 335, predicted: 333.5 },
                          { speed: 200, baseline: 345, predicted: 343.2 },
                          { speed: 250, baseline: 352, predicted: 350.1 },
                          { speed: 300, baseline: 358, predicted: 355.7 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="speed" stroke="rgba(255,255,255,0.6)" label={{ value: "Distance (m)", position: "insideBottom", offset: -5, fill: "rgba(255,255,255,0.6)" }} />
                        <YAxis stroke="rgba(255,255,255,0.6)" label={{ value: "Speed (km/h)", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.6)" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid rgba(225, 6, 0, 0.3)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "#fff" }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="baseline" stroke="#00d48f" strokeWidth={2} name="Baseline" />
                        {showPredictions && (
                          <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#e10600"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Predicted"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Downforce vs Drag Chart */}
                  <div>
                    <h3 className="text-white mb-4">Downforce vs Drag</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                          type="number"
                          dataKey="drag"
                          name="Drag"
                          stroke="rgba(255,255,255,0.6)"
                          label={{ value: "Drag Coefficient", position: "insideBottom", offset: -5, fill: "rgba(255,255,255,0.6)" }}
                        />
                        <YAxis
                          type="number"
                          dataKey="downforce"
                          name="Downforce"
                          stroke="rgba(255,255,255,0.6)"
                          label={{ value: "Downforce (%)", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.6)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid rgba(225, 6, 0, 0.3)",
                            borderRadius: "8px",
                          }}
                          cursor={{ strokeDasharray: "3 3" }}
                        />
                        <Legend />
                        <Scatter
                          name="Before"
                          data={[{ drag: 0.32, downforce: 100 }]}
                          fill="#00d48f"
                          shape="circle"
                        />
                        <Scatter
                          name="After"
                          data={[{ drag: 0.324, downforce: 96.2 }]}
                          fill="#e10600"
                          shape="circle"
                        />
                        {showPredictions && (
                          <Scatter
                            name="Predicted"
                            data={[{ drag: 0.323, downforce: 96.8 }]}
                            fill="#ff6b6b"
                            shape="cross"
                          />
                        )}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Airflow Simulation Preview */}
                <div className="mb-6">
                  <h3 className="text-white mb-4">Airflow Simulation Preview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-lg border border-red-600/20 p-4">
                      <p className="text-white/60 text-sm mb-3">Before Airflow Pattern</p>
                      <div className="aspect-video bg-gradient-to-r from-blue-900/20 via-cyan-900/20 to-blue-900/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-30" style={{
                          background: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0, 212, 143, 0.1) 10px, rgba(0, 212, 143, 0.1) 20px)"
                        }}></div>
                        <p className="text-white/60 text-xs relative z-10">Airflow visualization (simulated)</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40 text-xs">Low pressure zones</Badge>
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg border border-red-600/20 p-4">
                      <p className="text-white/60 text-sm mb-3">After Airflow Pattern</p>
                      <div className="aspect-video bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-30" style={{
                          background: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(225, 6, 0, 0.1) 10px, rgba(225, 6, 0, 0.1) 20px)"
                        }}></div>
                        <p className="text-white/60 text-xs relative z-10">Airflow visualization (simulated)</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs">High pressure zones</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Change Metrics Table */}
                <div className="mb-6">
                  <h3 className="text-white mb-4">Performance Change Metrics</h3>
                  <div className="bg-black/30 rounded-lg border border-red-600/20 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-red-600/20">
                          <th className="px-4 py-3 text-left text-white text-sm">Parameter</th>
                          <th className="px-4 py-3 text-left text-white text-sm">Before</th>
                          <th className="px-4 py-3 text-left text-white text-sm">After</th>
                          <th className="px-4 py-3 text-left text-white text-sm">Predicted</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5">
                          <td className="px-4 py-3 text-white/80 text-sm">Top speed (km/h)</td>
                          <td className="px-4 py-3 text-white/80 text-sm">358.0</td>
                          <td className="px-4 py-3 text-red-500 text-sm">356.8</td>
                          <td className="px-4 py-3 text-white/60 text-sm">356.5</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="px-4 py-3 text-white/80 text-sm">Acceleration (0-200 km/h)</td>
                          <td className="px-4 py-3 text-white/80 text-sm">4.8s</td>
                          <td className="px-4 py-3 text-red-500 text-sm">4.9s</td>
                          <td className="px-4 py-3 text-white/60 text-sm">4.95s</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="px-4 py-3 text-white/80 text-sm">Downforce change (%)</td>
                          <td className="px-4 py-3 text-white/80 text-sm">100%</td>
                          <td className="px-4 py-3 text-red-500 text-sm">96.2%</td>
                          <td className="px-4 py-3 text-white/60 text-sm">96.8%</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="px-4 py-3 text-white/80 text-sm">Drag coefficient (Cd)</td>
                          <td className="px-4 py-3 text-white/80 text-sm">0.320</td>
                          <td className="px-4 py-3 text-red-500 text-sm">0.324</td>
                          <td className="px-4 py-3 text-white/60 text-sm">0.323</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="px-4 py-3 text-white/80 text-sm">Cornering load impact</td>
                          <td className="px-4 py-3 text-white/80 text-sm">Baseline</td>
                          <td className="px-4 py-3 text-red-500 text-sm">-2.1%</td>
                          <td className="px-4 py-3 text-white/60 text-sm">-2.3%</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-white/80 text-sm">Fuel efficiency change</td>
                          <td className="px-4 py-3 text-white/80 text-sm">Baseline</td>
                          <td className="px-4 py-3 text-red-500 text-sm">-0.8%</td>
                          <td className="px-4 py-3 text-white/60 text-sm">-0.9%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Natural Language Summary */}
                <div className="bg-black/30 rounded-lg border border-red-600/20 p-4">
                  <h3 className="text-white mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    AI-Generated Performance Summary
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Detected front-wing endplate deformation reduces downforce by 3.8% and increases drag by 1.4%, resulting in an estimated 
                    <span className="text-red-500"> -1.2 km/h loss</span> on straights and minor instability in high-speed corners. 
                    The rear diffuser paint chipping has minimal aerodynamic impact but may indicate structural stress. 
                    Side pod surface abrasion contributes to increased turbulence, affecting overall airflow efficiency. 
                    Combined effects suggest a <span className="text-red-500">cumulative performance degradation of approximately 2.1%</span> in cornering load, 
                    with potential acceleration delays of 0.1-0.15 seconds in the 0-200 km/h range. 
                    Recommended action: Replace front wing endplate before next session to restore optimal performance characteristics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Blockchain Verification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-br from-green-900/10 to-transparent border-green-600/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-green-600/20 border border-green-600/40">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white mb-2">Blockchain Verification</h3>
                    <p className="text-white/60 text-sm mb-3">
                      This transaction has been successfully anchored to the blockchain and is cryptographically verified.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-white/60 text-xs mb-1">SHA-256 Hash</p>
                        <code className="text-white text-xs break-all">
                          e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                        </code>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-600/40 text-green-400 hover:bg-green-600/10"
                      >
                        View on Block Explorer
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Download Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="flex justify-center"
          >
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
              onClick={() => {
                toast.success("Generating PDF report...");
                setTimeout(() => {
                  toast.success("PDF report downloaded successfully!");
                }, 1500);
              }}
            >
              <Download className="w-5 h-5 mr-3" />
              Download PDF Report
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-6 right-6 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="relative max-w-6xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white text-xl mb-4 text-center">{lightboxImage.title}</h3>
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg border-2 border-red-600/40"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}