import { useState } from "react";
import { motion } from "motion/react";
import {
  Zap,
  Upload,
  Grid3x3,
  BarChart3,
  BookOpen,
  Camera,
  FolderUp,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Video,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { uploadPipeline } from "../services/api";

interface UploadAnalyzePageProps {
  onNavigate?: (page: string) => void;
}

type UploadMode = "manual" | "automatic" | null;

export function UploadAnalyzePage({ onNavigate }: UploadAnalyzePageProps) {
  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", id: "dashboard", icon: BarChart3 },
    { name: "Upload & Analyze", id: "upload", icon: Upload },
    { name: "Modules", id: "modules", icon: Grid3x3 },
    { name: "Results", id: "results", icon: BarChart3 },
    { name: "Ledger", id: "ledger", icon: BookOpen },
  ];

  // State
  const [uploadMode, setUploadMode] = useState<UploadMode>(null);
  const [manufacturingMode, setManufacturingMode] = useState(false);
  const [raceMode, setRaceMode] = useState(false);
  
  // Manual upload state
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Automatic capture state
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [captureInterval, setCaptureInterval] = useState<string>("10");
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Available cameras
  const availableCameras = [
    { id: "cam1", name: "Pit Lane Camera 1", status: "online" },
    { id: "cam2", name: "Pit Lane Camera 2", status: "online" },
    { id: "cam3", name: "Garage Camera 1", status: "online" },
    { id: "cam4", name: "Inspection Bay Camera", status: "offline" },
  ];

  // Handle file upload
  const handleFileUpload = (type: "before" | "after", event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === "before") {
        setBeforeImage(file);
        toast.success("Before image uploaded");
      } else {
        setAfterImage(file);
        toast.success("After image uploaded");
      }
    }
  };

  // Handle camera selection
  const toggleCamera = (cameraId: string) => {
    setSelectedCameras((prev) =>
      prev.includes(cameraId) ? prev.filter((id) => id !== cameraId) : [...prev, cameraId]
    );
  };

  // Handle start capture
  const handleStartCapture = () => {
    if (selectedCameras.length === 0) {
      toast.error("Please select at least one camera");
      return;
    }
    setIsCameraActive(true);
    toast.success("Camera capture started");
    
    // Simulate capture and redirect
    setTimeout(() => {
      onNavigate?.("image-comparison");
    }, 1500);
  };

  // Handle continue to preview
  const handleContinueToPreview = async () => {
    if (!beforeImage || !afterImage) {
      toast.error("Please upload both before and after images");
      return;
    }

    setIsUploading(true);
    
    try {
      toast.loading("Uploading images to pipeline...");
      
      // Call the API to upload and process images
      const result = await uploadPipeline(beforeImage, afterImage);
      
      if (result.job_id) {
        setJobId(result.job_id);
        toast.success("Images uploaded successfully! Processing started...");
        
        // Navigate to image comparison page with jobId
        setTimeout(() => {
          onNavigate?.("image-comparison");
          // Store jobId in sessionStorage for the next page
          sessionStorage.setItem("currentJobId", result.job_id);
        }, 800);
      } else {
        throw new Error("No job ID returned from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images. Please try again.");
      setIsUploading(false);
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
            const isActive = item.id === "upload";
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
            <h1 className="text-white text-3xl mb-2">Upload & Analyze</h1>
            <p className="text-white/60">Upload images or capture from live camera feed</p>
          </motion.div>

          {/* Mode Toggles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-8">
                  {/* Manufacturing Mode */}
                  <div className="flex items-center gap-3">
                    <Label htmlFor="manufacturing-mode" className="text-white">
                      Manufacturing Mode
                    </Label>
                    <Switch
                      id="manufacturing-mode"
                      checked={manufacturingMode}
                      onCheckedChange={setManufacturingMode}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>

                  {/* Race Mode */}
                  <div className="flex items-center gap-3">
                    <Label htmlFor="race-mode" className="text-white">
                      Race Mode
                    </Label>
                    <Switch
                      id="race-mode"
                      checked={raceMode}
                      onCheckedChange={setRaceMode}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Upload Mode Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-white text-xl mb-4">Select Upload Method</h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Manual Upload */}
              <Card
                className={`cursor-pointer transition-all ${
                  uploadMode === "manual"
                    ? "bg-red-600/20 border-red-600 shadow-[0_0_20px_rgba(225,6,0,0.3)]"
                    : "bg-[#0a0a0a] border-red-600/20 hover:border-red-600/40"
                }`}
                onClick={() => setUploadMode("manual")}
              >
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center justify-center">
                      <FolderUp className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-white text-xl mb-2">Manual Upload</h3>
                    <p className="text-white/60 text-sm">Upload before and after images manually</p>
                  </div>
                </CardContent>
              </Card>

              {/* Automatic Capture */}
              <Card
                className={`cursor-pointer transition-all ${
                  uploadMode === "automatic"
                    ? "bg-red-600/20 border-red-600 shadow-[0_0_20px_rgba(225,6,0,0.3)]"
                    : "bg-[#0a0a0a] border-red-600/20 hover:border-red-600/40"
                }`}
                onClick={() => setUploadMode("automatic")}
              >
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center justify-center">
                      <Camera className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-white text-xl mb-2">Automatic Capture</h3>
                    <p className="text-white/60 text-sm">Capture images automatically from live cameras</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Manual Upload Section */}
          {uploadMode === "manual" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white">Upload Images</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Before Image */}
                    <div>
                      <Label htmlFor="before-upload" className="text-white mb-3 block">
                        Before Image
                      </Label>
                      <div className="border-2 border-dashed border-red-600/30 rounded-lg p-8 hover:border-red-600/50 transition-colors">
                        <input
                          id="before-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload("before", e)}
                        />
                        <label htmlFor="before-upload" className="cursor-pointer">
                          <div className="text-center">
                            {beforeImage ? (
                              <div>
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-white mb-1">{beforeImage.name}</p>
                                <p className="text-white/60 text-sm">
                                  {(beforeImage.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            ) : (
                              <div>
                                <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-3" />
                                <p className="text-white mb-1">Click to upload</p>
                                <p className="text-white/60 text-sm">PNG, JPG up to 10MB</p>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* After Image */}
                    <div>
                      <Label htmlFor="after-upload" className="text-white mb-3 block">
                        After Image
                      </Label>
                      <div className="border-2 border-dashed border-red-600/30 rounded-lg p-8 hover:border-red-600/50 transition-colors">
                        <input
                          id="after-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload("after", e)}
                        />
                        <label htmlFor="after-upload" className="cursor-pointer">
                          <div className="text-center">
                            {afterImage ? (
                              <div>
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-white mb-1">{afterImage.name}</p>
                                <p className="text-white/60 text-sm">
                                  {(afterImage.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            ) : (
                              <div>
                                <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-3" />
                                <p className="text-white mb-1">Click to upload</p>
                                <p className="text-white/60 text-sm">PNG, JPG up to 10MB</p>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  {beforeImage && afterImage && (
                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="text-green-400">Both images uploaded successfully</p>
                      </div>
                    </div>
                  )}

                  {uploadMode === "manual" && (!beforeImage || !afterImage) && (
                    <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <p className="text-yellow-400">Please upload both before and after images</p>
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <Button
                    onClick={handleContinueToPreview}
                    disabled={!beforeImage || !afterImage || isUploading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Uploading & Processing...
                      </>
                    ) : (
                      <>
                        Continue to Preview
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Automatic Capture Section */}
          {uploadMode === "automatic" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <Card className="bg-[#0a0a0a] border-red-600/20">
                <CardHeader>
                  <CardTitle className="text-white">Select Cameras</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Camera Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {availableCameras.map((camera) => (
                      <Card
                        key={camera.id}
                        className={`cursor-pointer transition-all ${
                          selectedCameras.includes(camera.id)
                            ? "bg-red-600/20 border-red-600"
                            : camera.status === "offline"
                            ? "bg-black/30 border-white/10 opacity-50 cursor-not-allowed"
                            : "bg-black/30 border-red-600/20 hover:border-red-600/40"
                        }`}
                        onClick={() => camera.status === "online" && toggleCamera(camera.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-600/10 border border-red-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Video className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-sm">{camera.name}</p>
                              <Badge
                                className={
                                  camera.status === "online"
                                    ? "bg-green-500/20 text-green-400 border-green-500/40 text-xs mt-1"
                                    : "bg-red-500/20 text-red-400 border-red-500/40 text-xs mt-1"
                                }
                              >
                                {camera.status}
                              </Badge>
                            </div>
                            {selectedCameras.includes(camera.id) && (
                              <CheckCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Capture Interval */}
                  <div className="mb-6 p-4 rounded-lg bg-black/30 border border-red-600/20">
                    <Label className="text-white mb-3 block">Capture Interval</Label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={captureInterval}
                        onChange={(e) => setCaptureInterval(e.target.value)}
                        className="flex-1 bg-black/50 border border-red-600/30 rounded-lg px-4 py-2 text-white"
                        min="5"
                        max="60"
                      />
                      <span className="text-white/60">seconds</span>
                    </div>
                  </div>

                  {/* Validation */}
                  {selectedCameras.length === 0 && (
                    <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                        <p className="text-yellow-400">Please select at least one camera</p>
                      </div>
                    </div>
                  )}

                  {selectedCameras.length > 0 && !isCameraActive && (
                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <p className="text-green-400">
                          {selectedCameras.length} camera{selectedCameras.length > 1 ? "s" : ""} selected
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Start Capture Button */}
                  <Button
                    onClick={handleStartCapture}
                    disabled={selectedCameras.length === 0 || isCameraActive}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCameraActive ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        Start Capture
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
