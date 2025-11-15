import { Circle, CheckCircle2, Loader2, Zap, Upload, Grid3x3, BarChart3, BookOpen } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";

interface ModulesPageProps {
  onNavigate: (page: string, moduleId?: string) => void;
}

export function ModulesPage({ onNavigate }: ModulesPageProps) {
  const modules = [
    {
      id: "alignment",
      letter: "A",
      name: "Alignment",
      description: "Spatially aligns before/after images using feature matching and homography",
      status: "completed" as const,
      color: "from-red-500 to-red-600",
    },
    {
      id: "segmentation",
      letter: "B",
      name: "Precise Segmentation",
      description: "Refines coarse detections with pixel-level accuracy using U-Net architecture",
      status: "idle" as const,
      color: "from-white/80 to-white/60",
    },
    {
      id: "classification",
      letter: "C",
      name: "Change Classification",
      description: "Categorizes detected changes by type (color, shape, texture, position)",
      status: "completed" as const,
      color: "from-red-700 to-red-800",
    },
    {
      id: "severity",
      letter: "D",
      name: "Severity Estimation",
      description: "Quantifies the importance and impact of each detected change",
      status: "idle" as const,
      color: "from-red-500 to-red-600",
    },
    {
      id: "filter",
      letter: "E",
      name: "False-Positive Filter",
      description: "Removes noise and artifacts to improve detection accuracy",
      status: "completed" as const,
      color: "from-red-600 to-red-700",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-white" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-red-500 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-white/40" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-white/20 text-white border-white/40",
      running: "bg-red-500/20 text-red-400 border-red-500/40",
      idle: "bg-white/10 text-white/60 border-white/20",
    };
    return variants[status as keyof typeof variants];
  };

  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", id: "dashboard", icon: BarChart3 },
    { name: "Upload & Analyze", id: "upload", icon: Upload },
    { name: "Modules", id: "modules", icon: Grid3x3 },
    { name: "Results", id: "results", icon: BarChart3 },
    { name: "Ledger", id: "ledger", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex bg-black relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(circle at 20% 50%, rgba(225, 6, 0, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(225, 6, 0, 0.1) 0%, transparent 50%)",
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
      <motion.aside
        className="fixed left-0 top-0 h-screen w-64 bg-black/80 backdrop-blur-md border-r border-red-900/30 z-50"
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-red-900/30">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate("home")}
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
              <span className="text-lg text-white tracking-wider" style={{ fontFamily: 'system-ui' }}>
                TRACKSHIFT AI
              </span>
              <div className="h-0.5 w-full bg-gradient-to-r from-red-600 to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.id === "modules";
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
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
        <div className="max-w-[1920px] mx-auto px-8 py-8">
          {/* Modules Grid */}
          <div className="grid grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="border-0 glass glass-hover cursor-pointer group"
                  onClick={() => onNavigate("module-detail", module.id)}
                >
                  <CardContent className="p-6">
                    {/* Module Letter Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        whileHover={{ rotate: 5 }}
                      >
                        <span className={`text-2xl ${module.color.includes('white') ? 'text-black' : 'text-white'}`}>
                          {module.letter}
                        </span>
                      </motion.div>
                      {getStatusIcon(module.status)}
                    </div>

                    {/* Module Info */}
                    <h3 className="text-white mb-2">{module.name}</h3>
                    <p className="text-white/60 mb-4 line-clamp-2">{module.description}</p>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <Badge className={`border ${getStatusBadge(module.status)} capitalize`}>
                        {module.status}
                      </Badge>
                      <button className="text-red-500 hover:text-red-400 transition-colors">
                        View Details →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pipeline Flow Info */}
          <Card className="border-0 glass mt-8">
            <CardContent className="p-6">
              <h3 className="text-white mb-4">Pipeline Flow</h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {modules.map((module, index) => (
                  <div key={module.id} className="flex items-center gap-3 flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center`}
                    >
                      <span className={module.color.includes('white') ? 'text-black' : 'text-white'}>
                        {module.letter}
                      </span>
                    </div>
                    {index < modules.length - 1 && (
                      <div className="w-8 h-0.5 bg-gradient-to-r from-red-600 to-transparent" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}