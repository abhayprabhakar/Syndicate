import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Upload,
  Grid3x3,
  BarChart3,
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Square,
  PenTool,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { pollResults } from "../services/api";
import { toast } from "sonner";

// API Base URL for constructing image URLs
const API_BASE_URL = 'https://giovanna-unpredatory-ronin.ngrok-free.dev';

interface ImageComparisonPageProps {
  onNavigate?: (page: string, analysisMode?: string, selectedRegion?: any) => void;
  beforeImage?: string;
  afterImage?: string;
}

export function ImageComparisonPage({ onNavigate, beforeImage, afterImage }: ImageComparisonPageProps) {
  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", id: "dashboard", icon: BarChart3 },
    { name: "Upload & Analyze", id: "upload", icon: Upload },
    { name: "Modules", id: "modules", icon: Grid3x3 },
    { name: "Results", id: "results", icon: BarChart3 },
    { name: "Ledger", id: "ledger", icon: BookOpen },
  ];

  // State
  const [showHighlights, setShowHighlights] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [fullscreenImage, setFullscreenImage] = useState<"before" | "after" | null>(null);
  const [analysisMode, setAnalysisMode] = useState<"entire" | "region" | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingTool, setDrawingTool] = useState<"rectangle" | "freeform">("rectangle");

  // API integration state
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("Initializing...");
  const [processedBeforeImage, setProcessedBeforeImage] = useState<string | null>(null);
  const [processedAfterImage, setProcessedAfterImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load results from API on mount
  useEffect(() => {
    const jobId = sessionStorage.getItem("currentJobId");
    
    if (!jobId) {
      setError("No job ID found. Please upload images first.");
      setIsLoading(false);
      toast.error("No job ID found");
      return;
    }

    console.log("Starting polling for job:", jobId);

    // Start polling for results
    pollResults(jobId, (progress) => {
      console.log("Progress update:", progress);
      setLoadingProgress(progress);
    })
      .then((data) => {
        console.log("Pipeline completed, full response:", data);
        
        if (data.status === "complete" && data.results) {
          console.log("Results object:", data.results);
          console.log("Number of changes:", data.results.num_changes);
          
          // Strategy 1: Check if backend returned base64 encoded combined image
          if (data.results.classified_changes_base64) {
            console.log("✅ Found base64 image data, length:", data.results.classified_changes_base64.length);
            
            // Create data URL from base64
            const imgDataUrl = `data:image/png;base64,${data.results.classified_changes_base64}`;
            
            // Load image to split into before/after
            const img = new Image();
            img.onload = () => {
              console.log("Image loaded, dimensions:", img.width, "x", img.height);
              
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                const halfWidth = img.width / 2;
                console.log("Splitting at width:", halfWidth);
                
                // Extract before image (left half)
                canvas.width = halfWidth;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, halfWidth, img.height, 0, 0, halfWidth, img.height);
                const beforeDataUrl = canvas.toDataURL('image/png');
                setProcessedBeforeImage(beforeDataUrl);
                console.log("✅ Before image extracted");
                
                // Extract after image (right half)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, halfWidth, 0, halfWidth, img.height, 0, 0, halfWidth, img.height);
                const afterDataUrl = canvas.toDataURL('image/png');
                setProcessedAfterImage(afterDataUrl);
                console.log("✅ After image extracted");
                
                setIsLoading(false);
                toast.success(`Images processed! ${data.results.num_changes} changes detected.`);
              }
            };
            img.onerror = () => {
              console.error("❌ Failed to load base64 image");
              setError("Failed to decode processed image");
              setIsLoading(false);
              toast.error("Failed to decode processed image");
            };
            img.src = imgDataUrl;
          } 
          // Check if backend returned a single combined image URL
          else if (data.results.classified_changes_url) {
            const classifiedImageUrl = data.results.classified_changes_url;
            
            // Load the combined image and split it into before/after
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              // Create canvas to split the image
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                const halfWidth = img.width / 2;
                
                // Extract before image (left half)
                canvas.width = halfWidth;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, halfWidth, img.height, 0, 0, halfWidth, img.height);
                const beforeDataUrl = canvas.toDataURL('image/png');
                setProcessedBeforeImage(beforeDataUrl);
                
                // Extract after image (right half)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, halfWidth, 0, halfWidth, img.height, 0, 0, halfWidth, img.height);
                const afterDataUrl = canvas.toDataURL('image/png');
                setProcessedAfterImage(afterDataUrl);
                
                setIsLoading(false);
                toast.success(`Images processed! ${data.results.num_changes} changes detected.`);
              }
            };
            img.onerror = () => {
              setError("Failed to load processed images from URL");
              setIsLoading(false);
              toast.error("Failed to load processed images");
            };
            img.src = classifiedImageUrl;
          }
          // Try to construct URL from job_id
          else if (data.results.num_changes !== undefined) {
            // Backend has results but no image URL, try to construct it
            const imageUrl = `${API_BASE_URL}/outputs/${jobId}_classified.png`;
            console.log("Trying constructed URL:", imageUrl);
            
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                const halfWidth = img.width / 2;
                canvas.width = halfWidth;
                canvas.height = img.height;
                
                // Before (left)
                ctx.drawImage(img, 0, 0, halfWidth, img.height, 0, 0, halfWidth, img.height);
                setProcessedBeforeImage(canvas.toDataURL('image/png'));
                
                // After (right)
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, halfWidth, 0, halfWidth, img.height, 0, 0, halfWidth, img.height);
                setProcessedAfterImage(canvas.toDataURL('image/png'));
                
                setIsLoading(false);
                toast.success(`Images processed! ${data.results.num_changes} changes detected.`);
              }
            };
            img.onerror = () => {
              setError("Processing complete but images not accessible. Check backend output.");
              setIsLoading(false);
              toast.error("Images processed but display failed");
            };
            img.src = imageUrl;
          } else {
            setError("Backend returned incomplete results");
            setIsLoading(false);
            toast.error("No processed images found in results");
          }
        } else if (data.status === "failed") {
          setError(data.error || "Processing failed");
          setIsLoading(false);
          toast.error("Processing failed: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Polling error:", err);
        setError(`Failed to retrieve results: ${err.message}`);
        setIsLoading(false);
        toast.error("Failed to retrieve results");
      });
  }, []);

  // Mock change highlights (would come from AI model)
  const changeHighlights = [
    { x: 120, y: 180, width: 80, height: 60, severity: "severe", label: "Front Wing" },
    { x: 300, y: 220, width: 60, height: 40, severity: "moderate", label: "Floor Edge" },
    { x: 450, y: 150, width: 50, height: 70, severity: "minor", label: "Sidepod" },
  ];

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

  // Handle zoom
  const handleZoomIn = () => setZoom(Math.min(zoom + 25, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 25, 50));

  // Handle analysis mode selection
  const handleSelectEntire = () => {
    setAnalysisMode("entire");
    setIsDrawing(false);
    setSelectedRegion(null);
  };

  const handleSelectRegion = () => {
    setAnalysisMode("region");
    setIsDrawing(true);
  };

  // Handle region drawing (simplified - would need actual canvas drawing implementation)
  const handleCanvasClick = () => {
    if (isDrawing) {
      // Simulate region selection
      setSelectedRegion({
        x: 200,
        y: 150,
        width: 150,
        height: 100,
      });
      setIsDrawing(false);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (analysisMode) {
      onNavigate?.("results", analysisMode, selectedRegion);
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
            <img src="/trackshift logo.png" alt="TrackShift" className="h-15 w-auto" />
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = false; // No active state on this intermediate page
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
            <h1 className="text-white text-3xl mb-2">Image Comparison Preview</h1>
            <p className="text-white/60">Review images and select analysis area before proceeding</p>
          </motion.div>

          {/* Controls Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Show/Hide Highlights */}
                    <div className="flex items-center gap-3">
                      <Label htmlFor="highlights" className="text-white">
                        Change Highlights
                      </Label>
                      <Switch
                        id="highlights"
                        checked={showHighlights}
                        onCheckedChange={setShowHighlights}
                        className="data-[state=checked]:bg-red-600"
                      />
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleZoomOut}
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-white text-sm w-12 text-center">{zoom}%</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleZoomIn}
                        className="border-white/30 text-white hover:bg-white/10"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded" />
                      <span className="text-white text-sm">Minor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded" />
                      <span className="text-white text-sm">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded" />
                      <span className="text-white text-sm">Severe</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Side-by-Side Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-2 gap-6">
              {/* Before Image */}
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Before Image</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFullscreenImage("before")}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                      disabled={isLoading}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-hidden rounded-lg border border-red-600/20 bg-black/50">
                    <div
                      className="relative"
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
                    >
                      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-900 to-black relative">
                        {/* Loading State */}
                        {isLoading && (
                          <div className="text-white text-center">
                            <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" />
                            <p className="text-lg mb-2">Processing Images...</p>
                            <p className="text-sm text-white/60">{loadingProgress}</p>
                          </div>
                        )}

                        {/* Error State */}
                        {error && !isLoading && (
                          <div className="text-red-400 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-red-500/10 rounded flex items-center justify-center">
                              <X className="w-8 h-8" />
                            </div>
                            <p>{error}</p>
                          </div>
                        )}

                        {/* Processed Image */}
                        {!isLoading && !error && processedBeforeImage && (
                          <img 
                            src={processedBeforeImage} 
                            alt="Before - Processed" 
                            className="w-full h-full object-contain"
                          />
                        )}

                        {/* Selected Region Overlay */}
                        {selectedRegion && analysisMode === "region" && (
                          <div
                            className="absolute border-4 border-blue-500 bg-blue-500/10 rounded"
                            style={{
                              left: selectedRegion.x,
                              top: selectedRegion.y,
                              width: selectedRegion.width,
                              height: selectedRegion.height,
                            }}
                          >
                            <Badge className="absolute -top-6 left-0 bg-blue-500 text-white text-xs">
                              Selected Region
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Drawing Canvas for Region Selection */}
                      {isDrawing && (
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 cursor-crosshair"
                          onClick={handleCanvasClick}
                        />
                      )}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-white/80 text-sm">Status: {isLoading ? "Processing..." : error ? "Error" : "Complete"}</p>
                    <p className="text-white/60 text-sm">Source: Manual Upload</p>
                    {!isLoading && !error && <p className="text-white/60 text-sm">AI-Classified Changes Detected</p>}
                  </div>
                </CardContent>
              </Card>

              {/* After Image */}
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">After Image</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFullscreenImage("after")}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                      disabled={isLoading}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-hidden rounded-lg border border-red-600/20 bg-black/50">
                    <div
                      className="relative"
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
                    >
                      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-gray-900 to-black relative">
                        {/* Loading State */}
                        {isLoading && (
                          <div className="text-white text-center">
                            <div className="w-16 h-16 mx-auto mb-4 border-4 border-white/20 border-t-red-600 rounded-full animate-spin" />
                            <p className="text-lg mb-2">Processing Images...</p>
                            <p className="text-sm text-white/60">{loadingProgress}</p>
                          </div>
                        )}

                        {/* Error State */}
                        {error && !isLoading && (
                          <div className="text-red-400 text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-red-500/10 rounded flex items-center justify-center">
                              <X className="w-8 h-8" />
                            </div>
                            <p>{error}</p>
                          </div>
                        )}

                        {/* Processed Image */}
                        {!isLoading && !error && processedAfterImage && (
                          <img 
                            src={processedAfterImage} 
                            alt="After - Processed" 
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-white/80 text-sm">Status: {isLoading ? "Processing..." : error ? "Error" : "Complete"}</p>
                    <p className="text-white/60 text-sm">Source: Manual Upload</p>
                    {!isLoading && !error && <p className="text-white/60 text-sm">AI-Classified Changes Detected</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* User Selection Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardHeader>
                <CardTitle className="text-white">Select Analysis Mode</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Analyze Entire Image */}
                  <Card
                    className={`cursor-pointer transition-all ${
                      analysisMode === "entire"
                        ? "bg-red-600/20 border-red-600 shadow-[0_0_20px_rgba(225,6,0,0.3)]"
                        : "bg-black/30 border-red-600/20 hover:border-red-600/40"
                    }`}
                    onClick={handleSelectEntire}
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center justify-center">
                          <Grid3x3 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-white text-lg mb-2">Analyze Entire Image</h3>
                        <p className="text-white/60 text-sm">
                          Run full analysis on the complete before/after comparison
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analyze Specific Region */}
                  <Card
                    className={`cursor-pointer transition-all ${
                      analysisMode === "region"
                        ? "bg-red-600/20 border-red-600 shadow-[0_0_20px_rgba(225,6,0,0.3)]"
                        : "bg-black/30 border-red-600/20 hover:border-red-600/40"
                    }`}
                    onClick={handleSelectRegion}
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center justify-center">
                          <PenTool className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-white text-lg mb-2">Analyze Specific Region</h3>
                        <p className="text-white/60 text-sm">
                          Draw or select a specific area to analyze in detail
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Drawing Tools (shown when region mode is active) */}
                <AnimatePresence>
                  {analysisMode === "region" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-red-600/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Label className="text-white">Drawing Tool:</Label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={drawingTool === "rectangle" ? "default" : "outline"}
                              onClick={() => setDrawingTool("rectangle")}
                              className={
                                drawingTool === "rectangle"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "border-white/30 text-white hover:bg-white/10"
                              }
                            >
                              <Square className="w-4 h-4 mr-2" />
                              Rectangle
                            </Button>
                            <Button
                              size="sm"
                              variant={drawingTool === "freeform" ? "default" : "outline"}
                              onClick={() => setDrawingTool("freeform")}
                              className={
                                drawingTool === "freeform"
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "border-white/30 text-white hover:bg-white/10"
                              }
                            >
                              <PenTool className="w-4 h-4 mr-2" />
                              Freeform
                            </Button>
                          </div>
                        </div>

                        {selectedRegion && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
                            Region Selected
                          </Badge>
                        )}
                      </div>

                      {isDrawing && (
                        <p className="text-white/60 text-sm mt-4">
                          Click on the before image to select a region for analysis
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex justify-center"
          >
            <Button
              onClick={handleContinue}
              disabled={!analysisMode || (analysisMode === "region" && !selectedRegion)}
              className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Analysis
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              className="absolute top-6 right-6 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <div className="relative max-w-6xl max-h-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white text-xl mb-4 text-center">
                {fullscreenImage === "before" ? "Before Image" : "After Image"}
              </h3>
              <div className="max-w-full max-h-[80vh] bg-gradient-to-br from-gray-900 to-black rounded-lg border-2 border-red-600/40 flex items-center justify-center p-20">
                <div className="text-white/40 text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-white/10 rounded flex items-center justify-center">
                    <Upload className="w-16 h-16" />
                  </div>
                  <p className="text-xl">{fullscreenImage === "before" ? "Before" : "After"} Image Fullscreen</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
