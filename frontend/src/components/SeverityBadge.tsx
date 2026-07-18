interface Props {
  severity: "Mild" | "Moderate" | "Severe";
}

const CONFIG = {
  Mild: {
    cls: "badge-mild",
    icon: "🌿",
  },
  Moderate: {
    cls: "badge-moderate",
    icon: "⚠️",
  },
  Severe: {
    cls: "badge-severe",
    icon: "🚨",
  },
};

export default function SeverityBadge({ severity }: Props) {
  const cfg = CONFIG[severity] ?? CONFIG.Mild;
  return (
    <span className={cfg.cls}>
      {cfg.icon} {severity}
    </span>
  );
}
