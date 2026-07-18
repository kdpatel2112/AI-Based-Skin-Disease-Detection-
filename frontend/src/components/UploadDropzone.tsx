import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
import { Camera, ImagePlus, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onFileSelected: (file: File) => void;
  isAnalyzing: boolean;
}

export default function UploadDropzone({ onFileSelected, isAnalyzing }: Props) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`scan-ring ${isAnalyzing ? "scanning" : ""} relative mx-auto flex aspect-square w-full max-w-sm cursor-pointer flex-col items-center justify-center overflow-hidden rounded-skin text-center transition-all duration-300 border-2 border-dashed backdrop-blur-xl ${
        isDragActive
          ? "scale-105 bg-amber-50/50 dark:bg-blue-950/20 border-amber-500 dark:border-blue-500 shadow-md"
          : "bg-amber-50/30 dark:bg-[#1E293B]/40 border-amber-500/30 dark:border-[#334155] hover:scale-[1.02] shadow-[0_8px_40px_-8px_rgba(194,122,84,0.1)] dark:shadow-none"
      }`}
    >
      <input {...getInputProps()} />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <img
              src={preview}
              alt="Selected skin area"
              className="h-full w-full object-cover rounded-skin"
            />
            <div
              className="absolute inset-0 rounded-skin flex items-end justify-center pb-5"
              style={{ background: "linear-gradient(to top, rgba(46,26,14,0.5) 0%, transparent 50%)" }}
            >
              <span className="flex items-center gap-1.5 text-white text-xs font-semibold">
                <CheckCircle2 size={13} /> Ready to analyze
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center px-8"
          >
            {/* Decorative orb */}
            <div
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100/50 to-amber-200/50 dark:from-blue-900/30 dark:to-blue-800/30"
            >
              <ImagePlus size={32} className="text-amber-600 dark:text-blue-450" />
            </div>
            <p className="font-display text-lg font-semibold text-slate-800 dark:text-[#F8FAFC] leading-snug">
              {isDragActive ? "Drop your image here…" : t("upload.drop_text")}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-[#94A3B8]">
              <Camera size={12} />
              JPG · PNG · WEBP — up to 8 MB
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag active overlay */}
      {isDragActive && (
        <div
          className="absolute inset-0 rounded-skin flex items-center justify-center"
          style={{ background: "rgba(234,196,168,0.35)" }}
        >
          <p className="font-display text-xl font-semibold text-skin-700">Drop it!</p>
        </div>
      )}
    </div>
  );
}
