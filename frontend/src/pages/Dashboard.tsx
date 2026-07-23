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
  AlertTriangle,
  Check,
  AlertCircle,
  FileText,
  User,
  Stethoscope,
  Camera,
  Download,
  Image as FileImage
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
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';
  const changeLang = (lang: string) => i18n.changeLanguage(lang);
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [favoriteDoctors, setFavoriteDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "scans" | "analytics" | "compare" | "ocr" | "profile" | "favorites" | "messages">("home");

  const [patientProfile, setPatientProfile] = useState(() => {
    const saved = localStorage.getItem("patientProfile");
    return saved ? JSON.parse(saved) : {
      age: 28, gender: "Male", bloodGroup: "O+", allergies: "None", medicalHistory: "None"
    };
  });

  const [selectedCompareScans, setSelectedCompareScans] = useState<[HistoryItem | null, HistoryItem | null]>([null, null]);
  const [compareSliderPos, setCompareSliderPos] = useState(50);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("patientProfile", JSON.stringify(patientProfile));
    alert("Profile saved successfully.");
  };

  const handleDownloadFHIR = async (scanId: string) => {
    try {
      const response = await apiClient.get(`/reports/${scanId}/fhir`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `fhir_report_${scanId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading FHIR report:", err);
    }
  };

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOcrLoading(true);
      setOcrResult(null);
      try {
        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        const response = await apiClient.post("/nlp/ocr", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setOcrResult(response.data);
      } catch (err: any) {
        // Graceful fallback: show error in result
        setOcrResult({
          raw_text: err.response?.data?.detail || "OCR processing failed.",
          language_detected: "en",
          medicines: [],
          diseases: [],
          symptoms: [],
          safety_alerts: ["Could not process the image. Please upload a clearer photo."]
        });
      } finally {
        setOcrLoading(false);
      }
    }
  };

  const [medications, setMedications] = useState([
    { id: "med-1", name: "Tacrolimus Ointment 0.03%", dosage: "Apply twice daily", time: "Morning & Night", taken: false },
    { id: "med-2", name: "Desloratadine 5mg", dosage: "1 tablet daily", time: "Night", taken: true },
    { id: "med-3", name: "Cetaphil Gentle Moisturizer", dosage: "Liberal application", time: "Post-bath", taken: false },
  ]);

  const handleToggleMedication = (id: string) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const handleDownloadPDF = async (scanId: string) => {
    try {
      const lang = i18n.language || "en";
      const response = await apiClient.get(`/reports/${scanId}/pdf?lang=${lang}`, {
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Skin_Report_${scanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading PDF report:", err);
    }
  };

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
              { id: "compare", icon: FileImage, label: "Compare Scans" },
              { id: "ocr", icon: Camera, label: "Prescription OCR" },
              { id: "profile", icon: User, label: "Patient Profile" },
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

        {/* Language Selector */}
        <div className="flex flex-col items-center gap-1 mb-2">
          {[{code:'en',label:'EN'},{code:'hi',label:'हि'},{code:'gu',label:'ગુ'}].map(l => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              title={l.code === 'en' ? 'English' : l.code === 'hi' ? 'हिंदी' : 'ગુજરાતી'}
              className={`h-8 w-10 rounded-lg text-[10px] font-bold transition-all ${
                currentLang === l.code
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >{l.label}</button>
          ))}
        </div>

        {/* Settings button */}
        <button onClick={() => setActiveTab("profile")} className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#273449] hover:text-slate-600 dark:hover:text-[#CBD5E1] transition">
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
              <p className="text-slate-400 dark:text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">{t('dashboard.title')} / {activeTab}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC] mt-1">
                {activeTab === "home" && t('dashboard.greeting', { name: username })}
                {activeTab === "scans" && t('dashboard.scan_history')}
                {activeTab === "analytics" && t('dashboard.ai_analytics')}
                {activeTab === "compare" && t('dashboard.compare_scans')}
                {activeTab === "ocr" && t('dashboard.prescription_ocr')}
                {activeTab === "profile" && t('dashboard.patient_profile')}
                {activeTab === "favorites" && t('dashboard.saved_doctors')}
                {activeTab === "messages" && t('dashboard.symptom_chat')}
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
                {/* Body Map Widget */}
                <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm">
                  <div className="flex-1 space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                      <User size={20} className="text-blue-500" /> Interactive Lesion Map
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                      Track the physical locations of your previous scans. Hover over pins to see diagnosis details. Click a pin to filter your timeline.
                    </p>
                    <div className="flex gap-3 mt-2">
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Mild</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="h-2 w-2 rounded-full bg-amber-500" /> Moderate</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold"><div className="h-2 w-2 rounded-full bg-rose-500" /> Severe</span>
                    </div>
                  </div>
                  <div className="relative h-64 w-48 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-visible">
                    {/* SVG Mannequin Outline */}
                    <svg viewBox="0 0 100 200" className="h-[90%] w-full opacity-30 drop-shadow-md">
                      <path d="M50 10 C40 10 35 20 35 30 C35 40 45 45 50 45 C55 45 65 40 65 30 C65 20 60 10 50 10 Z" fill="#94A3B8" />
                      <path d="M50 50 C30 50 20 60 20 80 L20 120 C20 125 25 125 25 120 L30 80 L35 120 C35 150 35 190 35 190 C35 195 45 195 45 190 L45 140 L55 140 L55 190 C55 195 65 195 65 190 C65 190 65 150 65 120 L70 80 L75 120 C75 125 80 125 80 120 L80 80 C80 60 70 50 50 50 Z" fill="#94A3B8" />
                    </svg>
                    {/* Interactive Pins */}
                    {history.slice(0, 4).map((item, idx) => {
                      const positions = [
                        { top: "25%", left: "40%" }, // Neck
                        { top: "45%", left: "60%" }, // Right Arm
                        { top: "65%", left: "45%" }, // Abdomen
                        { top: "80%", left: "35%" }, // Left Leg
                      ];
                      const pos = positions[idx % positions.length];
                      const isSevere = item.severity === "Severe";
                      const isModerate = item.severity === "Moderate";
                      return (
                        <div 
                          key={item._id}
                          className="absolute group cursor-pointer z-10"
                          style={{ top: pos.top, left: pos.left }}
                          onClick={() => {
                            setScanSearch(item.primary_disease_title || item.primary_disease);
                            setActiveTab("scans");
                          }}
                        >
                          <div className={`h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#1E293B] shadow-sm ${isSevere ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`} />
                          
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-slate-900 dark:bg-slate-700 text-white text-[10px] rounded-xl p-2.5 opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 shadow-xl text-center">
                            <p className="font-bold mb-1 truncate">{item.primary_disease_title || item.primary_disease}</p>
                            <p className="text-[9px] text-slate-300">{Math.round(item.confidence * 100)}% Conf • {item.severity}</p>
                            <p className="text-[8px] text-blue-300 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

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

                <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-100 dark:border-[#334155]/60 ml-4 py-2 space-y-8">
                  {filteredHistory.length > 0 ? (
                    [...filteredHistory]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((item) => {
                        const isSevere = item.severity === "Severe";
                        const isModerate = item.severity === "Moderate";
                        const dotColor = isSevere 
                          ? "bg-rose-500 ring-rose-500/20" 
                          : isModerate 
                            ? "bg-amber-500 ring-amber-500/20" 
                            : "bg-emerald-500 ring-emerald-500/20";
                        
                        return (
                          <motion.div
                            key={item._id}
                            layout
                            className="relative group"
                          >
                            {/* Timeline node bullet */}
                            <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 h-4 w-4 rounded-full border-4 border-white dark:border-[#1E293B] ring-4 ${dotColor} z-10 transition-all`} />

                            {/* Timeline Card */}
                            <div className="rounded-3xl border border-slate-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5">
                              <div className="flex items-start gap-4">
                                <img src={item.image_url} alt="" className="h-16 w-16 rounded-2xl object-cover bg-slate-50 border border-slate-100 dark:border-[#334155] shrink-0" />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-sm">
                                      {item.primary_disease_title || item.primary_disease.replace(/_/g, " ")}
                                    </h3>
                                    <span className="text-[10px] bg-slate-50 dark:bg-[#0B1220]/40 text-slate-450 dark:text-[#94A3B8] px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-mono">Report ID: {item._id}</p>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-blue-500">{Math.round(item.confidence * 100)}% Confidence</span>
                                    <SeverityBadge severity={item.severity} />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50 dark:border-[#334155]/20 justify-end">
                                <button
                                  onClick={() => handleDownloadFHIR(item._id)}
                                  className="h-9 px-4 bg-slate-50 hover:bg-emerald-50 dark:bg-[#0B1220]/30 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-[#334155] text-slate-700 dark:text-[#CBD5E1] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-emerald-600 hover:border-emerald-200 transition"
                                  title="Export Standardized HL7 FHIR Observation JSON"
                                >
                                  <Download size={14} /> Export FHIR
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(item._id)}
                                  className="h-9 px-4 bg-slate-50 hover:bg-blue-50 dark:bg-[#0B1220]/30 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-[#334155] text-slate-700 dark:text-[#CBD5E1] rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:text-blue-500 hover:border-blue-200 transition"
                                  title="Download Printable PDF Medical Report"
                                >
                                  <FileText size={14} /> PDF Report
                                </button>
                                
                                <Link
                                  to={`/results/${item._id}`}
                                  className="h-9 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 hover:border-blue-600 shadow-sm transition"
                                >
                                  Explain AI <ChevronRight size={14} />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                  ) : (
                    <p className="text-center py-12 text-slate-400 text-xs w-full ml-[-20px]">No scan history matches your query.</p>
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

            {/* 3.1 COMPARE TAB */}
            {activeTab === "compare" && (
              <motion.div
                key="compare"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-sm">
                  <h3 className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileImage size={20} className="text-blue-500" /> {t('compare.title')}
                  </h3>
                  
                  {/* Selectors */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('compare.baseline')}</label>
                      <select 
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-800 dark:text-[#F8FAFC] outline-none"
                        onChange={(e) => setSelectedCompareScans([history.find(h => h._id === e.target.value) || null, selectedCompareScans[1]])}
                      >
                        <option value="">Select a scan...</option>
                        {history.map(h => <option key={h._id} value={h._id}>{h.primary_disease_title || h.primary_disease} ({new Date(h.created_at).toLocaleDateString()})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('compare.followup')}</label>
                      <select 
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-xs text-slate-800 dark:text-[#F8FAFC] outline-none"
                        onChange={(e) => setSelectedCompareScans([selectedCompareScans[0], history.find(h => h._id === e.target.value) || null])}
                      >
                        <option value="">Select a scan...</option>
                        {history.map(h => <option key={h._id} value={h._id}>{h.primary_disease_title || h.primary_disease} ({new Date(h.created_at).toLocaleDateString()})</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Slider View */}
                  {selectedCompareScans[0] && selectedCompareScans[1] ? (
                    <div className="space-y-6">
                      <div className="relative h-64 md:h-96 w-full rounded-2xl overflow-hidden group select-none">
                        {/* Baseline Image */}
                        <img src={selectedCompareScans[0].image_url} className="absolute inset-0 h-full w-full object-cover" alt="Baseline" />
                        {/* Follow-up Image */}
                        <div 
                          className="absolute inset-0 h-full w-full object-cover"
                          style={{ clipPath: `inset(0 ${100 - compareSliderPos}% 0 0)` }}
                        >
                          <img src={selectedCompareScans[1].image_url} className="h-full w-full object-cover" alt="Follow-up" />
                        </div>
                        {/* Slider handle */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-md"
                          style={{ left: `${compareSliderPos}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none">
                            <span className="text-slate-400 text-[10px]">||</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="0" max="100" value={compareSliderPos}
                          onChange={(e) => setCompareSliderPos(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                        />
                        <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-[10px] backdrop-blur-sm pointer-events-none">Baseline</div>
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-[10px] backdrop-blur-sm pointer-events-none">Follow-up</div>
                      </div>

                      {/* SSIM Results */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 text-center">
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">Structural Similarity (SSIM)</p>
                          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">0.82</p>
                          <p className="text-[9px] text-emerald-600/70 mt-1">Significant structural change detected</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 text-center">
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">Lesion Diameter Change</p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">-3.4 mm</p>
                          <p className="text-[9px] text-blue-600/70 mt-1">Healing progress observed</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
                      {t('compare.select_both')}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 3.2 OCR TAB */}
            {activeTab === "ocr" && (
              <motion.div
                key="ocr"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-sm">
                  <h3 className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-lg mb-4 flex items-center gap-2">
                    <Camera size={20} className="text-blue-500" /> {t('ocr.title')}
                  </h3>
                  
                  <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-3xl p-8 text-center bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition cursor-pointer relative">
                    <Camera size={32} className="mx-auto text-blue-400 mb-3" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{t('ocr.upload_prompt')}</p>
                    <p className="text-[10px] text-blue-500/70 mt-1">{t('ocr.upload_hint')}</p>
                    <input type="file" onChange={handleOcrUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" />
                  </div>

                  {ocrLoading && (
                    <div className="mt-6 flex flex-col items-center justify-center space-y-3 py-8">
                      <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-slate-500 font-mono">{t('ocr.processing')}</p>
                    </div>
                  )}

                  {ocrResult && !ocrLoading && (
                    <div className="mt-6 space-y-4">

                      {/* Language detected badge */}
                      {ocrResult.language_detected && (
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100">
                            {t("dashboard.ocr_lang_detected")}: {ocrResult.language_detected.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Safety Alerts */}
                      {ocrResult.safety_alerts && ocrResult.safety_alerts.length > 0 && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
                          <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-2">
                            <AlertTriangle size={14} /> {t("dashboard.ocr_safety_alert")}
                          </h4>
                          <ul className="list-disc pl-5 text-[10px] text-rose-700 dark:text-rose-400 space-y-1">
                            {ocrResult.safety_alerts.map((alert: string, i: number) => <li key={i}>{alert}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Medicines */}
                      {ocrResult.medicines && ocrResult.medicines.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-[#F8FAFC] mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                            {t("dashboard.ocr_medicines")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {ocrResult.medicines.map((med: string, i: number) => (
                              <span key={i} className="px-3 py-1 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100">
                                💊 {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Diseases */}
                      {ocrResult.diseases && ocrResult.diseases.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-[#F8FAFC] mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                            {t("dashboard.ocr_diseases")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {ocrResult.diseases.map((d: string, i: number) => (
                              <span key={i} className="px-3 py-1 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100">
                                🏥 {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Symptoms */}
                      {ocrResult.symptoms && ocrResult.symptoms.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-[#F8FAFC] mb-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                            {t("dashboard.ocr_symptoms")}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {ocrResult.symptoms.map((s: string, i: number) => (
                              <span key={i} className="px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100">
                                🔍 {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw text */}
                      {ocrResult.raw_text && (
                        <div>
                          <h4 className="font-bold text-xs text-slate-500 dark:text-[#94A3B8] mb-2 uppercase tracking-wide">
                            {t("dashboard.ocr_raw_text")}
                          </h4>
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-600 dark:text-[#CBD5E1] font-mono leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {ocrResult.raw_text}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Nothing found */}
                      {!ocrResult.medicines?.length && !ocrResult.diseases?.length && !ocrResult.symptoms?.length && !ocrResult.safety_alerts?.length && (
                        <p className="text-xs text-slate-400 text-center py-4">{t("dashboard.ocr_no_result")}</p>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* 3.3 PROFILE TAB */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-sm">
                  <h3 className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-lg mb-4 flex items-center gap-2">
                    <User size={20} className="text-blue-500" /> {t('profile.title')}
                  </h3>
                  
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('profile.age')}</label>
                        <input type="number" value={patientProfile.age} onChange={e => setPatientProfile({...patientProfile, age: parseInt(e.target.value)})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:border-blue-400 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('profile.gender')}</label>
                        <select value={patientProfile.gender} onChange={e => setPatientProfile({...patientProfile, gender: e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:border-blue-400 outline-none">
                          <option>{t('profile.gender_male')}</option>
                          <option>{t('profile.gender_female')}</option>
                          <option>{t('profile.gender_other')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('profile.blood_group')}</label>
                        <select value={patientProfile.bloodGroup} onChange={e => setPatientProfile({...patientProfile, bloodGroup: e.target.value})} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:border-blue-400 outline-none">
                          <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('profile.allergies')}</label>
                        <input type="text" value={patientProfile.allergies} onChange={e => setPatientProfile({...patientProfile, allergies: e.target.value})} placeholder={t('profile.allergies_placeholder')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:border-blue-400 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">{t('profile.medical_history')}</label>
                      <textarea value={patientProfile.medicalHistory} onChange={e => setPatientProfile({...patientProfile, medicalHistory: e.target.value})} placeholder={t('profile.medical_history_placeholder')} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-[#F8FAFC] focus:border-blue-400 outline-none h-24 resize-none" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition">
                        {t('profile.save_profile')}
                      </button>
                    </div>
                  </form>
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Treatment Tracker</h2>
              <span className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] px-2 py-1 rounded-md font-bold uppercase">Today</span>
            </div>

            {/* Medicine Tracker Widget */}
            <div className="bg-slate-50/50 dark:bg-[#273449]/30 border border-slate-100 dark:border-[#334155]/60 rounded-3xl p-5 shadow-xs space-y-4">
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-wider">Medication & Reminders</p>
              
              <div className="space-y-3">
                {medications.map((med) => (
                  <div 
                    key={med.id} 
                    onClick={() => handleToggleMedication(med.id)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155]/50 hover:border-blue-300 dark:hover:border-blue-700/50 cursor-pointer shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition ${
                        med.taken 
                          ? "bg-blue-500 border-blue-500 text-white" 
                          : "border-slate-300 dark:border-slate-600 text-transparent"
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${med.taken ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-[#CBD5E1]"}`}>
                          {med.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-0.5">{med.dosage}</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-slate-100 dark:bg-[#0B1220]/40 text-slate-500 dark:text-[#94A3B8] px-2 py-1 rounded-lg font-medium">{med.time}</span>
                  </div>
                ))}
              </div>

              {/* Progress summary */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#334155]/40 flex justify-between items-center text-[10px] text-slate-500 dark:text-[#94A3B8]">
                <span>Daily Adherence</span>
                <span className="font-bold text-slate-700 dark:text-[#F8FAFC]">
                  {medications.filter(m => m.taken).length} of {medications.length} taken ({Math.round((medications.filter(m => m.taken).length / medications.length) * 100)}%)
                </span>
              </div>
            </div>

            {/* Follow-up Reminders / Risk Alert */}
            <div className="bg-slate-50/50 dark:bg-[#273449]/30 border border-slate-100 dark:border-[#334155]/60 rounded-3xl p-5 shadow-xs space-y-4">
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-wider">Clinical Alerts & Warnings</p>
              
              <div className="space-y-3">
                {/* Alert 1 */}
                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={15} />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Dermatologist Consult Required</h4>
                    <p className="text-[10px] text-slate-600 dark:text-[#94A3B8] leading-relaxed mt-1">
                      Your recent scan for *Atopic Dermatitis* is flagged as Moderate severity. We recommend booking a consult within 7 days.
                    </p>
                  </div>
                </div>

                {/* Alert 2 */}
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <Calendar className="text-blue-500 shrink-0 mt-0.5" size={15} />
                  <div>
                    <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400">Next Skin Assessment</h4>
                    <p className="text-[10px] text-slate-600 dark:text-[#94A3B8] leading-relaxed mt-1">
                      Scheduled skin follow-up scan is due in **3 days** (July 26, 2026). Keep tracking lesion borders daily.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>



        </div>

      </div>

    </div>
  );
}
