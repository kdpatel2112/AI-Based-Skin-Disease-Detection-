import { Star, MapPin, Phone, Clock } from "lucide-react";
import { Doctor } from "../types";

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="rounded-clinic border border-teal-200/60 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg text-ink">{doctor.name}</h3>
          <p className="text-sm text-ink/60">{doctor.specialization}</p>
        </div>
        <div className="flex items-center gap-1 font-mono text-sm text-amber">
          <Star size={14} fill="currentColor" /> {doctor.rating}
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-sm text-ink/80">
        <MapPin size={15} className="mt-0.5 shrink-0 text-teal-500" />
        {doctor.clinic_name}, {doctor.address}
        {doctor.distance_km !== undefined && (
          <span className="ml-1 font-mono text-xs text-teal-700">· {doctor.distance_km} km</span>
        )}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/80">
        <Clock size={15} className="text-teal-500" /> {doctor.timings}
      </p>
      <a
        href={`tel:${doctor.phone}`}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
      >
        <Phone size={14} /> {doctor.phone}
      </a>
    </div>
  );
}
