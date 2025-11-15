import { ArrowLeft, Play, FileText, Download } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface ModuleDetailPageProps {
  moduleId: string;
  onNavigate: (page: string, moduleId?: string) => void;
}

export function ModuleDetailPage({ moduleId, onNavigate }: ModuleDetailPageProps) {
  const moduleData: Record<string, any> = {
    alignment: {
      letter: "A",
      name: "Alignment Module",
      color: "from-red-500 to-red-600",
      howItWorks: "Uses SIFT/ORB feature detection and RANSAC-based homography estimation to spatially align before and after images. Corrects for camera position, angle, and lens distortions.",
      plugsIn: "First stage of the pipeline. Outputs aligned image pairs that serve as input for all downstream modules (B-G).",
      modifications: "Added multi-scale feature detection for better alignment on high-resolution images. Implemented GPU acceleration for real-time processing.",
      metrics: {
        accuracy: "99.2%",
        avgTime: "1.3s",
        lastRun: "2 minutes ago",
      },
    },
    coarse: {
      letter: "B",
      name: "Coarse Detection Module",
      color: "from-red-600 to-red-700",
      howItWorks: "Applies difference imaging and Gaussian blur to identify candidate regions. Uses adaptive thresholding to handle varying lighting conditions.",
      plugsIn: "Receives aligned images from Module A. Outputs region proposals to Module C for precise segmentation.",
      modifications: "Integrated histogram equalization preprocessing. Added configurable sensitivity thresholds for different use cases.",
      metrics: {
        accuracy: "94.8%",
        avgTime: "0.8s",
        lastRun: "5 minutes ago",
      },
    },
    segmentation: {
      letter: "C",
      name: "Precise Segmentation Module",
      color: "from-white/80 to-white/60",
      howItWorks: "U-Net based semantic segmentation refines coarse regions to pixel-level accuracy. Uses ResNet-50 encoder pretrained on ImageNet.",
      plugsIn: "Takes region proposals from Module B. Outputs precise change masks to Modules D and E.",
      modifications: "Fine-tuned on domain-specific datasets (F1 cars, manufacturing defects). Added attention mechanisms for better boundary detection.",
      metrics: {
        accuracy: "97.5%",
        avgTime: "2.1s",
        lastRun: "1 hour ago",
      },
    },
    classification: {
      letter: "D",
      name: "Change Classification Module",
      color: "from-red-700 to-red-800",
      howItWorks: "Multi-class CNN classifier categorizes changes into types: color shift, shape modification, texture change, position adjustment, and addition/removal.",
      plugsIn: "Receives segmentation masks from Module C. Classification results feed into Module E for severity scoring.",
      modifications: "Extended taxonomy to include 12 change types specific to industrial use cases. Improved performance on small changes.",
      metrics: {
        accuracy: "96.3%",
        avgTime: "0.6s",
        lastRun: "10 minutes ago",
      },
    },
    severity: {
      letter: "E",
      name: "Severity Estimation Module",
      color: "from-red-500 to-red-600",
      howItWorks: "Quantifies change importance using spatial extent, intensity, and contextual relevance. Outputs severity scores from 0-100.",
      plugsIn: "Takes classified changes from Module D and segmentation masks from Module C. Feeds results to visualization layer.",
      modifications: "Implemented domain-specific weighting (e.g., aerodynamic changes in F1 scored higher). Added user-configurable severity rules.",
      metrics: {
        accuracy: "93.7%",
        avgTime: "0.4s",
        lastRun: "15 minutes ago",
      },
    },
    filter: {
      letter: "F",
      name: "False-Positive Filter Module",
      color: "from-red-600 to-red-700",
      howItWorks: "Uses ensemble methods and confidence scoring to remove artifacts, shadows, reflections, and noise-based detections.",
      plugsIn: "Post-processes outputs from all detection modules. Final clean results go to Module G and reporting.",
      modifications: "Added learned filters using historical false-positive data. Improved shadow/lighting compensation algorithms.",
      metrics: {
        accuracy: "98.1%",
        avgTime: "0.5s",
        lastRun: "3 minutes ago",
      },
    },
    tracker: {
      letter: "G",
      name: "Temporal Tracker Module",
      color: "from-white/70 to-white/50",
      howItWorks: "Tracks detected changes across image sequences using Kalman filtering and feature matching. Maintains change IDs over time.",
      plugsIn: "Final stage. Aggregates outputs from Modules C-F across multiple time points for trend analysis.",
      modifications: "Implemented long-term tracking with re-identification. Added trajectory prediction for progressive changes.",
      metrics: {
        accuracy: "95.4%",
        avgTime: "1.7s",
        lastRun: "30 minutes ago",
      },
    },
  };

  const allModules = [
    { id: "alignment", name: "Alignment", letter: "A" },
    { id: "coarse", name: "Coarse Detection", letter: "B" },
    { id: "segmentation", name: "Precise Segmentation", letter: "C" },
    { id: "classification", name: "Change Classification", letter: "D" },
    { id: "severity", name: "Severity Estimation", letter: "E" },
    { id: "filter", name: "False-Positive Filter", letter: "F" },
    { id: "tracker", name: "Temporal Tracker", letter: "G" },
  ];

  const currentModule = moduleData[moduleId];

  return (
    <div className="max-w-[1920px] mx-auto px-8 py-8">
      <div className="flex gap-6">
        {/* Left Sidebar - Module List */}
        <Card className="border-0 glass w-64 flex-shrink-0 h-fit">
          <CardContent className="p-4">
            <h4 className="text-white mb-4">All Modules</h4>
            <div className="space-y-2">
              {allModules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => onNavigate("module-detail", module.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    moduleId === module.id
                      ? "bg-red-600 text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={`w-8 h-8 rounded flex items-center justify-center ${
                    moduleId === module.id ? "bg-white/20" : "bg-white/10"
                  }`}>
                    {module.letter}
                  </span>
                  <span>{module.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => onNavigate("modules")}
                variant="outline"
                className="border-red-600/30 text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Modules
              </Button>
              <h1 className="text-white">{currentModule.name}</h1>
            </div>
          </div>

          {/* Information Sections */}
          <Card className="border-0 glass">
            <CardContent className="p-6">
              <Accordion type="multiple" className="w-full" defaultValue={["works", "plugs", "modified"]}>
                <AccordionItem value="works" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-red-500">
                    How it works now
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    {currentModule.howItWorks}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="plugs" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-red-500">
                    How it plugs into pipeline
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    {currentModule.plugsIn}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="modified" className="border-white/10">
                  <AccordionTrigger className="text-white hover:text-red-500">
                    How we modified it
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    {currentModule.modifications}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Flow Diagram Placeholder */}
          <Card className="border-0 glass">
            <CardContent className="p-6">
              <h3 className="text-white mb-4">Pipeline Flow Diagram</h3>
              <div className="h-48 bg-black/50 rounded-xl flex items-center justify-center border border-red-900/30">
                <p className="text-white/40">Flow diagram visualization</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-red-500 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
              <span className="relative z-10 flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Run Module Test
              </span>
            </Button>
            <Button variant="outline" className="border-red-600/30 text-white hover:bg-white/5">
              <FileText className="w-4 h-4 mr-2" />
              View Output Logs
            </Button>
            <Button variant="outline" className="border-red-600/30 text-white hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          </div>

          {/* Performance Metrics */}
          <Card className="border-0 glass">
            <CardContent className="p-6">
              <h3 className="text-white mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl text-white mb-2">{currentModule.metrics.accuracy}</div>
                  <div className="text-white/60">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl text-red-500 mb-2">{currentModule.metrics.avgTime}</div>
                  <div className="text-white/60">Avg Processing Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl text-white mb-2">{currentModule.metrics.lastRun}</div>
                  <div className="text-white/60">Last Run</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Preview */}
          <Card className="border-0 glass">
            <CardContent className="p-6">
              <h3 className="text-white mb-4">Data Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-48 bg-black/50 rounded-xl flex items-center justify-center border border-red-900/30">
                  <p className="text-white/40">Input Image Sample</p>
                </div>
                <div className="h-48 bg-black/50 rounded-xl flex items-center justify-center border border-red-900/30">
                  <p className="text-white/40">Output Result Sample</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
