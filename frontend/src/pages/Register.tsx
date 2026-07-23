import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { UserPlus, Sparkles, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(fullName, email, password, i18n.language || "en");
      navigate("/upload");
    } catch {
      setError(t("auth.register_error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-[calc(100vh-140px)] px-6 overflow-hidden">
      {/* Immersive Glowing Backdrop Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none animate-pulse duration-[8000ms]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-[2.5rem] border border-slate-100 dark:border-[#334155] bg-white/80 dark:bg-[#1E293B]/80 p-8 shadow-[0_16px_40px_rgba(240,242,245,0.5)] dark:shadow-none backdrop-blur-md font-body text-slate-850 dark:text-[#CBD5E1]"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="text-blue-500" size={24} />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
            {t("auth.register_title")} <Sparkles size={16} className="text-blue-500 animate-pulse" />
          </h1>
        </div>
        <p className="text-xs text-slate-400 dark:text-[#94A3B8] mt-1">{t("auth.register_subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1.5 ml-1">{t("auth.full_name")}</label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 text-slate-400 dark:text-[#94A3B8]" size={16} />
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth.full_name_placeholder")}
                className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 pl-11 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 focus:bg-white dark:focus:bg-[#0B1220] transition-all duration-300 text-slate-800 dark:text-[#CBD5E1]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1.5 ml-1">{t("auth.email")}</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-slate-400 dark:text-[#94A3B8]" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email_placeholder")}
                className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 pl-11 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 focus:bg-white dark:focus:bg-[#0B1220] transition-all duration-300 text-slate-800 dark:text-[#CBD5E1]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[9px] font-bold text-slate-400 dark:text-[#94A3B8] uppercase mb-1.5 ml-1">{t("auth.password")}</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-slate-400 dark:text-[#94A3B8]" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password_placeholder")}
                className="w-full rounded-2xl border border-slate-100 dark:border-[#334155] p-3.5 pl-11 pr-11 outline-none focus:border-blue-300 bg-slate-50/50 dark:bg-[#0B1220]/50 focus:bg-white dark:focus:bg-[#0B1220] transition-all duration-300 text-slate-800 dark:text-[#CBD5E1]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-blue-500 transition p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-500 mt-2">⚠️ {error}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 py-3.5 font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-250 mt-5 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{t("auth.creating_account")}</span>
              </>
            ) : (
              <span>{t("auth.register_button")}</span>
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-[#334155]/30 text-center text-xs text-slate-500 dark:text-[#94A3B8]">
          {t("auth.have_account")}{" "}
          <Link to="/login" className="font-semibold text-blue-500 hover:underline">
            {t("auth.login_here")}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
