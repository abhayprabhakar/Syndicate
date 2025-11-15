import { useState } from "react";
import { motion } from "motion/react";
import {
  Zap,
  Upload,
  Grid3x3,
  BarChart3,
  BookOpen,
  Eye,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardPageProps {
  onNavigate?: (page: string, moduleId?: string, transactionId?: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [showInspectionsPredictions, setShowInspectionsPredictions] = useState(true);
  const [showSeverityPredictions, setShowSeverityPredictions] = useState(true);

  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", id: "dashboard", icon: BarChart3 },
    { name: "Upload & Analyze", id: "upload", icon: Upload },
    { name: "Modules", id: "modules", icon: Grid3x3 },
    { name: "Results", id: "results", icon: BarChart3 },
    { name: "Ledger", id: "ledger", icon: BookOpen },
  ];

  // Summary data
  const summaryCards = [
    {
      title: "Total Inspections",
      value: "1,247",
      description: "+12% from last month",
      icon: Activity,
      color: "text-red-500",
    },
    {
      title: "Active Models",
      value: "7",
      description: "All systems operational",
      icon: Grid3x3,
      color: "text-red-500",
    },
    {
      title: "Pending Reviews",
      value: "23",
      description: "Requires attention",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Blockchain Anchored",
      value: "1,189",
      description: "Verified reports",
      icon: Shield,
      color: "text-green-500",
    },
  ];

  // Inspections over time data
  const inspectionsData = [
    { month: "Jun", actual: 145, predicted: 148 },
    { month: "Jul", actual: 178, predicted: 175 },
    { month: "Aug", actual: 192, predicted: 195 },
    { month: "Sep", actual: 224, predicted: 220 },
    { month: "Oct", actual: 267, predicted: 270 },
    { month: "Nov", actual: 241, predicted: 245 },
    { month: "Dec", actual: null, predicted: 285 },
  ];

  // Severity distribution data
  const severityData = [
    { category: "Minor", actual: 456, predicted: 470 },
    { category: "Moderate", actual: 312, predicted: 298 },
    { category: "Severe", actual: 89, predicted: 95 },
  ];

  // Recent inspections
  const recentInspections = [
    {
      id: "1",
      timestamp: "2025-11-15T14:32:18Z",
      carId: "RB19-001",
      summary: "Front wing endplate damage detected",
      status: "Completed",
    },
    {
      id: "2",
      timestamp: "2025-11-15T13:18:45Z",
      carId: "RB19-002",
      summary: "Minor rear diffuser scratches",
      status: "Reviewed",
    },
    {
      id: "3",
      timestamp: "2025-11-15T12:05:33Z",
      carId: "RB19-003",
      summary: "Rear wing endplate surface wear",
      status: "Completed",
    },
    {
      id: "4",
      timestamp: "2025-11-15T11:22:11Z",
      carId: "RB19-001",
      summary: "Floor edge wear analysis",
      status: "Pending",
    },
    {
      id: "5",
      timestamp: "2025-11-15T10:47:29Z",
      carId: "RB19-004",
      summary: "Side pod debris impact review",
      status: "Failed",
    },
  ];

  // Most affected parts data
  const affectedPartsData = [
    { part: "Front Wing", count: 187, percentage: 100 },
    { part: "Floor Edge", count: 156, percentage: 83 },
    { part: "Sidepod", count: 134, percentage: 72 },
    { part: "Rear Wing", count: 98, percentage: 52 },
    { part: "Halo", count: 67, percentage: 36 },
  ];

  // Alerts data
  const alerts = [
    {
      type: "severe",
      message: "3 inspections detected severe structural changes",
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      type: "review",
      message: "23 inspections awaiting human review",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    {
      type: "failed",
      message: "5 analyses failed and require re-run",
      icon: XCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
    },
    {
      type: "success",
      message: "All blockchain anchoring operations successful",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    },
  ];

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/20 text-green-400 border-green-500/40";
      case "Pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
      case "Failed":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "Reviewed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
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
            className="flex items-center justify-center cursor-pointer"
            onClick={() => onNavigate?.("home")}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img 
              src="/trackshift logo.png" 
              alt="TrackShift Logo" 
              className="h-15 w-auto object-contain"
            />
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "dashboard";
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
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-white text-3xl mb-2">Dashboard</h1>
            <p className="text-white/60">Overview of inspections, system activity, and performance</p>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-4 gap-6 mb-8"
          >
            {summaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Card className="bg-[#0a0a0a] border-red-600/20 hover:border-red-600/40 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-white/60 text-sm mb-2">{card.title}</p>
                          <h3 className="text-white text-3xl">{card.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg bg-red-600/10 border border-red-600/20`}>
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

          {/* System Activity Graphs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid grid-cols-2 gap-6 mb-8"
          >
            {/* Inspections Over Time */}
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Inspections Over Time
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="inspections-pred" className="text-white/60 text-sm">
                      Predictions
                    </Label>
                    <Switch
                      id="inspections-pred"
                      checked={showInspectionsPredictions}
                      onCheckedChange={setShowInspectionsPredictions}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={inspectionsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.6)" />
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
                      name="Actual"
                    />
                    {showInspectionsPredictions && (
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

            {/* Severity Distribution */}
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    Change Severity Distribution
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="severity-pred" className="text-white/60 text-sm">
                      Predictions
                    </Label>
                    <Switch
                      id="severity-pred"
                      checked={showSeverityPredictions}
                      onCheckedChange={setShowSeverityPredictions}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={severityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="category" stroke="rgba(255,255,255,0.6)" />
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
                      strokeWidth={2}
                      name="Actual"
                    />
                    {showSeverityPredictions && (
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#ff6b6b"
                        fill="#ff6b6b"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Predicted"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Inspections and Most Affected Parts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-3 gap-6 mb-8"
          >
            {/* Recent Inspections Table */}
            <Card className="bg-[#0a0a0a] border-red-600/20 col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Latest Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-red-600/20">
                        <th className="px-4 py-3 text-left text-white text-sm">Timestamp</th>
                        <th className="px-4 py-3 text-left text-white text-sm">Car ID</th>
                        <th className="px-4 py-3 text-left text-white text-sm">Result Summary</th>
                        <th className="px-4 py-3 text-left text-white text-sm">Status</th>
                        <th className="px-4 py-3 text-left text-white text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInspections.map((inspection, index) => (
                        <motion.tr
                          key={inspection.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-4 py-3 text-white/80 text-sm">
                            {new Date(inspection.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-white/80 text-sm">{inspection.carId}</td>
                          <td className="px-4 py-3 text-white/80 text-sm">{inspection.summary}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs border ${getStatusColor(
                                inspection.status
                              )}`}
                            >
                              {inspection.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onNavigate?.("transaction-report", undefined, inspection.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-white/60 group-hover:text-red-500 transition-colors" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Most Affected Car Parts */}
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Most Affected Car Parts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affectedPartsData.map((part, index) => (
                    <motion.div
                      key={part.part}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white">{part.part}</span>
                        <span className="text-white/60">{part.count}</span>
                      </div>
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${part.percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alerts & Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {alerts.map((alert, index) => {
                    const Icon = alert.icon;
                    return (
                      <motion.div
                        key={alert.type}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                        className={`p-4 rounded-lg border ${alert.bgColor} ${alert.borderColor}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 ${alert.color} flex-shrink-0 mt-0.5`} />
                          <p className="text-white text-sm">{alert.message}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
