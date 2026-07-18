import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus, RefreshCw, X, Zap, Sliders, Sparkles, CheckCircle2, Shield } from "lucide-react";
import UploadDropzone from "../components/UploadDropzone";
import { apiClient } from "../api/client";

const TIPS = [
  "🌿 Good lighting = better accuracy. Use natural daylight.",
  "📐 Capture a clear close-up of just the affected area.",
  "🚿 Clean the skin area before scanning for best results.",
  "🔍 Avoid motion blur — keep your hand steady.",
];

export default function Upload() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [tipIdx, setTipIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Rotate tips
  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (useCamera) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((s) => {
          setStream(s);
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          setError("Could not access camera. Check permissions or upload a file.");
          setUseCamera(false);
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [useCamera]);

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }

  function processImage(originalFile: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(originalFile);
      reader.onload = (ev) => {
        const img = new Image();
        img.src = ev.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = 500;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const min = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
          }
          canvas.toBlob((blob) => {
            resolve(blob ? new File([blob], originalFile.name || "skin_scan.jpg", { type: "image/jpeg", lastModified: Date.now() }) : originalFile);
          }, "image/jpeg", 0.85);
        };
      };
    });
  }

  function handleFileSelected(f: File) {
    processImage(f).then((p) => {
      setFile(p);
      setError(null);
    });
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    const size = Math.min(v.videoWidth, v.videoHeight) || 500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(v, (v.videoWidth - size) / 2, (v.videoHeight - size) / 2, size, size, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (blob) {
        processImage(new File([blob], "captured_skin.jpg", { type: "image/jpeg" })).then((p) => {
          setFile(p);
          setUseCamera(false);
          setError(null);
        });
      }
    }, "image/jpeg", 0.85);
  }

  async function handleAnalyze() {
    if (!file) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiClient.post("/predict", form, { headers: { "Content-Type": "multipart/form-data" } });
      navigate(`/results/${res.data.prediction_id}`, { state: res.data });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not analyze this image. Please try a different photo.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="relative z-10 mx-auto mt-12 max-w-3xl px-6 pb-20 text-center font-body text-slate-800 dark:text-[#CBD5E1]">
      
      {/* Upper header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 text-xs font-semibold mb-4 shadow-2xs">
          <Sparkles size={12} className="animate-pulse" /> AI Skin Analysis
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold text-slate-900 dark:text-[#F8FAFC] leading-tight tracking-tight">
          Analyze Your Skin
        </h1>
        <p className="mt-3 text-slate-500 dark:text-[#94A3B8] text-sm max-w-lg mx-auto leading-relaxed">
          Upload a clear photo or capture a close-up scan to run our state-of-the-art dermatological classifier.
        </p>
      </motion.div>

      {/* Rotating Tips Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 mx-auto max-w-sm"
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={tipIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-xs font-medium rounded-full bg-slate-50 dark:bg-[#1E293B] border border-slate-100 dark:border-[#334155] text-slate-600 dark:text-[#CBD5E1] px-5 py-2 shadow-2xs"
          >
            {TIPS[tipIdx]}
          </motion.p>
        </AnimatePresence>
      </motion.div>

      {/* Glassmorphic Upload Workspace Card */}
      <div className="mt-8 bg-white/80 dark:bg-[#1E293B]/80 border border-slate-100 dark:border-[#334155] rounded-[2.5rem] p-8 max-w-lg mx-auto shadow-[0_16px_40px_rgba(240,242,245,0.5)] dark:shadow-none backdrop-blur-md">
        
        {/* Toggle Mode */}
        <div className="flex justify-center gap-2 bg-slate-50 dark:bg-[#0B1220] border border-slate-100 dark:border-[#334155] p-1.5 rounded-2xl mb-8">
          {[
            { camera: false, Icon: ImagePlus, label: "Gallery File" },
            { camera: true, Icon: Camera, label: "Live Camera" },
          ].map(({ camera, Icon, label }) => (
            <button
              key={String(camera)}
              onClick={() => {
                setUseCamera(camera);
                setFile(null);
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all duration-200 ${
                useCamera === camera
                  ? "bg-white dark:bg-[#1E293B] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-[#334155]"
                  : "text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#CBD5E1]"
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Dropzone or Live camera feed */}
        <div className="flex justify-center min-h-[220px]">
          <AnimatePresence mode="wait">
            {useCamera ? (
              <motion.div
                key="camera"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative overflow-hidden aspect-square w-full max-w-sm rounded-[2rem] border border-slate-100 dark:border-[#334155] bg-slate-900 shadow-lg flex items-center justify-center"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover rounded-[2rem]"
                  style={{ transform: "scaleX(-1)" }}
                />
                
                {/* Visual crop brackets */}
                {["top-4 left-4 border-t-2 border-l-2", "top-4 right-4 border-t-2 border-r-2",
                  "bottom-4 left-4 border-b-2 border-l-2", "bottom-4 right-4 border-b-2 border-r-2"
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-white/80 ${cls}`} />
                ))}
                
                <div className="absolute bottom-5 inset-x-0 flex justify-center gap-2">
                  <button 
                    onClick={capturePhoto} 
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
                  >
                    <Camera size={14} /> Capture Scan
                  </button>
                  <button
                    onClick={() => setUseCamera(false)}
                    className="rounded-full bg-black/40 border border-white/20 text-white px-3.5 py-2.5 text-xs hover:bg-black/60 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full"
              >
                <UploadDropzone onFileSelected={handleFileSelected} isAnalyzing={isAnalyzing} />

                {/* Selected File Feedback Banner */}
                <AnimatePresence>
                  {file && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-5 flex items-center justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-450 shadow-2xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} />
                        <span className="truncate max-w-[190px]">{file.name}</span>
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-[#94A3B8] font-mono font-medium">
                        <Sliders size={11} /> Ready to check
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-5 text-xs font-semibold text-rose-500 flex items-center justify-center gap-1"
          >
            ⚠️ {error}
          </motion.p>
        )}

        {/* Action Button */}
        <div className="mt-8 w-full">
          <button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className={`w-full py-4.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              file && !isAnalyzing 
                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-700/50 cursor-not-allowed"
            }`}
          >
            {isAnalyzing ? (
              <><RefreshCw size={16} className="animate-spin" /> Analyzing Image Matrix...</>
            ) : (
              <><Zap size={16} /> Run Diagnosis Check</>
            )}
          </button>
          {file && !isAnalyzing && (
            <p className="mt-2 text-[10px] text-slate-400">
              Your photo is ready — click to initiate AI inference.
            </p>
          )}
        </div>

      </div>

      {/* Progress Timeline Grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 grid grid-cols-3 gap-6 text-center max-w-xl mx-auto"
      >
        {[
          { step: "1", label: "Upload or scan lesion photo" },
          { step: "2", label: "AI scans pathological features" },
          { step: "3", label: "Get clinical recommendations" },
        ].map(({ step, label }) => (
          <div key={step} className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 shadow-2xs">
              {step}
            </div>
            <p className="text-[11px] text-slate-505 dark:text-[#94A3B8] leading-snug">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Medical disclaimer footer */}
      <div className="mx-auto mt-16 max-w-lg border-t border-slate-100 dark:border-[#334155] pt-5 text-[10px] text-slate-400 leading-relaxed">
        <p className="flex items-center justify-center gap-1 font-semibold text-slate-500 dark:text-[#94A3B8] mb-1">
          <Shield size={12} /> Medical Disclaimer
        </p>
        The results provided by this system are compiled for educational screening purposes. They do not constitute official clinical diagnoses. Consult a licensed dermatologist for all pathological concerns.
      </div>

    </div>
  );
}
