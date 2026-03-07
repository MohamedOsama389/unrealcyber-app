import type { ReactionPrediction } from "../chemistry";

interface ReactionSummaryCardProps {
  prediction: ReactionPrediction | null;
}

export function ReactionSummaryCard({ prediction }: ReactionSummaryCardProps) {
  if (!prediction) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Reaction Summary</h2>
        <p className="mt-2 text-sm text-slate-600">Select reactants, then click Predict.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Reaction Summary</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Type</p>
          <p className="font-semibold capitalize">{prediction.reactionType.replace(/_/g, " ")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Products</p>
          <p className="font-semibold">{prediction.products.length ? prediction.products.map((x) => x.formula).join(" + ") : "No reaction"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-slate-500">Balanced equation</p>
          <p className="font-semibold">{prediction.balancedEquation}</p>
        </div>
      </div>
      {prediction.reason.length ? (
        <div className="mt-3 text-sm">
          <p className="font-semibold">Why it happens</p>
          <ul className="list-disc pl-5 text-slate-700">
            {prediction.reason.slice(0, 3).map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {prediction.redox.isRedox ? (
        <p className="mt-2 text-sm text-slate-700">
          Redox: oxidized/reduced detected. Reducing agent: {prediction.redox.reducingAgent ?? "unknown"}, oxidizing agent: {prediction.redox.oxidizingAgent ?? "unknown"}.
        </p>
      ) : null}
      {!prediction.occurred ? <p className="mt-2 text-sm text-rose-700">No reaction: {prediction.reason.join(" ")}</p> : null}
      {prediction.parserError ? <p className="mt-2 text-sm text-rose-700">Parse issue: {prediction.parserError}</p> : null}
    </section>
  );
}
