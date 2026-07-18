import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import SeverityBadge from "../components/SeverityBadge";
import { apiClient } from "../api/client";
import { Doctor } from "../types";
import { 
  Home, 
  Activity, 
  Heart, 
  MessageSquare, 
  Settings, 
  Bell, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Phone,
  Mic,
  Play,
  Volume2,
  Share2,
  Bookmark,
  ChevronRight,
  Plus,
  Cpu,
  Layers,
  Send,
  Trash2,
  Gauge,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

interface HistoryItem {
  _id: string;
  primary_disease: string;
  primary_disease_title?: string;
  severity: "Mild" | "Moderate" | "Severe";
  confidence: number;
  image_url: string;
  created_at: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [favoriteDoctors, setFavoriteDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "scans" | "analytics" | "favorites" | "messages">("home");
  const [isRecording, setIsRecording] = useState(false);

  // Chat symptoms assistant states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: "1", sender: "ai", text: "Hello! I am your AI clinical assistant. Tell me about any skin changes, symptoms, or ask details about your recent analyses." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Scans filter search
  const [scanSearch, setScanSearch] = useState("");

  // Default fallback doctors if favorites is empty
  const defaultDoctors: Doctor[] = [
    {
      id: "doc-1",
      name: "Dr. Katherine Moss",
      specialization: "Dermatologist & Laser Specialist",
      city: "Mumbai",
      state: "Maharashtra",
      clinic_name: "Aesthetic Skin Clinic",
      address: "12, Linking Road, Bandra West",
      latitude: 19.0607,
      longitude: 72.8363,
      rating: 4.8,
      reviews_count: 178,
      phone: "+91 98765 43210",
      timings: "10:00 AM - 6:00 PM"
    },
    {
      id: "doc-2",
      name: "Dr. Kelly William",
      specialization: "Clinical & Pediatric Dermatologist",
      city: "Bangalore",
      state: "Karnataka",
      clinic_name: "Fortis La Femme",
      address: "Vittal Mallya Road, Richmond Town",
      latitude: 12.9716,
      longitude: 77.5946,
      rating: 4.6,
      reviews_count: 124,
      phone: "+91 80 4032 5000",
      timings: "11:00 AM - 5:00 PM"
    }
  ];

  useEffect(() => {
    // Fetch History
    apiClient
      .get<HistoryItem[]>("/dashboard/history")
      .then((res) => setHistory(res.data))
      .catch((err) => console.error("Error fetching history:", err))
      .finally(() => setLoading(false));

    // Fetch local appointments
    const appts = localStorage.getItem("appointments");
    if (appts) setAppointments(JSON.parse(appts));

    // Fetch favorite doctors
    const favIds = localStorage.getItem("favorite_doctors");
    if (favIds) {
      const ids = JSON.parse(favIds) as string[];
      apiClient.get<Doctor[]>("/doctors").then((res) => {
        const filtered = res.data.filter((doc) => ids.includes(doc.id));
        setFavoriteDoctors(filtered);
      }).catch((err) => console.error("Error fetching doctors:", err));
    }
  }, []);

  // AI model diagnostic stats
  const diseaseDistribution = [
    { name: "Eczema", count: 420 },
    { name: "Acne", count: 340 },
    { name: "Psoriasis", count: 210 },
    { name: "Fungal", count: 180 },
    { name: "Melanoma", count: 90 },
  ];

  const inferenceSpeedData = [
    { name: "Mon", latency: 195 },
    { name: "Tue", latency: 182 },
    { name: "Wed", latency: 188 },
    { name: "Thu", latency: 175 },
    { name: "Fri", latency: 180 },
    { name: "Sat", latency: 190 },
    { name: "Sun", latency: 185 },
  ];

  // Vitals dummy datasets matching reference curves
  const hydrationData = [
    { day: "Mon", value: 82 },
    { day: "Tue", value: 85 },
    { day: "Wed", value: 81 },
    { day: "Thu", value: 88 },
    { day: "Fri", value: 86 },
    { day: "Sat", value: 89 },
    { day: "Sun", value: 90 },
  ];

  const melaninData = [
    { day: "Mon", value: 90 },
    { day: "Tue", value: 91 },
    { day: "Wed", value: 92 },
    { day: "Thu", value: 92 },
    { day: "Fri", value: 93 },
    { day: "Sat", value: 92 },
    { day: "Sun", value: 92 },
  ];

  const uvData = [
    { day: "Mon", value: 120 },
    { day: "Tue", value: 180 },
    { day: "Wed", value: 240 },
    { day: "Thu", value: 210 },
    { day: "Fri", value: 280 },
    { day: "Sat", value: 220 },
    { day: "Sun", value: 225 },
  ];

  function handleCancelAppointment(id: string) {
    const updated = appointments.filter((a) => a.id !== id);
    setAppointments(updated);
    localStorage.setItem("appointments", JSON.stringify(updated));
  }

  function handleSendChatMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: `chat_${Date.now()}`, sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    const queryText = chatInput;
    setChatInput("");
    setChatLoading(true);

    // Simulate AI clinical reply
    setTimeout(() => {
      let reply = "I've registered your input. For skin lesion questions, please run a Scan check. If it feels severe, booking a dermatologist consultation is highly recommended.";
      if (queryText.toLowerCase().includes("eczema") || queryText.toLowerCase().includes("itch")) {
        reply = "Based on eczema indicators: apply moisturizer, avoid hot baths, and avoid harsh detergents. Ensure UV index exposure is limited.";
      } else if (queryText.toLowerCase().includes("appointment") || queryText.toLowerCase().includes("doctor")) {
        reply = "To schedule a consult, navigate to the Doctors tab, select a dermatologist, and select your date and time.";
      }
      
      setChatMessages((prev) => [...prev, { id: `chat_reply_${Date.now()}`, sender: "ai", text: reply }]);
      setChatLoading(false);
    }, 1200);
  }

  const displayedDoctors = favoriteDoctors.length > 0 ? favoriteDoctors : defaultDoctors;
  const username = user?.full_name ? user.full_name.split(" ")[0] : "Lisa";

  // Filtered scans list
  const filteredHistory = history.filter(item => 
    (item.primary_disease_title || item.primary_disease).toLowerCase().includes(scanSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] flex font-body text-slate-800 dark:text-[#CBD5E1] transition-all duration-300">
      
      {/* ── Left Navigation Sidebar ───────────────────────────────────── */}
      <div className="w-20 bg-white dark:bg-[#0B1220] border-r border-slate-100 dark:border-[#334155] flex flex-col items-center py-8 justify-between shrink-0 z-10 shadow-[4px_0_24px_rgba(240,242,245,0.4)] dark:shadow-none transition-colors duration-300">
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Brand Logo */}
          <Link to="/upload" className="relative flex items-center justify-center h-12 w-12 rounded-[1.25rem] bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-md shadow-blue-500/20 hover:scale-105 transition">
            <Sparkles size={20} className="animate-pulse" />
          </Link>

          {/* Nav Icons list */}
          <div className="flex flex-col gap-5 w-full px-2">
            {[
              { id: "home", icon: Home, label: "Home" },
              { id: "scans", icon: Activity, label: "Scan History" },
              { id: "analytics", icon: Cpu, label: "AI Analytics" },
              { id: "favorites", icon: Heart, label: "Saved Doctors" },
              { id: "messages", icon: MessageSquare, label: "Symptom Chat" }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative group flex flex-col items-center justify-center py-3.5 w-full rounded-2xl transition-all duration-200 ${
                    active 
                      ? "bg-blue-50 dark:bg-[#273449] text-blue-600 dark:text-[#F8FAFC]" 
                      : "text-slate-400 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#273449]/40 hover:text-slate-600 dark:hover:text-[#CBD5E1]"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  
                  {/* Indicator bar */}
                  {active && (
                    <span className="absolute left-0 w-1 h-8 rounded-r bg-blue-500" />
                  )}

                  <span className="absolute left-24 bg-slate-800 dark:bg-[#1E293B] text-white dark:text-[#F8FAFC] text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-700/10 dark:border-[#334155] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-md">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings button */}
        <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#273449] hover:text-slate-600 dark:hover:text-[#CBD5E1] transition">
          <Settings size={20} />
        </button>
      </div>

      {/* ── Main content grid layout ───────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden">
        
        {/* Central Workspace (Main Dash features) */}
        <div className="xl:col-span-8 p-6 md:p-8 overflow-y-auto space-y-8 max-w-5xl">
          
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-slate-400 dark:text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">Dashboard / {activeTab}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC] mt-1">
                {activeTab === "home" && `Hello, ${username}!`}
                {activeTab === "scans" && "Scan History"}
                {activeTab === "analytics" && "AI Diagnostic Analytics"}
                {activeTab === "favorites" && "Saved Specialists"}
                {activeTab === "messages" && "AI Symptoms Chat"}
              </h1>
            </div>
            
            {/* Search and Alert Badges */}
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input 
                  type="text" 
                  placeholder="Search symptoms, metrics..."
                  className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 w-56 shadow-[0_4px_16px_rgba(240,242,245,0.4)] dark:shadow-none focus:ring-4 focus:ring-blue-500/10 text-slate-800 dark:text-[#F8FAFC] transition"
                />
              </div>
              
              {/* Notification button */}
              <button className="relative h-10 w-10 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-2xl flex items-center justify-center text-slate-500 dark:text-[#CBD5E1] hover:text-slate-850 dark:hover:text-white shadow-[0_4px_16px_rgba(240,242,245,0.4)] dark:shadow-none transition">
                <Bell size={16} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#1E293B]" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            
            {/* 1. HOME TAB */}
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Vitals row (Lavender Locator Map) */}
                <div className="w-full">
                  
                  {/* Locator map preview */}
                  <div className="relative overflow-hidden rounded-[2rem] bg-violet-50 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-900/30 p-7 min-h-[190px] flex flex-col justify-between shadow-[0_12px_24px_rgba(240,242,245,0.4)] dark:shadow-none">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-violet-900 dark:text-violet-200 font-semibold text-base leading-tight">Found Doctors Near You</h3>
                        <p className="text-violet-600/70 dark:text-violet-400/70 text-xs mt-1">2 dermatologists in your area</p>
                      </div>
                      <button onClick={() => setActiveTab("favorites")} className="h-10 w-10 rounded-2xl bg-white dark:bg-[#1E293B] border border-violet-200/50 dark:border-[#334155] flex items-center justify-center text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-[#273449] transition shadow-sm">
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    {/* Simplified Dot Grid Route Graphic */}
                    <div className="relative h-20 w-full rounded-2xl bg-white/60 dark:bg-[#1E293B]/40 border border-violet-200/20 dark:border-violet-800/20 mt-3 p-3 flex items-center justify-between overflow-hidden shadow-inner">
                      {/* Simulated Grid Nodes */}
                      <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 gap-2 p-3 opacity-20">
                        {Array.from({ length: 18 }).map((_, i) => (
                          <div key={i} className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        ))}
                      </div>
                      
                      <div className="z-10 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <p className="text-violet-900 dark:text-violet-200 font-semibold text-xs leading-none">Aesthetic Skin Clinic</p>
                          <p className="text-[10px] text-violet-600 dark:text-violet-400 mt-1">1.2 km away • Bandra</p>
                        </div>
                      </div>

                      <div className="h-2 w-2 rounded-full bg-violet-500 animate-ping absolute right-8 top-8" />
                      <div className="h-2 w-2 rounded-full bg-violet-500 absolute right-8 top-8" />
                    </div>
                  </div>
                </div>

                {/* Categories Grid */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC]">Quick Actions</h2>

                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                    {[
                      { 
                        title: "Lesion Scan", 
                        count: "Run AI checks", 
                        bg: "bg-blue-50/50 dark:bg-blue-950/15 hover:bg-blue-50 dark:hover:bg-blue-950/20 border-blue-100 dark:border-blue-900/30", 
                        text: "text-blue-600 dark:text-blue-400",
                        badgeBg: "bg-blue-100/50 dark:bg-blue-900/30",
                        icon: "🔍" 
                      },
                      { 
                        title: "Acne Tracker", 
                        count: "Monitor severity", 
                        bg: "bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30", 
                        text: "text-emerald-600 dark:text-emerald-400",
                        badgeBg: "bg-emerald-100/50 dark:bg-emerald-900/30",
                        icon: "✨" 
                      },
                      { 
                        title: "Melanoma Check", 
                        count: "High priority risk", 
                        bg: "bg-rose-50/50 dark:bg-rose-950/15 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-100 dark:border-rose-900/30", 
                        text: "text-rose-600 dark:text-rose-400",
                        badgeBg: "bg-rose-100/50 dark:bg-rose-900/30",
                        icon: "⚠️" 
                      }
                    ].map((cat, idx) => (
                      <Link
                        key={idx}
                        to="/upload"
                        className={`group border rounded-3xl p-5 flex flex-col justify-between items-start transition-all duration-300 hover:-translate-y-1 hover:shadow-md min-h-[140px] ${cat.bg}`}
                      >
                        <div className={`h-11 w-11 rounded-2xl ${cat.badgeBg} flex items-center justify-center text-xl`}>
                          {cat.icon}
                        </div>
                        <div>
                          <h3 className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-sm leading-tight group-hover:text-blue-500 transition">
                            {cat.title}
                          </h3>
                          <p className="text-slate-400 dark:text-[#94A3B8] text-[10px] mt-1">{cat.count}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Scans lists & Appointments */}
                <div className="grid gap-6 md:grid-cols-2">
                  
                  {/* Scans list */}
                  <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-sm">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                      <Clock size={18} className="text-blue-500" /> Recent Analyses
                    </h2>

                    {loading ? (
                      <p className="text-slate-400 text-xs py-8 text-center animate-pulse">Loading scan history...</p>
                    ) : history.length === 0 ? (
                      <div className="border border-dashed border-slate-200 dark:border-[#334155] rounded-3xl p-8 text-center text-slate-450 text-xs">
                        No scan files recorded yet.
                        <div className="mt-3">
                          <Link to="/upload" className="inline-flex items-center gap-1 bg-blue-500 text-white rounded-full px-4 py-2 font-semibold hover:bg-blue-600 text-2xs transition">
                            <Plus size={10} /> Scan Skin Lesion
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {history.slice(0, 4).map((item) => (
                          <Link
                            key={item._id}
                            to={`/results/${item._id}`}
                            className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 dark:border-[#334155]/60 hover:border-blue-100 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-[#273449]/40 transition w-full"
                          >
                            <div className="flex items-center gap-3">
                              <img src={item.image_url} alt="" className="h-10 w-10 rounded-xl object-cover bg-slate-50 border border-slate-100 dark:border-[#334155]" />
                              <div className="text-left">
                                <h4 className="font-semibold text-slate-800 dark:text-[#F8FAFC] text-xs leading-snug truncate max-w-[130px]">
                                  {item.primary_disease_title || item.primary_disease.replace(/_/g, " ")}
                                </h4>
                                <span className="text-[9px] text-slate-400 dark:text-[#94A3B8]">{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-2xs font-bold text-amber-500">{Math.round(item.confidence * 100)}%</span>
                              <SeverityBadge severity={item.severity} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Appointments */}
                  <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-sm">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC] mb-4 flex items-center gap-2">
                      <Calendar size={18} className="text-blue-500" /> Appointments
                    </h2>

                    {appointments.length === 0 ? (
                      <div className="border border-dashed border-slate-200 dark:border-[#334155] rounded-3xl p-8 text-center text-slate-450 text-xs">
                        No appointments scheduled.
                        <div className="mt-3">
                          <Link to="/doctors" className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full px-4 py-2 font-semibold hover:bg-blue-100 transition text-2xs">
                            Find Dermatologists
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                        {appointments.map((appt) => (
                          <div key={appt.id} className="p-3 border border-slate-50 dark:border-[#334155]/60 rounded-2xl flex flex-col justify-between gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-semibold text-slate-800 dark:text-[#F8FAFC] text-xs">{appt.providerName}</h4>
                                <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-0.5">{appt.clinic}</p>
                              </div>
                              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                                {appt.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-[#94A3B8] border-t border-slate-50 dark:border-[#334155]/30 pt-2">
                              <span>📅 {appt.date} at {appt.time}</span>
                              <button
                                onClick={() => handleCancelAppointment(appt.id)}
                                className="text-[9px] text-rose-500 hover:underline font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Doctors Cards List */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC]">Top Specialists</h2>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {displayedDoctors.map((doc) => (
                      <div 
                        key={doc.id}
                        className="bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-3xl p-5 shadow-sm flex justify-between items-center gap-3 hover:-translate-y-0.5 transition duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-[#273449] dark:to-[#1e293b] text-blue-800 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-white dark:border-[#334155] shadow-sm shrink-0">
                            {doc.name.split(" ").slice(1).map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm leading-none">{doc.name}</h4>
                              <span className="h-3.5 w-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold" title="Verified">✓</span>
                            </div>
                            <p className="text-slate-400 dark:text-[#94A3B8] text-[10px] mt-1">{doc.specialization}</p>
                            
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-amber-500 text-xs">★</span>
                              <span className="text-slate-800 dark:text-[#CBD5E1] text-[10px] font-bold">{doc.rating || 4.7}</span>
                              <span className="text-slate-400 dark:text-[#94A3B8] text-[9px]">({doc.reviews_count || 100} reviews)</span>
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to="/doctors"
                          className="h-9 px-4 bg-slate-50 dark:bg-[#273449] border border-slate-100 dark:border-[#334155] text-slate-700 dark:text-[#CBD5E1] rounded-2xl text-[10px] font-semibold flex items-center justify-center hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 hover:border-blue-500 dark:hover:border-blue-600 transition whitespace-nowrap shadow-2xs"
                        >
                          Consult
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. SCANS HISTORY TAB */}
            {activeTab === "scans" && (
              <motion.div
                key="scans"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Search / filter control */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={scanSearch}
                    onChange={(e) => setScanSearch(e.target.value)}
                    placeholder="Search diagnostic classification titles..."
                    className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] pl-11 pr-4 py-3.5 text-xs outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 dark:text-[#F8FAFC] transition shadow-xs"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        className="rounded-3xl border border-slate-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-4">
                          <img src={item.image_url} alt="" className="h-16 w-16 rounded-2xl object-cover bg-slate-50 border border-slate-100 dark:border-[#334155]" />
                          <div className="space-y-1">
                            <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm">
                              {item.primary_disease_title || item.primary_disease.replace(/_/g, " ")}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {item._id.slice(0, 8)}...</p>
                            <p className="text-[10px] text-slate-450 dark:text-[#94A3B8]">📅 {new Date(item.created_at).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-[#334155]/30 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xs font-bold text-blue-500">{Math.round(item.confidence * 100)}% Match</span>
                            <SeverityBadge severity={item.severity} />
                          </div>
                          
                          <Link
                            to={`/results/${item._id}`}
                            className="text-xs font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1.5"
                          >
                            Review Details <ChevronRight size={14} />
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="col-span-2 text-center py-12 text-slate-400 text-xs">No scan history matches your query.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. AI ANALYTICS TAB (NEW PREMIUM WIDGETS) */}
            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* AI metrics card grid */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  {[
                    { title: "Accuracy", value: "94.2%", status: "Optimal", desc: "Overall model metric", color: "text-emerald-500", icon: CheckCircle },
                    { title: "F1 Score", value: "0.938", status: "+0.02", desc: "Balanced performance", color: "text-blue-500", icon: Layers },
                    { title: "Precision", value: "94.0%", status: "+0.01", desc: "Low false alarms", color: "text-indigo-500", icon: TrendingUp },
                    { title: "Recall", value: "93.6%", status: "Robust", desc: "High detection rate", color: "text-purple-500", icon: Cpu }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                        <stat.icon size={16} className={stat.color} />
                      </div>
                      <div className="mt-4">
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">{stat.value}</h4>
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
                          <span className="font-semibold">{stat.status}</span>
                          <span>• {stat.desc}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* System health and GPU status */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2rem] p-5 shadow-xs col-span-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-sm flex items-center gap-2">
                        <Cpu size={16} className="text-blue-500" /> GPU Hardware Status
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Inference node: NVIDIA Tesla T4</p>
                    </div>

                    <div className="my-5 flex flex-col items-center justify-center">
                      {/* Simulated circular gauge progress */}
                      <div className="relative h-24 w-24 rounded-full border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent border-r-transparent animate-spin duration-[4000ms]" />
                        <div className="text-center">
                          <span className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">28%</span>
                          <span className="block text-[8px] text-slate-400 uppercase font-mono">Load</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-450 dark:text-[#CBD5E1] border-t border-slate-50 dark:border-[#334155]/20 pt-2.5">
                      <span>VRAM: <b>4.2 / 16 GB</b></span>
                      <span>Temp: <b>64°C</b></span>
                    </div>
                  </div>

                  {/* Inference Latency */}
                  <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2rem] p-5 shadow-xs col-span-2 flex flex-col justify-between">
                    <div>
                      <h3 className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-sm flex items-center gap-2">
                        <Gauge size={16} className="text-emerald-500" /> Inference Latency
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">Classification time per image frame</p>
                    </div>

                    <div className="h-28 w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={inferenceSpeedData} margin={{ left: -25, right: 0, top: 5, bottom: 0 }}>
                          <defs>
                            <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: "#1E293B", borderColor: "#334155", color: "#F8FAFC", borderRadius: "12px", fontSize: "10px" }} />
                          <Area type="monotone" dataKey="latency" stroke="#3B82F6" strokeWidth={2} fill="url(#latencyGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-450 dark:text-[#CBD5E1] border-t border-slate-50 dark:border-[#334155]/20 pt-2.5">
                      <span>Avg Speed: <b>185ms</b></span>
                      <span>Health status: <b className="text-emerald-500">Normal</b></span>
                    </div>
                  </div>
                </div>

                {/* Disease Distribution Chart */}
                <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-sm">
                  <h3 className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-sm mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" /> Historical Disease Distribution
                  </h3>
                  
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={diseaseDistribution} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "#1E293B", borderColor: "#334155", color: "#F8FAFC", borderRadius: "12px", fontSize: "10px" }} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </motion.div>
            )}

            {/* 4. SAVED DOCTORS TAB */}
            {activeTab === "favorites" && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {displayedDoctors.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      className="rounded-3xl border border-slate-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 shadow-xs flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-[#273449] dark:to-[#1e293b] text-blue-800 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-white dark:border-[#334155] shadow-sm shrink-0">
                          {doc.name.split(" ").slice(1).map(n => n[0]).join("")}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm flex items-center gap-1.5">
                            {doc.name}
                            <span className="h-3.5 w-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                          </h3>
                          <p className="text-slate-400 text-[10px] font-medium">{doc.specialization}</p>
                          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                            <span>★ {doc.rating}</span>
                            <span className="text-slate-400 font-normal">({doc.reviews_count} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-2xs text-slate-500 dark:text-[#94A3B8] border-t border-slate-50 dark:border-[#334155]/30 pt-3">
                        <p className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-blue-500 shrink-0" />
                          <span>{doc.clinic_name} — {doc.address}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone size={12} className="text-blue-500 shrink-0" />
                          <span>{doc.phone}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock size={12} className="text-blue-500 shrink-0" />
                          <span>{doc.timings}</span>
                        </p>
                      </div>

                      <div className="flex gap-2 border-t border-slate-50 dark:border-[#334155]/20 pt-3">
                        <Link
                          to="/doctors"
                          className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-center text-xs shadow-xs"
                        >
                          Book Consult Appointment
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 5. SYMPTOM ASSISTANT CHAT TAB */}
            {activeTab === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 flex flex-col h-[520px] justify-between shadow-xs"
              >
                {/* Chat window */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 border-b border-slate-50 dark:border-[#334155]/30 scrollbar-thin">
                  {chatMessages.map((msg) => {
                    const ai = msg.sender === "ai";
                    return (
                      <div key={msg.id} className={`flex items-start gap-2.5 ${ai ? "justify-start" : "justify-end"}`}>
                        {ai && (
                          <div className="h-8 w-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs font-bold font-mono">AI</div>
                        )}
                        <div className={`max-w-[70%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                          ai 
                            ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-[#CBD5E1] border border-slate-100 dark:border-slate-700/50" 
                            : "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-xs"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex items-start gap-2.5 justify-start">
                      <div className="h-8 w-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs font-bold font-mono animate-pulse">AI</div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 animate-pulse flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-450 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-450 animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-450 animate-bounce delay-150" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input row */}
                <form onSubmit={handleSendChatMessage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Describe symptoms (e.g., itchy red skin rash)..."
                    className="flex-1 rounded-2xl border border-slate-100 dark:border-[#334155] bg-slate-50 dark:bg-slate-800 px-4 py-3 text-xs outline-none focus:border-blue-300 focus:bg-white dark:focus:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] transition"
                  />
                  <button
                    type="submit"
                    className="h-11 w-11 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition shadow-md shadow-blue-500/10 shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* ── Right sidebar layout (Vitals & Audio Widget) ──────────────── */}
        <div className="xl:col-span-4 bg-white dark:bg-[#1E293B] border-l border-slate-100 dark:border-[#334155] p-6 md:p-8 space-y-8 flex flex-col justify-between overflow-y-auto transition-colors duration-300">
          <div className="space-y-6">
            
            {/* Sidebar header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Skin Vitals</h2>
              <span className="bg-slate-50 dark:bg-[#273449] border border-slate-100 dark:border-[#334155]/60 text-slate-400 dark:text-[#94A3B8] text-[9px] px-2 py-1 rounded-md font-mono">LIVE TRACKING</span>
            </div>

            {/* Sleep/Skin Hydration indicator */}
            <div className="bg-slate-50/50 dark:bg-[#273449]/30 border border-slate-100 dark:border-[#334155]/60 rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-400 dark:text-[#94A3B8] text-[10px] font-medium uppercase tracking-wider">Skin Hydration</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">80-90%</p>
                </div>
                <div className="h-6 px-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded text-emerald-700 dark:text-emerald-400 text-[9px] font-bold flex items-center justify-center">
                  Optimal
                </div>
              </div>
              
              {/* Mini Area Chart */}
              <div className="h-16 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hydrationData} margin={{ left: -10, right: 0, top: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hydrationGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip content={<div />} />
                    <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#hydrationGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Melanin Saturation indicator */}
            <div className="bg-slate-50/50 dark:bg-[#273449]/30 border border-slate-100 dark:border-[#334155]/60 rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-400 dark:text-[#94A3B8] text-[10px] font-medium uppercase tracking-wider">Melanin Index</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">92%</p>
                </div>
                <div className="h-6 px-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded text-blue-700 dark:text-blue-400 text-[9px] font-bold flex items-center justify-center">
                  Stable
                </div>
              </div>
              
              {/* Mini Line Chart */}
              <div className="h-16 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={melaninData} margin={{ left: -10, right: 0, top: 5, bottom: 0 }}>
                    <Tooltip content={<div />} />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* UV Exposure indicator */}
            <div className="bg-slate-50/50 dark:bg-[#273449]/30 border border-slate-100 dark:border-[#334155]/60 rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-400 dark:text-[#94A3B8] text-[10px] font-medium uppercase tracking-wider">UV Exposure</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">225 uW</p>
                </div>
                <div className="h-6 px-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded text-rose-700 dark:text-rose-400 text-[9px] font-bold flex items-center justify-center">
                  Moderate
                </div>
              </div>
              
              {/* Mini Line Chart */}
              <div className="h-16 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={uvData} margin={{ left: -10, right: 0, top: 5, bottom: 0 }}>
                    <Tooltip content={<div />} />
                    <Line type="monotone" dataKey="value" stroke="#EC4899" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Voice recorder Assistant Widget */}
          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-[#334155]/30">
            
            {/* Player controls row */}
            <div className="bg-blue-600/90 text-white rounded-3xl p-4 flex items-center justify-between gap-4 shadow-lg shadow-blue-500/10 backdrop-blur">
              <div className="flex items-center gap-3">
                <button className="h-9 w-9 rounded-2xl bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition">
                  <Play size={14} fill="currentColor" />
                </button>
                <div className="flex gap-0.5 items-end h-5">
                  {/* Waveform graphic bars */}
                  {[3, 6, 8, 4, 9, 5, 8, 7, 4, 6, 9, 3, 5, 7, 4].map((h, i) => (
                    <div 
                      key={i} 
                      className={`w-0.5 bg-white/60 rounded-full transition-all ${
                        isRecording ? "animate-pulse" : ""
                      }`} 
                      style={{ height: `${h * 2}px` }} 
                      title="Audio Track Wavebar"
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-white/80 pr-1">00:30</span>
            </div>

            {/* Mic trigger button */}
            <div className="flex justify-center w-full relative">
              <motion.button 
                onClick={() => setIsRecording(!isRecording)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg transition ${
                  isRecording 
                    ? "bg-rose-500 shadow-rose-500/20" 
                    : "bg-blue-500 shadow-blue-500/20"
                }`}
              >
                <Mic size={24} />
                {isRecording && (
                  <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
                )}
              </motion.button>
            </div>
            
            <p className="text-center text-slate-400 dark:text-[#94A3B8] text-[10px] mt-1 font-semibold">
              {isRecording ? "Listening to symptoms..." : "Tap to ask AI voice assistant"}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
