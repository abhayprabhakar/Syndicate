import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Eye,
  Copy,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Zap,
  Upload,
  Grid3x3,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

interface LedgerPageProps {
  onNavigate?: (page: string, moduleId?: string, transactionId?: string) => void;
}

interface LedgerRecord {
  id: string;
  timestamp: string;
  transactionId: string;
  blockHash: string;
  type: string;
  status: string;
}

type SortField = "timestamp" | "transactionId" | "blockHash" | "type" | "status";
type SortDirection = "asc" | "desc";

export function LedgerPage({ onNavigate }: LedgerPageProps) {
  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", id: "dashboard", icon: BarChart3 },
    { name: "Upload & Analyze", id: "upload", icon: Upload },
    { name: "Modules", id: "modules", icon: Grid3x3 },
    { name: "Results", id: "results", icon: BarChart3 },
    { name: "Ledger", id: "ledger", icon: BookOpen },
  ];

  // Mock ledger data
  const allRecords: LedgerRecord[] = [
    {
      id: "1",
      timestamp: "2025-11-15T14:32:18Z",
      transactionId: "0x7a9f3c2e1b4d8f6a2c9e5d7f3a8b1c4e6d9f2a5c8b7e4d1f9a6c3b8e5d2f7a4c",
      blockHash: "0x4f2e8a6b3c9d1e7f5a2c8b4d6e9f1a3c5b7e2d4f8a6c1b9e3d7f5a2c8b4d6e9f",
      type: "Automated Scan",
      status: "Completed",
    },
    {
      id: "2",
      timestamp: "2025-11-15T13:18:45Z",
      transactionId: "0x5b4d8f1a3c6e9d2f7a4c8b5e1d3f9a6c2b8e4d7f1a5c9b3e6d8f2a4c7b5e1d9f",
      blockHash: "0x3a1f7e5c2d9b4f8a6c1e3d7f9a2c5b8e4d1f6a9c3b7e5d2f8a4c6b1e9d3f7a5c",
      type: "Manual Inspection",
      status: "Reviewed",
    },
    {
      id: "3",
      timestamp: "2025-11-15T12:05:33Z",
      transactionId: "0x9e2c4a6b8d1f3c5e7a9b2d4f6c8e1a3b5d7f9c2e4a6b8d1f3c5e7a9b2d4f6c8e",
      blockHash: "0x8d5c3f1a7b9e2d6f4a8c1b5e9d3f7a2c6b4e8d1f9a5c3b7e2d6f8a4c1b9e5d3f",
      type: "Report Export",
      status: "Completed",
    },
    {
      id: "4",
      timestamp: "2025-11-15T11:22:11Z",
      transactionId: "0x3f8e2d5c7a1b9f4e6c8d2a5f7b3e9d1c4a6f8b2e5d7c9a1f4b6e8d3c5a7f9b2e",
      blockHash: "0x2e9a4f7c1b5d8e3a6f9c2b4d7e1f5a8c3b6e9d2f4a7c1b8e5d3f9a6c2b7e4d1f",
      type: "Hash Anchor",
      status: "Pending",
    },
    {
      id: "5",
      timestamp: "2025-11-15T10:47:29Z",
      transactionId: "0x6d1a9c4e7b2f5a8c3e6d9b1f4a7c2e5d8b3f6a9c1e4d7b2f5a8c3e6d9b1f4a7c",
      blockHash: "0x9f3e2d7a5c1b8e4f6a9c2d5e8b1f3a7c4e6d9b2f5a8c1e3d7f4a6c9b2e5d8f1a",
      type: "Automated Scan",
      status: "Failed",
    },
    {
      id: "6",
      timestamp: "2025-11-15T09:15:07Z",
      transactionId: "0x1c4e7a9b2d5f8c3e6a9b1d4f7c2e5a8b3d6f9c1e4a7b2d5f8c3e6a9b1d4f7c2e",
      blockHash: "0x7b5e3d1f9a6c2e8b4d7f1a5c9e3b6d8f2a4c7b1e5d9f3a6c8b2e4d7f1a5c9e3b",
      type: "Manual Inspection",
      status: "Completed",
    },
    {
      id: "7",
      timestamp: "2025-11-15T08:03:52Z",
      transactionId: "0x8b3e6d9a1c4f7e2a5c8b3d6f9a1c4e7b2d5f8a3c6e9b1d4f7a2c5e8b3d6f9a1c",
      blockHash: "0x4d8f1a6c3e9b2d7f5a1c8b4e6d9f2a3c5b7e1d4f8a6c2b9e3d7f5a1c8b4e6d9f",
      type: "Report Export",
      status: "Completed",
    },
    {
      id: "8",
      timestamp: "2025-11-15T06:41:19Z",
      transactionId: "0x2a5c7e9b4d1f6a8c3e5d7b9f1a4c6e8b2d5f7a9c3e6b8d1f4a7c2e5d9b3f6a8c",
      blockHash: "0x6c9e2d4f8a1b5e3d7f9a2c6b4e8d1f3a5c7b9e2d4f6a8c1b3e5d7f9a2c6b4e8d",
      type: "Automated Scan",
      status: "Reviewed",
    },
  ];

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  // Get unique types and statuses for filter dropdowns
  const types = ["all", ...Array.from(new Set(allRecords.map((r) => r.type)))];
  const statuses = ["all", ...Array.from(new Set(allRecords.map((r) => r.status)))];

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = allRecords.filter((record) => {
      const matchesSearch =
        searchQuery === "" ||
        record.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.blockHash.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || record.type === typeFilter;
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "timestamp") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allRecords, searchQuery, typeFilter, statusFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRecords.length / recordsPerPage);
  const paginatedRecords = filteredAndSortedRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Shorten hash
  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  // Get status badge color
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
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-white text-3xl mb-2">Ledger</h1>
            <p className="text-white/60">Audit trail of all saved inspections</p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-12 gap-4">
                  {/* Search Bar */}
                  <div className="col-span-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <Input
                      type="text"
                      placeholder="Search by hash or transaction ID"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 bg-black/50 border-red-600/30 text-white placeholder:text-white/40 focus:border-red-600"
                    />
                  </div>

                  {/* Type Filter */}
                  <div className="col-span-3">
                    <Select
                      value={typeFilter}
                      onValueChange={(value) => {
                        setTypeFilter(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="bg-black/50 border-red-600/30 text-white focus:border-red-600">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-red-600/30">
                        {types.map((type) => (
                          <SelectItem key={type} value={type} className="text-white focus:bg-red-600/20 focus:text-white">
                            {type === "all" ? "All Types" : type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="col-span-3">
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => {
                        setStatusFilter(value);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="bg-black/50 border-red-600/30 text-white focus:border-red-600">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-red-600/30">
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status} className="text-white focus:bg-red-600/20 focus:text-white">
                            {status === "all" ? "All Status" : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ledger Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="bg-[#0a0a0a] border-red-600/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-red-600/20">
                        <th
                          className="px-6 py-4 text-left text-white cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => handleSort("timestamp")}
                        >
                          <div className="flex items-center gap-2">
                            Timestamp
                            {sortField === "timestamp" && (
                              sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-white cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => handleSort("transactionId")}
                        >
                          <div className="flex items-center gap-2">
                            Transaction ID
                            {sortField === "transactionId" && (
                              sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-white cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => handleSort("blockHash")}
                        >
                          <div className="flex items-center gap-2">
                            Block Hash
                            {sortField === "blockHash" && (
                              sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-white cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => handleSort("type")}
                        >
                          <div className="flex items-center gap-2">
                            Type
                            {sortField === "type" && (
                              sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-white cursor-pointer hover:text-red-400 transition-colors"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-2">
                            Status
                            {sortField === "status" && (
                              sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-white">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.map((record, index) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 text-white/80">
                            {new Date(record.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="group relative inline-block">
                              <code className="text-white/80 text-sm">{shortenHash(record.transactionId)}</code>
                              <div className="absolute left-0 top-full mt-2 px-3 py-2 bg-black/90 border border-red-600/30 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {record.transactionId}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-white/80 text-sm">{shortenHash(record.blockHash)}</code>
                              <button
                                onClick={() => copyToClipboard(record.blockHash)}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                              >
                                <Copy className="w-4 h-4 text-white/40 hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white/80">{record.type}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs border ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                console.log("View button clicked for transaction:", record.id);
                                onNavigate?.("transaction-report", undefined, record.id);
                              }}
                              className="p-2 rounded-lg hover:bg-white/10 transition-colors group"
                              title="View transaction details"
                            >
                              <Eye className="w-5 h-5 text-white/60 group-hover:text-red-500 transition-colors" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-red-600/20">
                    <div className="text-white/60 text-sm">
                      Showing {(currentPage - 1) * recordsPerPage + 1} to{" "}
                      {Math.min(currentPage * recordsPerPage, filteredAndSortedRecords.length)} of{" "}
                      {filteredAndSortedRecords.length} records
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="border-red-600/30 text-white hover:bg-red-600/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={`border-red-600/30 hover:bg-red-600/20 ${
                              currentPage === page
                                ? "bg-red-600 text-white border-red-600"
                                : "text-white"
                            }`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="border-red-600/30 text-white hover:bg-red-600/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {paginatedRecords.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-white/60">No records found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
