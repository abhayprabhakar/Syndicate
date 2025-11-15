import { useState } from "react";
import { HomePage } from "./components/HomePage";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./components/DashboardPage";
import { UploadAnalyzePage } from "./components/UploadAnalyzePage";
import { ModulesPage } from "./components/ModulesPage";
import { ModuleDetailPage } from "./components/ModuleDetailPage";
import { ResultsPage } from "./components/ResultsPage";
import { ReportsPage } from "./components/ReportsPage";
import { SettingsPage } from "./components/SettingsPage";
import TeamMembersPage from "./components/TeamMembersPage";
import { LedgerPage } from "./components/LedgerPage";
import { TransactionReportPage } from "./components/TransactionReportPage";
import { ImageComparisonPage } from "./components/ImageComparisonPage";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentModuleId, setCurrentModuleId] = useState<string>("alignment");
  const [currentTransactionId, setCurrentTransactionId] = useState<string>("");
  const [analysisMode, setAnalysisMode] = useState<string>("entire");
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  const handleNavigate = (page: string, moduleId?: string, transactionId?: string, mode?: string, region?: any) => {
    setCurrentPage(page);
    if (moduleId) {
      setCurrentModuleId(moduleId);
    }
    if (transactionId) {
      setCurrentTransactionId(transactionId);
    }
    if (mode) {
      setAnalysisMode(mode);
    }
    if (region) {
      setSelectedRegion(region);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />;
      case "dashboard":
        return <DashboardPage onNavigate={handleNavigate} />;
      case "upload":
        return <UploadAnalyzePage onNavigate={handleNavigate} />;
      case "image-comparison":
        return <ImageComparisonPage onNavigate={handleNavigate} />;
      case "modules":
        return <ModulesPage onNavigate={handleNavigate} />;
      case "module-detail":
        return <ModuleDetailPage moduleId={currentModuleId} onNavigate={handleNavigate} />;
      case "results":
        return <ResultsPage onNavigate={handleNavigate} analysisMode={analysisMode} selectedRegion={selectedRegion} />;
      case "reports":
        return <ReportsPage />;
      case "team":
        return <TeamMembersPage />;
      case "ledger":
        return <LedgerPage onNavigate={handleNavigate} />;
      case "transaction-report":
        return <TransactionReportPage transactionId={currentTransactionId} onNavigate={handleNavigate} />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  // Show homepage and dashboard without layout, other pages with layout
  if (currentPage === "home" || currentPage === "dashboard" || currentPage === "ledger" || currentPage === "upload" || currentPage === "modules" || currentPage === "results" || currentPage === "transaction-report" || currentPage === "image-comparison") {
    return (
      <>
        {renderPage()}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Layout currentPage={currentPage} onNavigate={handleNavigate}>
        {renderPage()}
      </Layout>
      <Toaster />
    </>
  );
}