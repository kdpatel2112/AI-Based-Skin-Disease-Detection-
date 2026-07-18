import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DiseasePrediction } from "../types";

// Warm skin-health palette: terracotta → blush → sand
const COLORS = ["#C27A54", "#EAC4A8", "#D9A27E"];

export default function ConfidenceChart({ predictions }: { predictions: DiseasePrediction[] }) {
  const data = predictions.map((p) => ({
    name: p.title || p.disease.replace("_", " "),
    confidence: Math.round(p.confidence * 1000) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono" }} unit="%" />
        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Bar dataKey="confidence" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
