import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Search, MapPin, Phone, Clock, Star, Heart, Calendar, AlertCircle, Navigation, Shield, X, Check } from "lucide-react";
import { apiClient } from "../api/client";
import { Doctor } from "../types";
import { motion, AnimatePresence } from "framer-motion";

import { STATE_MAP_DATA } from "./india_map_constant";

const ACTIVE_STATES = [
  "Gujarat", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", 
  "Chandigarh", "Haryana", "Telangana", "West Bengal", "Puducherry", 
  "Rajasthan", "Madhya Pradesh", "Uttar Pradesh", "Kerala"
];

const POPULAR_CITIES = [
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Delhi", state: "Delhi" },
  { name: "Bengaluru", state: "Karnataka" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Surat", state: "Gujarat" },
  { name: "Hyderabad", state: "Telangana" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Kochi", state: "Kerala" },
  { name: "Lucknow", state: "Uttar Pradesh" },
];

const SUGGESTED_CITIES = [
  "Ahmedabad", "Anand", "Bengaluru", "Bhopal", "Delhi", "Hyderabad", "Indore", "Junagadh", 
  "Karamsad", "Kochi", "Lucknow", "Mehsana", "Mumbai", "Navsari", "Patan", "Pune", 
  "Surat", "Thiruvananthapuram", "Vadnagar", "Valsad"
];

export default function Doctors() {
  const { t } = useTranslation();
  const locationState = useLocation().state as { city?: string } | null;

  const [activeTab, setActiveTab] = useState<"doctors" | "hospitals">("doctors");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [city, setCity] = useState(locationState?.city || "");
  const [selectedState, setSelectedState] = useState<string>("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // Favorites and Appointments
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState<any | null>(null);
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem("favorite_doctors");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    // Fetch doctors
    const params: any = {};
    if (city) params.city = city;
    else if (selectedState) params.state = selectedState;

    apiClient.get<Doctor[]>("/doctors", { params }).then((res) => setDoctors(res.data))
      .catch(err => console.error("Error fetching doctors list:", err));
  }, [city, selectedState]);

  useEffect(() => {
    // Fetch hospitals
    const params: any = {};
    if (city) params.city = city;
    else if (selectedState) params.state = selectedState;

    apiClient.get<any[]>("/doctors/hospitals", { params }).then((res) => setHospitals(res.data))
      .catch(err => console.error("Error fetching hospitals list:", err));
  }, [city, selectedState]);

  function handleToggleFavorite(docId: string) {
    let updated;
    if (favorites.includes(docId)) {
      updated = favorites.filter((id) => id !== docId);
      apiClient.delete(`/doctors/favorites/${docId}`).catch(err => console.error(err));
    } else {
      updated = [...favorites, docId];
      apiClient.post(`/doctors/favorites/${docId}`).catch(err => console.error(err));
    }
    setFavorites(updated);
    localStorage.setItem("favorite_doctors", JSON.stringify(updated));
  }

  function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!showAppointmentModal) return;

    const newAppt = {
      id: `appt_${Date.now()}`,
      providerId: showAppointmentModal.id,
      providerName: showAppointmentModal.name,
      providerType: activeTab,
      clinic: showAppointmentModal.clinic_name || showAppointmentModal.address,
      city: showAppointmentModal.city,
      ...appointmentForm,
      status: "Confirmed",
      created_at: new Date().toISOString(),
    };

    // Save in localStorage
    const current = localStorage.getItem("appointments");
    const list = current ? JSON.parse(current) : [];
    list.push(newAppt);
    localStorage.setItem("appointments", JSON.stringify(list));

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setShowAppointmentModal(null);
      setAppointmentForm({ patientName: "", phone: "", date: "", time: "", notes: "" });
    }, 2000);
  }

  return (
    <div className="relative z-10 mx-auto mt-10 max-w-5xl px-6 pb-20 font-body text-slate-800 dark:text-[#CBD5E1]">
      
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-[#334155] pb-5 mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC]">Healthcare Directory</h1>
        <p className="mt-1 text-slate-505 dark:text-[#94A3B8] text-sm">
          Locate licensed dermatologists, specialized skin clinics, and clinical resources across Indian states.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-8 md:grid-cols-12">
        
        {/* Left column: Search and Interactive Map (span-4) */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Search filters */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(240,242,245,0.3)] dark:shadow-none">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] mb-4">Location Filters</h3>
            
            <div className="space-y-4">
              <div className="relative" ref={suggestionsRef}>
                <Search className="absolute left-3 top-3 text-slate-400 dark:text-[#94A3B8]" size={15} />
                <input
                  placeholder="Search by city (e.g. Mumbai)"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setSelectedState("");
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] pl-9 pr-4 py-2.5 text-xs outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 placeholder-slate-400 dark:placeholder-[#64748B] text-slate-800 dark:text-[#CBD5E1] transition"
                />
                {showCitySuggestions && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 p-3 bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                    {city.trim() === "" ? (
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-wider mb-2">Suggested Cities</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {POPULAR_CITIES.map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => {
                                setCity(item.name);
                                setSelectedState(item.state);
                                setShowCitySuggestions(false);
                              }}
                              className="text-left px-2.5 py-1.5 text-[10px] rounded-lg bg-slate-50 hover:bg-blue-50 dark:bg-[#0B1220]/30 dark:hover:bg-blue-950/30 text-slate-600 dark:text-[#CBD5E1] border border-slate-100/50 dark:border-[#334155]/20 hover:border-blue-200 transition-all font-medium"
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const filteredCities = SUGGESTED_CITIES.filter(c => 
                          c.toLowerCase().includes(city.toLowerCase()) && c.toLowerCase() !== city.toLowerCase()
                        );
                        return filteredCities.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-wider mb-2">Suggested Matches</p>
                            {filteredCities.map((cityName) => (
                              <button
                                key={cityName}
                                type="button"
                                onClick={() => {
                                  setCity(cityName);
                                  const stateObj = POPULAR_CITIES.find(pc => pc.name === cityName);
                                  if (stateObj) setSelectedState(stateObj.state);
                                  setShowCitySuggestions(false);
                                }}
                                className="w-full text-left px-2.5 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-[#0B1220]/40 text-slate-700 dark:text-[#CBD5E1] transition-colors"
                              >
                                {cityName}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 text-center py-2">No suggested cities match</p>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1.5 ml-1">State Selection</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setCity("");
                  }}
                  className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-2.5 text-xs outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 text-slate-700 dark:text-[#CBD5E1] transition"
                >
                  <option value="">All States</option>
                  {ACTIVE_STATES.map((stateName) => (
                    <option key={stateName} value={stateName}>{stateName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interactive State Map */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(240,242,245,0.3)] dark:shadow-none">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] mb-3">Interactive States</h3>
            
            <div className="relative flex items-center justify-center bg-blue-50/10 dark:bg-blue-950/5 rounded-2xl border border-slate-50 dark:border-[#334155]/30 p-4 h-64 shadow-inner">
              <svg viewBox="0 0 612 696" className="w-full h-full max-h-56 filter drop-shadow-sm">
                {STATE_MAP_DATA.map((state) => {
                  const isActive = ACTIVE_STATES.includes(state.id);
                  const isSelected = selectedState === state.id;
                  return (
                    <motion.path
                      key={state.id}
                      d={state.path}
                      stroke="currentColor"
                      strokeWidth="0.8"
                      className={`transition-colors duration-200 ${
                        isSelected 
                          ? "fill-blue-500 text-blue-600 dark:fill-blue-600 dark:text-blue-500" 
                          : isActive 
                            ? "fill-blue-50/80 dark:fill-blue-950/20 text-blue-300/80 dark:text-blue-700/60 cursor-pointer hover:fill-blue-200/80 dark:hover:fill-blue-900/50" 
                            : "fill-slate-100/60 dark:fill-slate-800/40 text-slate-200 dark:text-slate-700/30 cursor-pointer hover:fill-slate-200/90 dark:hover:fill-slate-700/60"
                      }`}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedState(isSelected ? "" : state.id);
                        setCity("");
                      }}
                    />
                  );
                })}
              </svg>
              <div className="absolute bottom-2 inset-x-2 text-[9px] text-slate-400 dark:text-[#94A3B8] leading-normal text-center border-t border-slate-50 dark:border-[#334155]/30 pt-2 bg-white/70 dark:bg-[#1E293B]/70 backdrop-blur-2xs rounded-lg">
                Click state to filter. Highlighted states have active clinics.
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Tab content listing (span-8) */}
        <div className="md:col-span-8 space-y-5">
          
          {/* Tab selector */}
          <div className="flex border-b border-slate-100 dark:border-[#334155]/30 font-semibold gap-1">
            {[
              { id: "doctors", label: `Dermatologists (${doctors.length})` },
              { id: "hospitals", label: `Clinical Centers (${hospitals.length})` }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 px-5 py-3 transition-all text-xs font-bold ${
                    active 
                      ? "border-blue-500 text-blue-600 dark:text-blue-400" 
                      : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-[#CBD5E1]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Cards listing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {activeTab === "doctors" ? (
                doctors.length > 0 ? (
                  doctors.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative rounded-[2rem] border border-slate-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <button
                        onClick={() => handleToggleFavorite(doc.id)}
                        className="absolute right-4 top-4 text-slate-300 dark:text-slate-650 hover:text-rose-500 transition-colors"
                      >
                        <Heart size={18} fill={favorites.includes(doc.id) ? "#F43F5E" : "none"} className={favorites.includes(doc.id) ? "text-rose-500" : ""} />
                      </button>
                      
                      <div>
                        <span className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                          {doc.specialization}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-3">
                          <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base leading-none">{doc.name}</h3>
                          <span className="h-3.5 w-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px]">✓</span>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-semibold">
                          <span>★</span>
                          <span className="text-slate-700 dark:text-[#CBD5E1] font-bold">{doc.rating}</span>
                          <span className="text-slate-400 dark:text-[#94A3B8] text-[10px]">({doc.reviews_count} reviews)</span>
                        </div>
                        
                        <div className="space-y-2 mt-4 text-xs text-slate-505 dark:text-[#94A3B8]">
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="shrink-0 text-blue-500 mt-0.5" />
                            <span><strong>{doc.clinic_name}</strong><br/>{doc.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="shrink-0 text-blue-500" />
                            <span>{doc.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="shrink-0 text-blue-500" />
                            <span>{doc.timings}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-50 dark:border-[#334155]/30 flex gap-2">
                        <button
                          onClick={() => setShowAppointmentModal(doc)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-2xs bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full py-2.5 font-bold shadow-xs shadow-blue-500/10 transition"
                        >
                          <Calendar size={13} /> Book Appointment
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="col-span-2 text-center py-12 text-slate-400 text-xs">No dermatologists found matching criteria.</p>
                )
              ) : (
                hospitals.length > 0 ? (
                  hospitals.map((hos) => (
                    <motion.div
                      key={hos.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-[2rem] border border-slate-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            hos.type === "Government" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                          }`}>
                            {hos.type} Center
                          </span>
                          {hos.emergency && (
                            <span className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-455 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-0.5">
                              <AlertCircle size={9} /> 24/7 ER
                            </span>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-slate-900 dark:text-[#F8FAFC] text-base leading-snug mt-3">{hos.name}</h3>
                        
                        <div className="space-y-2 mt-4 text-xs text-slate-505 dark:text-[#94A3B8]">
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="shrink-0 text-blue-500 mt-0.5" />
                            <span>{hos.address}, {hos.city}, {hos.state}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="shrink-0 text-blue-500" />
                            <span>{hos.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3.5 border-t border-slate-50 dark:border-[#334155]/30 flex gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hos.latitude},${hos.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 text-2xs border border-slate-100 dark:border-[#334155] text-slate-600 dark:text-[#CBD5E1] rounded-full py-2.5 font-bold hover:bg-slate-50 dark:hover:bg-[#273449] transition text-center shadow-2xs"
                        >
                          <Navigation size={12} /> Directions
                        </a>
                        <button
                          onClick={() => setShowAppointmentModal(hos)}
                          className="flex-1 flex items-center justify-center gap-1 text-2xs bg-blue-500 text-white rounded-full py-2.5 font-bold hover:bg-blue-600 transition"
                        >
                          <Calendar size={13} /> Request Care
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="col-span-2 text-center py-12 text-slate-400 text-xs">No clinical centers found matching criteria.</p>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Appointment Booking Modal */}
      <AnimatePresence>
        {showAppointmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[2.5rem] border border-slate-100 dark:border-[#334155] bg-white dark:bg-[#1E293B] p-6 shadow-xl dark:shadow-none relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowAppointmentModal(null)}
                className="absolute right-6 top-6 h-8 w-8 rounded-full border border-slate-50 dark:border-[#334155] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-[#CBD5E1] dark:hover:text-[#F8FAFC] transition hover:bg-slate-50 dark:hover:bg-[#273449]"
              >
                <X size={14} />
              </button>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                {activeTab === "doctors" ? "Book Dermatologist" : "Request Clinic Visit"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Provider: {showAppointmentModal.name}</p>

              {bookingSuccess ? (
                <div className="my-10 text-center text-emerald-600 font-semibold flex flex-col items-center gap-2">
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: [1, 1.2, 1] }} className="rounded-full bg-emerald-100/50 p-3 text-emerald-600">
                    <Check size={28} strokeWidth={3} />
                  </motion.div>
                  <span className="text-sm font-bold">Appointment Booked!</span>
                  <p className="text-xs text-slate-400 font-normal">Your schedule has been synchronized to the dashboard.</p>
                </div>
              ) : (
                <form onSubmit={handleBookAppointment} className="mt-5 space-y-4 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1 ml-1">Patient Full Name</label>
                    <input
                      required
                      type="text"
                      value={appointmentForm.patientName}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, patientName: e.target.value })}
                      className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 text-slate-800 dark:text-[#CBD5E1] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1 ml-1">Contact Phone</label>
                    <input
                      required
                      type="tel"
                      value={appointmentForm.phone}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 text-slate-800 dark:text-[#CBD5E1] transition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1 ml-1">Date</label>
                      <input
                        required
                        type="date"
                        value={appointmentForm.date}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                        className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 text-slate-800 dark:text-[#CBD5E1] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1 ml-1">Time</label>
                      <input
                        required
                        type="time"
                        value={appointmentForm.time}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                        className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 text-slate-800 dark:text-[#CBD5E1] transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1 ml-1">Clinical Notes</label>
                    <textarea
                      rows={2}
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                      placeholder="Symptoms description, history notes..."
                      className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 text-slate-800 dark:text-[#CBD5E1] placeholder-slate-400 transition resize-none"
                    />
                  </div>
                  
                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="submit"
                      className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl font-bold shadow-md shadow-blue-500/10 transition"
                    >
                      Confirm Booking
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <div className="mx-auto mt-16 max-w-lg border-t border-slate-100 dark:border-[#334155] pt-5 text-[10px] text-slate-400 dark:text-[#94A3B8] leading-relaxed text-center">
        <p className="flex items-center justify-center gap-1 font-semibold text-slate-505 dark:text-[#94A3B8] mb-1">
          <Shield size={12} /> Medical Referral Disclaimer
        </p>
        Doctor information lists represent educational registries. Directory mappings do not constitute endorsed diagnostic recommendations.
      </div>

    </div>
  );
}
