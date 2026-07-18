import { useEffect, useState, useCallback } from "react";
import { useParams as useParamRoute, useLocation as useLocationRoute, Link as LinkRoute } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download, AlertTriangle, Volume2, ArrowLeft, Heart, Sparkles, MapPin, VolumeX, Leaf, Star, Mail, Check, Shield } from "lucide-react";
import ConfidenceChart from "../components/ConfidenceChart";
import SeverityBadge from "../components/SeverityBadge";
import { apiClient } from "../api/client";
import { PredictionResult, Recommendation } from "../types";
import { motion, AnimatePresence } from "framer-motion";

export default function Results() {
  const { t, i18n } = useTranslation();
  const { prediction_id } = useParamRoute();
  const location = useLocationRoute();

  const [result, setResult] = useState<PredictionResult | null>(
    (location.state as PredictionResult) ?? null
  );
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [blendOpacity, setBlendOpacity] = useState<number>(50);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Feedback states
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Email share states
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Get the language-aware disease display name
  const getDisplayName = useCallback(() => {
    if (!result) return "";
    const localized = t(`diseases.${result.primary_disease}`, { defaultValue: "" });
    if (localized && localized !== `diseases.${result.primary_disease}`) return localized;
    return result.primary_disease_title || result.primary_disease.replace(/_/g, " ");
  }, [result, i18n.language, t]);

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmittingFeedback(true);
    try {
      await apiClient.post("/feedback", {
        prediction_id: prediction_id || result?.prediction_id,
        rating,
        comments: feedbackComment,
      });
      setFeedbackSubmitted(true);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleEmailShare(e: React.FormEvent) {
    e.preventDefault();
    if (!emailAddress.trim()) return;
    setEmailSending(true);
    setEmailError("");
    try {
      await apiClient.post(`/reports/${prediction_id || result?.prediction_id}/share-email`, {
        email: emailAddress,
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
      setEmailAddress("");
    } catch (err: any) {
      setEmailError(err.response?.data?.detail || "Failed to share report via email.");
    } finally {
      setEmailSending(false);
    }
  }

  // Fetch prediction if not passed via location state
  useEffect(() => {
    if (!result && prediction_id) {
      apiClient.get(`/predict/${prediction_id}`).then((res) => setResult(res.data))
        .catch(err => console.error("Error fetching prediction details:", err));
    }
  }, [prediction_id, result]);

  // Re-fetch recommendations whenever result OR language changes
  useEffect(() => {
    if (result) {
      setLoadingRec(true);
      const lang = i18n.language; // "en" | "hi" | "gu"
      apiClient
        .get<Recommendation>(`/recommendations/${result.primary_disease}/${result.severity}`, {
          params: { lang },
        })
        .then((res) => setRecommendation(res.data))
        .catch(() => setRecommendation(null))
        .finally(() => setLoadingRec(false));
    }
  }, [result, i18n.language]);

  // TTS handler — reads translated content in selected language voice
  function handleTTS() {
    if (!result) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const lang = i18n.language;
    const diseaseName = getDisplayName();
    const pct = Math.round(result.confidence * 100);

    let text = "";
    if (lang === "hi") {
      text = `स्कैन परिणाम। संभावित बीमारी ${diseaseName} है। विश्वास स्तर ${pct} प्रतिशत है। गंभीरता ${result.severity} है।`;
      if (recommendation) {
        text += ` ${recommendation.severity_guidance}`;
        if (recommendation.skin_care?.length)
          text += ` त्वचा देखभाल: ${recommendation.skin_care.slice(0, 2).join(". ")}`;
      }
    } else if (lang === "gu") {
      text = `સ્કેન પરિણામ. સૌથી શક્ય રોગ ${diseaseName} છે. વિશ્વાસ સ્તર ${pct} ટકા છે. ગંભીરતા ${result.severity} છે.`;
      if (recommendation) {
        text += ` ${recommendation.severity_guidance}`;
        if (recommendation.skin_care?.length)
          text += ` ત્વચા સંભાળ: ${recommendation.skin_care.slice(0, 2).join(". ")}`;
      }
    } else {
      text = `Scan results. The most likely condition is ${diseaseName} with ${pct} percent confidence. The severity is ${result.severity}.`;
      if (recommendation) {
        text += ` ${recommendation.severity_guidance}`;
        if (recommendation.skin_care?.length)
          text += ` Recommended skin care: ${recommendation.skin_care.slice(0, 2).join(". ")}`;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : lang === "gu" ? "gu-IN" : "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  // Cancel speech when navigating away
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Compiling scan diagnostics...</p>
        </div>
      </div>
    );
  }

  const displayDiseaseName = getDisplayName();

  return (
    <div className="relative z-10 mx-auto mt-10 max-w-5xl px-6 pb-20 font-body text-slate-800 dark:text-[#CBD5E1]">
      
      {/* Back button */}
      <LinkRoute
        to="/upload"
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 text-blue-500 hover:text-blue-700 transition group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Analyze another image
      </LinkRoute>

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 dark:border-[#334155] pb-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-[#F8FAFC] tracking-tight flex items-center gap-2">
            Analysis Results <Sparkles size={20} className="text-blue-500 animate-pulse" />
          </h1>
          <p className="text-slate-400 text-[10px] mt-1.5 font-mono">ASSESSMENT TRANSACTION ID: {result.prediction_id}</p>
        </div>
        
        {/* Top actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleTTS}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-semibold border transition-all duration-300 shadow-sm ${
              isSpeaking
                ? "bg-rose-500 border-rose-500 text-white shadow-rose-500/20"
                : "bg-white dark:bg-[#1E293B] border-slate-100 dark:border-[#334155] text-slate-600 dark:text-[#CBD5E1] hover:border-slate-200 dark:hover:border-[#475569] hover:bg-slate-50 dark:hover:bg-[#273449]"
            }`}
          >
            {isSpeaking ? (
              <><VolumeX size={14} className="animate-pulse" /> Stop Voice Assistant</>
            ) : (
              <><Volume2 size={14} /> Read Report Aloud</>
            )}
          </button>
          <a
            href={`${apiClient.defaults.baseURL}/reports/${result.prediction_id}/pdf`}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 text-xs font-semibold shadow-md shadow-blue-500/10 transition"
          >
            <Download size={14} /> Download PDF Summary
          </a>
        </div>
      </div>

      {/* Image Quality Warning */}
      {result.image_quality_warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-start gap-3 rounded-2xl p-4 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-450"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <span className="font-semibold block mb-0.5">Image Quality Warning</span>
            <ul className="list-disc pl-4 space-y-0.5">
              {result.image_quality_warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Main Results Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Prediction details and confidence metrics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(240,242,245,0.35)] dark:shadow-none"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Primary Prediction
          </span>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-[#F8FAFC] leading-snug">
            {displayDiseaseName}
          </h2>
          
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
              {Math.round(result.confidence * 100)}% Confidence Match
            </span>
            <SeverityBadge severity={result.severity} />
          </div>

          <div className="mt-8 border-t border-slate-50 dark:border-[#334155]/30 pt-6">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-4">
              Probability Distribution
            </h3>
            <ConfidenceChart predictions={result.top_predictions} />
          </div>
        </motion.div>

        {/* Grad-CAM Explainability Workspace */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(240,242,245,0.35)] dark:shadow-none flex flex-col justify-between"
        >
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Explainable AI (Grad-CAM)
            </h3>
            <p className="mt-1 text-slate-400 dark:text-[#94A3B8] text-[10px]">
              Drag the slide trigger to overlay the neural network's focus heatmaps.
            </p>
          </div>

          {/* Image viewer container */}
          <div className="relative mt-4 h-64 w-full overflow-hidden rounded-2xl border border-slate-100 dark:border-[#334155] bg-slate-50 dark:bg-[#0B1220] shadow-inner flex items-center justify-center">
            {result.image_url && (
              <img
                src={result.image_url}
                alt="Original skin scan"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {result.gradcam_image_url && (
              <img
                src={result.gradcam_image_url}
                alt="Grad-CAM analysis overlay"
                style={{ opacity: blendOpacity / 100 }}
                className="absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-opacity duration-75"
              />
            )}
          </div>

          {/* Interactive slider */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-2">
              <span>Original Photo</span>
              <span>AI Heatmap Overlay ({blendOpacity}%)</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              value={blendOpacity}
              onChange={(e) => setBlendOpacity(parseInt(e.target.value))}
              className="w-full rounded-lg appearance-none h-2 cursor-pointer bg-slate-100 dark:bg-slate-800 accent-blue-500"
            />
            
            <span className="mt-2.5 block text-[9px] text-slate-400 dark:text-[#94A3B8] leading-relaxed">
              Warm color maps (red/yellow regions) represent focus boundaries evaluated by convolutional filters as pathological variance.
            </span>
          </div>
        </motion.div>
      </div>

      {/* Recommendations & Guides Section */}
      <AnimatePresence mode="wait">
        {loadingRec ? (
          <motion.div
            key="rec-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 rounded-[2.5rem] border border-slate-100 dark:border-[#334155] bg-white/60 dark:bg-[#1E293B]/60 p-10 flex items-center justify-center gap-2.5"
          >
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading educational guidance…</span>
          </motion.div>
        ) : recommendation ? (
          <motion.div
            key={`rec-${i18n.language}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-8 bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(240,242,245,0.35)] dark:shadow-none"
          >
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 dark:border-[#334155]/30">
              <Leaf size={18} className="text-blue-500" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-[#F8FAFC]">
                Self-Care & Educational Guidance
              </h3>
            </div>
            
            <p className="mt-4 text-xs font-semibold px-4 py-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/30 dark:border-blue-900/30 text-blue-800 dark:text-blue-400 leading-relaxed">
              {recommendation.severity_guidance}
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <RecommendationList title="Skin Care Rules" items={recommendation.skin_care} />
              <RecommendationList title="Lifestyle Adjustments" items={recommendation.lifestyle} />
              <RecommendationList title="Recommended Diet" items={recommendation.diet_recommended} />
              <RecommendationList title="Foods to Avoid" items={recommendation.diet_avoid} />
            </div>

            {/* Educational Medication Info */}
            {recommendation.medication_info?.categories?.length > 0 && (
              <div className="mt-6 rounded-2xl p-4 bg-slate-50 dark:bg-[#0B1220] border border-slate-100 dark:border-[#334155] text-xs">
                <h4 className="font-bold text-slate-700 dark:text-[#CBD5E1] uppercase tracking-wider">
                  Educational Medication Reference
                </h4>
                <p className="mt-1 text-slate-500 dark:text-[#94A3B8] font-medium">
                  {recommendation.medication_info.general_purpose}
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-500 dark:text-[#94A3B8] border-t border-slate-200/50 dark:border-[#334155]/30 pt-2.5">
                  <div>
                    <b>Reference Categories:</b> {recommendation.medication_info.categories.join(", ")}
                  </div>
                  <div>
                    <b>Potential Side Effects:</b> {recommendation.medication_info.side_effects?.join(", ") || "N/A"}
                  </div>
                  <div className="md:col-span-2 text-rose-600 dark:text-rose-450 font-semibold mt-1">
                    ⚠️ <b>Allergy Warning:</b> {recommendation.medication_info.allergy_warning}
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Warnings */}
            {recommendation.emergency_warning_signs?.length > 0 && (
              <div className="mt-4 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <strong>Seek Professional Clinical Attention if you note:</strong>{" "}
                  {recommendation.emergency_warning_signs.join(" ")}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Referral Quick Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <LinkRoute
          to="/doctors"
          state={{ city: result.primary_disease === "Melanoma" ? "Mumbai" : "Ahmedabad" }}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3.5 text-xs font-semibold shadow-md shadow-blue-500/10 transition"
        >
          <MapPin size={14} /> Find Nearest Dermatologists
        </LinkRoute>
        
        <LinkRoute
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] text-slate-600 dark:text-[#CBD5E1] px-6 py-3.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#273449] shadow-sm transition"
        >
          View Historical Scans
        </LinkRoute>
      </div>

      {/* Share / Feedback forms */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        
        {/* Feedback Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(240,242,245,0.35)] dark:shadow-none flex flex-col justify-between min-h-[260px]"
        >
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <Star size={18} className="text-amber-500 fill-amber-500" /> Share Assessment Feedback
            </h3>
            <p className="text-xs text-slate-400 dark:text-[#94A3B8] mt-1 leading-relaxed">
              Let us know how accurate the scan results matching your symptoms appear.
            </p>
          </div>

          {feedbackSubmitted ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-450 font-bold flex items-center justify-center gap-1">
                <Check size={14} className="text-emerald-600" /> Assessment Feedback Submitted!
              </p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="mt-4 space-y-3.5">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={
                        star <= (hoverRating || rating)
                          ? "fill-amber-500 text-amber-500"
                          : "text-slate-200 dark:text-slate-700 fill-slate-50 dark:fill-slate-800"
                      }
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs font-bold text-amber-500 ml-2">{rating} of 5 Stars</span>
                )}
              </div>

              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Write any symptoms notes or diagnostics feedback comments..."
                rows={3}
                className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#0B1220]/50 px-3.5 py-2.5 text-xs focus:border-blue-300 focus:outline-none placeholder-slate-400"
              />

              <button
                type="submit"
                disabled={rating === 0 || submittingFeedback}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold text-xs transition disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600"
              >
                {submittingFeedback ? "Submitting..." : "Submit Rating"}
              </button>
            </form>
          )}
        </motion.div>

        {/* Email Sharing Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-[#1E293B] border border-slate-100/80 dark:border-[#334155] rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(240,242,245,0.35)] dark:shadow-none flex flex-col justify-between min-h-[260px]"
        >
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
              <Mail size={18} className="text-blue-500" /> Share Report via Email
            </h3>
            <p className="text-xs text-slate-400 dark:text-[#94A3B8] mt-1 leading-relaxed">
              Send a structured copy of this assessment, severity levels, and self-care recommendations directly to your inbox.
            </p>
          </div>

          <form onSubmit={handleEmailShare} className="mt-4 space-y-3.5">
            <div className="space-y-1">
              <input
                type="email"
                required
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="patient@example.com"
                className="w-full rounded-xl border border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#0B1220]/50 px-3.5 py-2.5 text-xs focus:border-blue-300 focus:outline-none placeholder-slate-400"
              />
              {emailError && <p className="text-[10px] text-rose-500 font-semibold">{emailError}</p>}
            </div>

            <button
              type="submit"
              disabled={emailSending}
              className="w-full py-3.5 border border-slate-100 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#273449] text-slate-600 dark:text-[#CBD5E1] rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {emailSending ? (
                "Sending Assessment..."
              ) : emailSent ? (
                <>
                  <Check size={14} className="text-emerald-500" strokeWidth={3} /> Summary Dispatched!
                </>
              ) : (
                <>
                  <Mail size={14} /> Send Summary Report
                </>
              )}
            </button>
            
            <span className="block text-[9px] text-slate-400 dark:text-[#94A3B8] text-center leading-tight">
              In development mode, sent email contents are logged directly inside <b>backend/mock_emails.txt</b>.
            </span>
          </form>
        </motion.div>
      </div>

      {/* Disclaimer footer */}
      <div className="mx-auto mt-16 max-w-lg border-t border-slate-100 dark:border-[#334155] pt-5 text-[10px] text-slate-400 dark:text-[#94A3B8] leading-relaxed text-center">
        <p className="flex items-center justify-center gap-1 font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">
          <Shield size={12} /> Medical Disclaimer
        </p>
        The results provided by this system are compiled for educational screening purposes. They do not constitute official clinical diagnoses. Consult a licensed dermatologist for all pathological concerns.
      </div>

    </div>
  );
}

function RecommendationList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="text-xs">
      <h4 className="font-semibold uppercase tracking-wider mb-2 pb-1 text-slate-400 dark:text-[#94A3B8] border-b border-slate-100 dark:border-[#334155]/30">
        {title}
      </h4>
      <ul className="list-disc pl-4 space-y-1 text-slate-505 dark:text-[#94A3B8] leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
