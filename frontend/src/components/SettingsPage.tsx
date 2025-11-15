import { useState } from "react";
import { Settings, User, Cpu, Save } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [layoutDensity, setLayoutDensity] = useState("comfortable");
  const [enabledModules, setEnabledModules] = useState({
    alignment: true,
    coarse: true,
    segmentation: true,
    classification: true,
    severity: true,
    filter: true,
    tracker: false,
  });

  const modules = [
    { id: "alignment", name: "Alignment Module (A)", description: "Spatial image alignment" },
    { id: "coarse", name: "Coarse Detection (B)", description: "Region-level difference detection" },
    { id: "segmentation", name: "Precise Segmentation (C)", description: "Pixel-level refinement" },
    { id: "classification", name: "Change Classification (D)", description: "Change type categorization" },
    { id: "severity", name: "Severity Estimation (E)", description: "Impact quantification" },
    { id: "filter", name: "False-Positive Filter (F)", description: "Noise removal" },
    { id: "tracker", name: "Temporal Tracker (G)", description: "Multi-frame tracking" },
  ];

  return (
    <div className="max-w-[1920px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white mb-2">Settings</h1>
        <p className="text-[#cfcfcf]">Configure your TrackShift Visual Engine preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Main Settings Area */}
        <div className="flex-1">
          <Card className="border-0 glass">
            <CardContent className="p-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/50 mb-6 border border-red-900/30">
                  <TabsTrigger value="general" className="text-white data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="modules" className="text-white data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Cpu className="w-4 h-4 mr-2" />
                    Modules
                  </TabsTrigger>
                  <TabsTrigger value="account" className="text-white data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <User className="w-4 h-4 mr-2" />
                    Account
                  </TabsTrigger>
                </TabsList>

                {/* General Preferences Tab */}
                <TabsContent value="general" className="space-y-6">
                  <div>
                    <h3 className="text-white mb-4">Appearance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 glass rounded-lg border border-red-900/30">
                        <div>
                          <Label htmlFor="dark-mode" className="text-white">
                            Dark Mode
                          </Label>
                          <p className="text-[#cfcfcf]">Use dark theme for the interface</p>
                        </div>
                        <Switch
                          id="dark-mode"
                          checked={darkMode}
                          onCheckedChange={setDarkMode}
                        />
                      </div>

                      <div className="p-4 glass rounded-lg border border-red-900/30">
                        <Label htmlFor="layout-density" className="text-white mb-2 block">
                          Layout Density
                        </Label>
                        <p className="text-[#cfcfcf] mb-3">Control spacing and component sizes</p>
                        <Select value={layoutDensity} onValueChange={setLayoutDensity}>
                          <SelectTrigger
                            id="layout-density"
                            className="bg-black/50 border-red-600/30 text-white"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-red-600/30 text-white">
                            <SelectItem value="compact" className="text-white">Compact</SelectItem>
                            <SelectItem value="comfortable" className="text-white">Comfortable</SelectItem>
                            <SelectItem value="spacious" className="text-white">Spacious</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white mb-4">Performance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 glass rounded-lg border border-red-900/30">
                        <div>
                          <Label htmlFor="gpu-acceleration" className="text-white">
                            GPU Acceleration
                          </Label>
                          <p className="text-[#cfcfcf]">Enable hardware acceleration for processing</p>
                        </div>
                        <Switch id="gpu-acceleration" defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 glass rounded-lg border border-red-900/30">
                        <div>
                          <Label htmlFor="auto-save" className="text-white">
                            Auto-Save Results
                          </Label>
                          <p className="text-[#cfcfcf]">Automatically save analysis results</p>
                        </div>
                        <Switch id="auto-save" defaultChecked />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Model Settings Tab */}
                <TabsContent value="modules" className="space-y-6">
                  <div>
                    <h3 className="text-white mb-4">Enable/Disable Modules</h3>
                    <p className="text-[#cfcfcf] mb-6">
                      Control which analysis modules are active in the pipeline
                    </p>
                    <div className="space-y-3">
                      {modules.map((module) => (
                        <div
                          key={module.id}
                          className="flex items-center justify-between p-4 glass rounded-lg border border-red-900/30"
                        >
                          <div>
                            <Label
                              htmlFor={`module-${module.id}`}
                              className="text-white cursor-pointer"
                            >
                              {module.name}
                            </Label>
                            <p className="text-[#cfcfcf]">{module.description}</p>
                          </div>
                          <Switch
                            id={`module-${module.id}`}
                            checked={enabledModules[module.id as keyof typeof enabledModules]}
                            onCheckedChange={(checked) =>
                              setEnabledModules((prev) => ({ ...prev, [module.id]: checked }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white mb-4">Detection Sensitivity</h3>
                    <div className="p-4 glass rounded-lg border border-red-900/30">
                      <Label htmlFor="sensitivity" className="text-white mb-2 block">
                        Sensitivity Level
                      </Label>
                      <p className="text-[#cfcfcf] mb-3">
                        Higher sensitivity detects more subtle changes
                      </p>
                      <Select defaultValue="balanced">
                        <SelectTrigger
                          id="sensitivity"
                          className="bg-black/50 border-red-600/30 text-white"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-red-600/30 text-white">
                          <SelectItem value="low" className="text-white">Low</SelectItem>
                          <SelectItem value="balanced" className="text-white">Balanced</SelectItem>
                          <SelectItem value="high" className="text-white">High</SelectItem>
                          <SelectItem value="maximum" className="text-white">Maximum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-6">
                  <div>
                    <h3 className="text-white mb-4">User Information</h3>
                    <div className="space-y-4">
                      <div className="p-4 glass rounded-lg border border-red-900/30">
                        <Label htmlFor="username" className="text-white mb-2 block">
                          Username
                        </Label>
                        <Input
                          id="username"
                          defaultValue="admin@trackshift.ai"
                          className="bg-black/50 border-red-600/30 text-white"
                        />
                      </div>

                      <div className="p-4 glass rounded-lg border border-red-900/30">
                        <Label htmlFor="organization" className="text-white mb-2 block">
                          Organization
                        </Label>
                        <Input
                          id="organization"
                          defaultValue="TrackShift Technologies"
                          className="bg-black/50 border-red-600/30 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white mb-4">API Configuration</h3>
                    <div className="space-y-4">
                      <div className="p-4 glass rounded-lg border border-red-900/30">
                        <Label htmlFor="api-key" className="text-white mb-2 block">
                          API Key
                        </Label>
                        <p className="text-[#cfcfcf] mb-3">
                          Your API key for programmatic access
                        </p>
                        <Input
                          id="api-key"
                          type="password"
                          defaultValue="ts_api_key_1234567890abcdef"
                          className="bg-black/50 border-red-600/30 text-white"
                        />
                      </div>

                      <div className="p-4 glass rounded-lg border border-red-900/30">
                        <Label htmlFor="webhook-url" className="text-white mb-2 block">
                          Webhook URL
                        </Label>
                        <p className="text-[#cfcfcf] mb-3">
                          Receive notifications on analysis completion
                        </p>
                        <Input
                          id="webhook-url"
                          placeholder="https://your-domain.com/webhook"
                          className="bg-black/50 border-red-600/30 text-white placeholder:text-[#cfcfcf]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white mb-4">Security</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 glass rounded-lg border border-red-900/30">
                        <div>
                          <Label htmlFor="two-factor" className="text-white">
                            Two-Factor Authentication
                          </Label>
                          <p className="text-[#cfcfcf]">Add an extra layer of security</p>
                        </div>
                        <Switch id="two-factor" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-8 right-8">
        <Button className="px-8 py-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
          <span className="relative z-10 flex items-center">
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </span>
        </Button>
      </div>
    </div>
  );
}
