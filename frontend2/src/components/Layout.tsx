import { motion } from "motion/react";
import { Bell, User, Zap } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const navItems = [
    { name: "Dashboard", id: "dashboard" },
    { name: "Ledger", id: "ledger" },
    { name: "Settings", id: "settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-red-900/30 shadow-[0_4px_20px_rgba(225,6,0,0.15)]">
        <div className="max-w-[1920px] mx-auto px-8 py-4 flex items-center gap-8">
          {/* Logo + Brand - Now works as Home button */}
          <motion.div
            className="flex items-center cursor-pointer"
            onClick={() => onNavigate("home")}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img 
              src="/trackshift logo.png" 
              alt="TrackShift Logo" 
              className="h-12 w-auto object-contain"
            />
          </motion.div>

          {/* Center Navigation */}
          <div className="flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative px-4 py-2 rounded-lg transition-all duration-300 group ${
                  currentPage === item.id
                    ? "bg-red-600 text-white shadow-[0_0_15px_rgba(225,6,0,0.5)]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="relative z-10">{item.name}</span>
                {currentPage !== item.id && (
                  <motion.div
                    className="absolute inset-0 bg-red-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity"
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5 text-white/70" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-600 border-0 text-white">
                3
              </Badge>
            </button>
            <Avatar className="w-9 h-9 border-2 border-red-600">
              <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-20">{children}</main>
    </div>
  );
}