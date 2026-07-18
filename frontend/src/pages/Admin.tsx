import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Users, BookOpen, MapPin, Cpu, RefreshCw, Save, Trash2, Plus, BarChart3, Star, Heart, TrendingUp } from "lucide-react";
import { apiClient } from "../api/client";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

export default function Admin() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"users" | "diseases" | "healthcare" | "retrain" | "analytics">("users");

  // State
  const [users, setUsers] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any>({});
  const [directory, setDirectory] = useState<any>({ doctors: [], hospitals: [] });
  const [retrainState, setRetrainState] = useState<any>({ status: "idle" });
  const [logs, setLogs] = useState<string>("");
  const [epochs, setEpochs] = useState<number>(2);

  // Analytics states
  const [analytics, setAnalytics] = useState<any>({
    total_users: 0,
    total_predictions: 0,
    disease_distribution: {},
    severity_distribution: {}
  });
  const [feedbackStats, setFeedbackStats] = useState<any>({
    total_feedback: 0,
    average_rating: 0,
    rating_distribution: {}
  });
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Editing state
  const [editingDisease, setEditingDisease] = useState<string | null>(null);
  const [diseaseForm, setDiseaseForm] = useState<any>({
    description: "",
    symptoms: "",
    causes: "",
    risk_factors: "",
    prevention: "",
    self_care: "",
    when_to_consult_doctor: "",
    emergency_signs: "",
  });

  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editingHos, setEditingHos] = useState<any | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchDiseases();
    fetchDirectory();
    fetchRetrainStatus();
    fetchAnalytics();
    const interval = setInterval(fetchRetrainStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Fetch API helpers
  async function fetchUsers() {
    try {
      const res = await apiClient.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }

  async function fetchDiseases() {
    try {
      const res = await apiClient.get("/admin/diseases");
      setDiseases(res.data);
    } catch (err) {
      console.error("Error fetching diseases:", err);
    }
  }

  async function fetchDirectory() {
    try {
      const res = await apiClient.get("/admin/healthcare-directory");
      setDirectory(res.data);
    } catch (err) {
      console.error("Error fetching directory:", err);
    }
  }

  async function fetchRetrainStatus() {
    try {
      const res = await apiClient.get("/admin/retrain/status");
      setRetrainState(res.data.state);
      setLogs(res.data.recent_logs || "No logs available yet.");
    } catch (err) {
      console.error("Error fetching retrain status:", err);
    }
  }

  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    try {
      const [anRes, statsRes, listRes] = await Promise.all([
        apiClient.get("/dashboard/admin/analytics"),
        apiClient.get("/feedback/admin/stats"),
        apiClient.get("/feedback/admin/list")
      ]);
      setAnalytics(anRes.data);
      setFeedbackStats(statsRes.data);
      setFeedbackList(listRes.data);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  // Handle actions
  async function handleToggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert("Failed to toggle role.");
    }
  }

  function startEditDisease(id: string) {
    const d = diseases[id];
    setEditingDisease(id);
    setDiseaseForm({
      description: d.description || "",
      symptoms: d.symptoms ? d.symptoms.join(", ") : "",
      causes: d.causes ? d.causes.join(", ") : "",
      risk_factors: d.risk_factors ? d.risk_factors.join(", ") : "",
      prevention: d.prevention ? d.prevention.join(", ") : "",
      self_care: d.self_care ? d.self_care.join(", ") : "",
      when_to_consult_doctor: d.when_to_consult_doctor ? d.when_to_consult_doctor.join(", ") : "",
      emergency_signs: d.emergency_signs ? d.emergency_signs.join(", ") : "",
    });
  }

  async function handleSaveDisease() {
    if (!editingDisease) return;
    try {
      const updated = {
        description: diseaseForm.description,
        symptoms: diseaseForm.symptoms.split(",").map((s: string) => s.trim()).filter(Boolean),
        causes: diseaseForm.causes.split(",").map((s: string) => s.trim()).filter(Boolean),
        risk_factors: diseaseForm.risk_factors.split(",").map((s: string) => s.trim()).filter(Boolean),
        prevention: diseaseForm.prevention.split(",").map((s: string) => s.trim()).filter(Boolean),
        self_care: diseaseForm.self_care.split(",").map((s: string) => s.trim()).filter(Boolean),
        when_to_consult_doctor: diseaseForm.when_to_consult_doctor.split(",").map((s: string) => s.trim()).filter(Boolean),
        emergency_signs: diseaseForm.emergency_signs.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      await apiClient.put(`/admin/diseases/${editingDisease}`, updated);
      setEditingDisease(null);
      fetchDiseases();
    } catch (err) {
      alert("Failed to save disease info.");
    }
  }

  async function handleTriggerRetraining() {
    try {
      await apiClient.post(`/admin/retrain?epochs=${epochs}`);
      fetchRetrainStatus();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to trigger retraining.");
    }
  }

  async function handleSaveDirectory(updatedDir = directory) {
    try {
      await apiClient.put("/admin/healthcare-directory", updatedDir);
      setDirectory(updatedDir);
      setEditingDoc(null);
      setEditingHos(null);
    } catch (err) {
      alert("Failed to save directory changes.");
    }
  }

  // Doctor list modifiers
  function handleDeleteDoctor(id: string) {
    const updated = {
      ...directory,
      doctors: directory.doctors.filter((d: any) => d.id !== id)
    };
    handleSaveDirectory(updated);
  }

  function handleSaveDoctor() {
    let updatedDoctors = [...directory.doctors];
    if (editingDoc.isNew) {
      const newDoc = { ...editingDoc, id: `doc_${Date.now()}` };
      delete newDoc.isNew;
      updatedDoctors.push(newDoc);
    } else {
      updatedDoctors = updatedDoctors.map((d: any) => d.id === editingDoc.id ? editingDoc : d);
    }
    handleSaveDirectory({ ...directory, doctors: updatedDoctors });
  }

  // Hospital list modifiers
  function handleDeleteHospital(id: string) {
    const updated = {
      ...directory,
      hospitals: directory.hospitals.filter((h: any) => h.id !== id)
    };
    handleSaveDirectory(updated);
  }

  function handleSaveHospital() {
    let updatedHospitals = [...directory.hospitals];
    if (editingHos.isNew) {
      const newHos = { ...editingHos, id: `hos_${Date.now()}` };
      delete newHos.isNew;
      updatedHospitals.push(newHos);
    } else {
      updatedHospitals = updatedHospitals.map((h: any) => h.id === editingHos.id ? editingHos : h);
    }
    handleSaveDirectory({ ...directory, hospitals: updatedHospitals });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 font-body text-ink">
      <div className="flex items-center gap-3">
        <Shield className="text-teal-500" size={32} />
        <h1 className="font-display text-3xl font-semibold">Admin Panel</h1>
      </div>
      <p className="mt-2 text-ink/60">Configure databases, manage users, and retraining the ML model.</p>

      {/* Tabs */}
      <div className="mt-8 flex border-b border-teal-200/60 font-medium">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
            activeTab === "users" ? "border-teal-500 text-teal-700 font-semibold" : "border-transparent text-ink/65 hover:text-teal-500"
          }`}
        >
          <Users size={16} /> User Roles
        </button>
        <button
          onClick={() => setActiveTab("diseases")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
            activeTab === "diseases" ? "border-teal-500 text-teal-700 font-semibold" : "border-transparent text-ink/65 hover:text-teal-500"
          }`}
        >
          <BookOpen size={16} /> Diseases Database
        </button>
        <button
          onClick={() => setActiveTab("healthcare")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
            activeTab === "healthcare" ? "border-teal-500 text-teal-700 font-semibold" : "border-transparent text-ink/65 hover:text-teal-500"
          }`}
        >
          <MapPin size={16} /> Indian Healthcare
        </button>
        <button
          onClick={() => setActiveTab("retrain")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
            activeTab === "retrain" ? "border-teal-500 text-teal-700 font-semibold" : "border-transparent text-ink/65 hover:text-teal-500"
          }`}
        >
          <Cpu size={16} /> Model Retraining
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
            activeTab === "analytics" ? "border-teal-500 text-teal-700 font-semibold" : "border-transparent text-ink/65 hover:text-teal-500"
          }`}
        >
          <BarChart3 size={16} /> Disease Analytics
        </button>
      </div>

      <div className="mt-8">
        {/* Tab 1: User Management */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur">
            <h2 className="text-xl font-semibold mb-4">User Administration</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-teal-200/40 text-sm font-semibold text-ink/60 bg-teal-50/50">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Registration Date</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-teal-100/50 hover:bg-teal-50/30 text-sm">
                      <td className="p-3 font-medium">{u.full_name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.role === "admin" ? "bg-coral/10 text-coral" : "bg-teal-100 text-teal-700"
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleRole(u._id, u.role)}
                          className="text-xs bg-teal-500 text-white rounded-full px-3 py-1 font-semibold hover:bg-teal-700"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Disease Database Editor */}
        {activeTab === "diseases" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-4 shadow-sm backdrop-blur max-h-[600px] overflow-y-auto">
              <h3 className="font-semibold mb-3">Diseases List</h3>
              {Object.keys(diseases).map((id) => (
                <button
                  key={id}
                  onClick={() => startEditDisease(id)}
                  className={`w-full text-left p-3 rounded-lg text-sm mb-2 font-medium transition ${
                    editingDisease === id ? "bg-teal-500 text-white" : "hover:bg-teal-50"
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="md:col-span-2 rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur">
              {editingDisease ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Editing: {editingDisease}</h3>
                    <button
                      onClick={handleSaveDisease}
                      className="flex items-center gap-1.5 text-sm bg-teal-500 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-teal-700"
                    >
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block font-semibold mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={diseaseForm.description}
                        onChange={(e) => setDiseaseForm({ ...diseaseForm, description: e.target.value })}
                        className="w-full rounded-lg border border-teal-200 p-2.5 bg-white/60 focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    {["symptoms", "causes", "risk_factors", "prevention", "self_care", "when_to_consult_doctor", "emergency_signs"].map((field) => (
                      <div key={field}>
                        <label className="block font-semibold mb-1 capitalize">{field.replace(/_/g, " ")} (Comma separated)</label>
                        <input
                          type="text"
                          value={diseaseForm[field]}
                          onChange={(e) => setDiseaseForm({ ...diseaseForm, [field]: e.target.value })}
                          className="w-full rounded-lg border border-teal-200 p-2.5 bg-white/60 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-ink/50 text-sm">
                  Select a disease from the sidebar to edit its recommendations database.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 3: Indian Healthcare Directory */}
        {activeTab === "healthcare" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Doctors Section */}
            <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Dermatologists Directory</h3>
                <button
                  onClick={() => setEditingDoc({ isNew: true, name: "", clinic_name: "", city: "", state: "", phone: "", address: "", latitude: 20.0, longitude: 77.0, rating: 4.5, timings: "10:00 AM - 6:00 PM (Mon-Sat)" })}
                  className="flex items-center gap-1 text-xs bg-teal-500 text-white rounded-full px-3 py-1.5 font-semibold hover:bg-teal-700"
                >
                  <Plus size={14} /> Add Doctor
                </button>
              </div>

              {editingDoc && (
                <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/20 text-sm grid gap-4 grid-cols-2">
                  <h4 className="col-span-2 font-semibold text-teal-700">{editingDoc.isNew ? "New Doctor Details" : "Edit Doctor Details"}</h4>
                  <input placeholder="Name" value={editingDoc.name} onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="Clinic Name" value={editingDoc.clinic_name} onChange={(e) => setEditingDoc({ ...editingDoc, clinic_name: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="City" value={editingDoc.city} onChange={(e) => setEditingDoc({ ...editingDoc, city: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="State" value={editingDoc.state} onChange={(e) => setEditingDoc({ ...editingDoc, state: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="Phone" value={editingDoc.phone} onChange={(e) => setEditingDoc({ ...editingDoc, phone: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="Address" value={editingDoc.address} onChange={(e) => setEditingDoc({ ...editingDoc, address: e.target.value })} className="p-2 border border-teal-200 rounded col-span-2" />
                  <input type="number" step="any" placeholder="Latitude" value={editingDoc.latitude} onChange={(e) => setEditingDoc({ ...editingDoc, latitude: parseFloat(e.target.value) || 0 })} className="p-2 border border-teal-200 rounded" />
                  <input type="number" step="any" placeholder="Longitude" value={editingDoc.longitude} onChange={(e) => setEditingDoc({ ...editingDoc, longitude: parseFloat(e.target.value) || 0 })} className="p-2 border border-teal-200 rounded" />
                  <div className="col-span-2 flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingDoc(null)} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-full font-semibold">Cancel</button>
                    <button onClick={handleSaveDoctor} className="px-4 py-1.5 bg-teal-500 text-white rounded-full font-semibold">Save</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-teal-200/40 font-semibold text-ink/60">
                      <th className="p-2">Name</th>
                      <th className="p-2">Clinic</th>
                      <th className="p-2">City</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directory.doctors.map((d: any) => (
                      <tr key={d.id} className="border-b border-teal-100/30 hover:bg-teal-50/20">
                        <td className="p-2 font-medium">{d.name}</td>
                        <td className="p-2">{d.clinic_name}</td>
                        <td className="p-2">{d.city}, {d.state}</td>
                        <td className="p-2">{d.phone}</td>
                        <td className="p-2 flex gap-2">
                          <button onClick={() => setEditingDoc(d)} className="text-teal-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteDoctor(d.id)} className="text-coral hover:underline"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hospitals Section */}
            <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Hospitals Directory</h3>
                <button
                  onClick={() => setEditingHos({ isNew: true, name: "", type: "Government", city: "", state: "", phone: "", address: "", latitude: 20.0, longitude: 77.0, emergency: true })}
                  className="flex items-center gap-1 text-xs bg-teal-500 text-white rounded-full px-3 py-1.5 font-semibold hover:bg-teal-700"
                >
                  <Plus size={14} /> Add Hospital
                </button>
              </div>

              {editingHos && (
                <div className="mb-6 p-4 rounded-xl border border-teal-200 bg-teal-50/20 text-sm grid gap-4 grid-cols-2">
                  <h4 className="col-span-2 font-semibold text-teal-700">{editingHos.isNew ? "New Hospital Details" : "Edit Hospital Details"}</h4>
                  <input placeholder="Name" value={editingHos.name} onChange={(e) => setEditingHos({ ...editingHos, name: e.target.value })} className="p-2 border border-teal-200 rounded col-span-2" />
                  <select value={editingHos.type} onChange={(e) => setEditingHos({ ...editingHos, type: e.target.value })} className="p-2 border border-teal-200 rounded">
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                  </select>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editingHos.emergency} onChange={(e) => setEditingHos({ ...editingHos, emergency: e.target.checked })} />
                    Has Emergency Room
                  </label>
                  <input placeholder="City" value={editingHos.city} onChange={(e) => setEditingHos({ ...editingHos, city: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="State" value={editingHos.state} onChange={(e) => setEditingHos({ ...editingHos, state: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="Phone" value={editingHos.phone} onChange={(e) => setEditingHos({ ...editingHos, phone: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input placeholder="Address" value={editingHos.address} onChange={(e) => setEditingHos({ ...editingHos, address: e.target.value })} className="p-2 border border-teal-200 rounded" />
                  <input type="number" step="any" placeholder="Latitude" value={editingHos.latitude} onChange={(e) => setEditingHos({ ...editingHos, latitude: parseFloat(e.target.value) || 0 })} className="p-2 border border-teal-200 rounded" />
                  <input type="number" step="any" placeholder="Longitude" value={editingHos.longitude} onChange={(e) => setEditingHos({ ...editingHos, longitude: parseFloat(e.target.value) || 0 })} className="p-2 border border-teal-200 rounded" />
                  <div className="col-span-2 flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingHos(null)} className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-full font-semibold">Cancel</button>
                    <button onClick={handleSaveHospital} className="px-4 py-1.5 bg-teal-500 text-white rounded-full font-semibold">Save</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-teal-200/40 font-semibold text-ink/60">
                      <th className="p-2">Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Location</th>
                      <th className="p-2">Emergency</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directory.hospitals.map((h: any) => (
                      <tr key={h.id} className="border-b border-teal-100/30 hover:bg-teal-50/20">
                        <td className="p-2 font-medium">{h.name}</td>
                        <td className="p-2">{h.type}</td>
                        <td className="p-2">{h.city}, {h.state}</td>
                        <td className="p-2">{h.emergency ? "Yes" : "No"}</td>
                        <td className="p-2 flex gap-2">
                          <button onClick={() => setEditingHos(h)} className="text-teal-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteHospital(h.id)} className="text-coral hover:underline"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: Model Retraining Control */}
        {activeTab === "retrain" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur space-y-4">
              <h3 className="font-semibold text-lg mb-2">Retraining Control</h3>
              <div>
                <label className="block text-sm font-semibold mb-2">Training Epochs: {epochs}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div className="text-sm p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-2">
                <div><b>Current Status:</b> <span className="capitalize font-semibold text-teal-600">{retrainState.status}</span></div>
                {retrainState.started_at && <div><b>Started At:</b> {new Date(retrainState.started_at).toLocaleTimeString()}</div>}
                {retrainState.completed_at && <div><b>Completed At:</b> {new Date(retrainState.completed_at).toLocaleTimeString()}</div>}
                {retrainState.error && <div className="text-coral mt-1"><b>Error:</b> {retrainState.error}</div>}
              </div>

              <button
                onClick={handleTriggerRetraining}
                disabled={retrainState.status === "training"}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-teal-500 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition"
              >
                <RefreshCw className={retrainState.status === "training" ? "animate-spin" : ""} size={16} />
                {retrainState.status === "training" ? "Retraining Model..." : "Trigger Model Retraining"}
              </button>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur flex flex-col h-[500px]">
              <h3 className="font-semibold text-lg mb-3">Live Retraining Console Logs</h3>
              <div className="flex-1 bg-ink text-cloud font-mono text-xs p-4 rounded-xl overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {logs}
                <div ref={logEndRef} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 5: Disease Analytics & Feedback Dashboard */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-4 text-xs font-semibold">
              <div className="rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-teal-600/70 tracking-widest block">Total Registered Users</span>
                <span className="text-2xl font-display font-bold text-teal-800 mt-2 block">{analytics.total_users}</span>
              </div>
              <div className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-white p-5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-amber-600/70 tracking-widest block">Total AI Scans Conducted</span>
                <span className="text-2xl font-display font-bold text-amber-800 mt-2 block">{analytics.total_predictions}</span>
              </div>
              <div className="rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-rose-600/70 tracking-widest block">Average Patient Rating</span>
                <span className="text-2xl font-display font-bold text-rose-800 mt-2 block flex items-center gap-1.5">
                  {feedbackStats.average_rating || "N/A"} <Star size={16} className="fill-amber-400 text-amber-400 shrink-0" />
                </span>
              </div>
              <div className="rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-purple-600/70 tracking-widest block">Total Feedbacks Logged</span>
                <span className="text-2xl font-display font-bold text-purple-800 mt-2 block">{feedbackStats.total_feedback}</span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Disease Distribution Chart */}
              <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-1.5 text-teal-800">
                  <BarChart3 size={18} /> Disease Class Distribution
                </h3>
                {Object.keys(analytics.disease_distribution || {}).length === 0 ? (
                  <p className="text-sm text-ink/40 text-center py-10">No scan distributions available yet.</p>
                ) : (
                  <div className="h-64 w-full text-[10px] font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(analytics.disease_distribution).map(([key, val]) => ({
                          name: key.replace(/_/g, " "),
                          scans: val
                        }))}
                        layout="vertical"
                        margin={{ left: 10, right: 20 }}
                      >
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="scans" fill="#0B6E64" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Patient Satisfaction Ratings */}
              <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-1.5 text-teal-800">
                  <Star size={18} className="text-amber-500" /> Patient Rating Metrics
                </h3>
                {feedbackStats.total_feedback === 0 ? (
                  <p className="text-sm text-ink/40 text-center py-10">No rating metrics recorded yet.</p>
                ) : (
                  <div className="h-64 w-full text-[10px] font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(feedbackStats.rating_distribution || {}).map(([key, val]) => ({
                            name: `${key} Stars`,
                            value: val
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                          label
                        >
                          {Object.entries(feedbackStats.rating_distribution || {}).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={["#BE3529", "#D4922A", "#E4C480", "#89B4A6", "#0B6E64"][index % 5]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Feed */}
            <div className="rounded-2xl border border-teal-200/60 bg-white/70 p-6 shadow-sm backdrop-blur">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-1.5 text-teal-800">
                Patient Feedback Comments
              </h3>
              {feedbackList.length === 0 ? (
                <p className="text-sm text-ink/40 text-center py-6">No patient comments logged yet.</p>
              ) : (
                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
                  {feedbackList.map((f) => (
                    <div key={f._id} className="rounded-xl border border-teal-50 bg-white/80 p-4 text-xs">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-700">{f.user_name}</span>
                          <span className="text-ink/45">{f.user_email}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={s <= f.rating ? "fill-amber-400 text-amber-400" : "text-skin-200 fill-skin-50"}
                            />
                          ))}
                        </div>
                      </div>
                      {f.comments ? (
                        <p className="mt-2 text-mocha/85 italic leading-relaxed font-serif bg-skin-50/30 p-2.5 rounded-lg border border-skin-100/50">
                          "{f.comments}"
                        </p>
                      ) : (
                        <p className="mt-2 text-mocha/40 italic">No text comments provided.</p>
                      )}
                      <span className="block mt-2 text-[9px] text-ink/40 text-right">
                        Submitted: {new Date(f.created_at).toLocaleDateString()} at {new Date(f.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
}
