import { motion } from "motion/react";
import { Zap } from "lucide-react";

interface RaceNavbarProps {
  onNavigate: (page: string) => void;
}

export function RaceNavbar({ onNavigate }: RaceNavbarProps) {
  const navItems = [
    { name: "Dashboard", id: "dashboard" },
    { name: "Ledger", id: "ledger" },
    { name: "Settings", id: "settings" },
  ];

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-red-900/30"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-[1920px] mx-auto px-12 py-5 flex items-center justify-between">
        {/* Logo */}
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
            <span className="text-xl text-white tracking-wider" style={{ fontFamily: 'system-ui' }}>
              TRACKSHIFT AI
            </span>
            <div className="h-0.5 w-full bg-gradient-to-r from-red-600 to-transparent" />
          </div>
        </motion.div>

        {/* Navigation Items */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative text-white/80 hover:text-white transition-colors tracking-wide uppercase"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {item.name}
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-600"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}