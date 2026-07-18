export interface DiseasePrediction {
  disease: string;
  title?: string;
  confidence: number;
}

export interface PredictionResult {
  prediction_id: string;
  top_predictions: DiseasePrediction[];
  primary_disease: string;
  primary_disease_title?: string;
  confidence: number;
  severity: "Mild" | "Moderate" | "Severe";
  image_url: string | null;
  gradcam_image_url: string | null;
  image_quality_warnings: string[];
}

export interface Recommendation {
  disease: string;
  severity: string;
  skin_care: string[];
  lifestyle: string[];
  diet_recommended: string[];
  diet_avoid: string[];
  hydration: string;
  medication_info: {
    categories: string[];
    general_purpose: string;
    precautions: string[];
    side_effects: string[];
    allergy_warning: string;
  };
  severity_guidance: string;
  when_to_consult_doctor: string[];
  emergency_warning_signs: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  city: string;
  state: string;
  clinic_name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviews_count: number;
  phone: string;
  timings: string;
  distance_km?: number;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  preferred_language: string;
  is_verified: boolean;
}
