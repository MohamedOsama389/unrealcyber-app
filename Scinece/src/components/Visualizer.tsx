import type { ReactionPrediction } from "../chemistry";

interface VisualizerProps {
  prediction: ReactionPrediction;
}

export function Visualizer({ prediction }: VisualizerProps) {
  if (prediction.visualizationHint === "none") {
    return <p className="text-sm text-slate-600">No dedicated animation for this case.</p>;
  }

  if (prediction.visualizationHint === "neutralization") {
    return (
      <svg viewBox="0 0 340 120" className="h-36 w-full">
        <text x="30" y="65" className="fill-red-600 text-xl font-bold">H+</text>
        <text x="140" y="65" className="fill-sky-700 text-xl font-bold">OH-</text>
        <path d="M 75 58 L 125 58" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow)" />
        <text x="220" y="65" className="fill-emerald-700 text-xl font-bold">H2O</text>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <polygon points="0 0, 8 4, 0 8" fill="#0f172a" />
          </marker>
        </defs>
      </svg>
    );
  }

  if (prediction.visualizationHint === "precipitation") {
    return (
      <svg viewBox="0 0 340 120" className="h-36 w-full">
        <text x="50" y="35" className="fill-slate-700 text-sm">Aqueous ions</text>
        <circle cx="70" cy="60" r="8" fill="#38bdf8" />
        <circle cx="110" cy="65" r="8" fill="#f97316" />
        <circle cx="150" cy="60" r="8" fill="#38bdf8" />
        <path d="M 185 62 L 235 62" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow2)" />
        <rect x="250" y="45" width="60" height="35" rx="6" fill="#cbd5e1" stroke="#475569" />
        <text x="262" y="66" className="fill-slate-800 text-xs font-semibold">solid</text>
        <defs>
          <marker id="arrow2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <polygon points="0 0, 8 4, 0 8" fill="#0f172a" />
          </marker>
        </defs>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 340 120" className="h-36 w-full">
      <circle cx="70" cy="60" r="26" fill="#ffedd5" stroke="#fb923c" />
      <circle cx="260" cy="60" r="26" fill="#dbeafe" stroke="#60a5fa" />
      <path d="M 100 60 L 230 60" stroke="#0f172a" strokeWidth="2" markerEnd="url(#arrow3)" />
      <circle cx="120" cy="50" r="4" fill="#2563eb" className="ionic-electron" />
      <defs>
        <marker id="arrow3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#0f172a" />
        </marker>
      </defs>
    </svg>
  );
}
