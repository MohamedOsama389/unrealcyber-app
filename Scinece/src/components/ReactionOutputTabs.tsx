import { splitIonicCompound } from "../chemistry";
import type { ReactionPrediction } from "../chemistry";
import { Visualizer } from "./Visualizer";

type Tab = "products" | "type" | "why" | "redox" | "visual";

interface ReactionOutputTabsProps {
  prediction: ReactionPrediction | null;
  ionsView: boolean;
  tab: Tab;
  onTab: (tab: Tab) => void;
}

const tabs: Tab[] = ["products", "type", "why", "redox", "visual"];

export function ReactionOutputTabs({ prediction, ionsView, tab, onTab }: ReactionOutputTabsProps) {
  if (!prediction) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">No prediction yet. Click Predict to see products, type, why, redox, and visualization.</p>
      </section>
    );
  }

  const ionicView = (formula: string): string => {
    const ionic = splitIonicCompound(formula);
    if (!ionic) {
      return formula;
    }
    return `${ionic.cation.formula}${ionic.cation.charge > 0 ? `${ionic.cation.charge}+` : ionic.cation.charge} + ${ionic.anion.formula}${ionic.anion.charge}`;
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onTab(name)}
            className={`rounded px-3 py-1.5 text-sm font-semibold ${tab === name ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-700"}`}
          >
            {name}
          </button>
        ))}
      </div>

      {tab === "products" ? (
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Molecular:</span> {prediction.molecularEquation}</p>
          <p><span className="font-semibold">Balanced:</span> {prediction.balancedEquation}</p>
          {prediction.netIonicEquation ? <p><span className="font-semibold">Net ionic:</span> {prediction.netIonicEquation}</p> : null}
          {ionsView ? (
            <div className="rounded border border-slate-200 bg-slate-50 p-2 text-xs">
              <p className="font-semibold">Ions view (MVP):</p>
              <p>Reactants: {prediction.reactants.map((r) => ionicView(r.formula)).join(" + ")}</p>
              <p>Products: {prediction.products.map((p) => ionicView(p.formula)).join(" + ")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "type" ? (
        <div className="text-sm">
          <p className="font-semibold">Reaction type: {prediction.reactionType.replace(/_/g, " ")}</p>
          {prediction.patternMatched ? <p className="mt-1 text-slate-700">Pattern matched: {prediction.patternMatched}</p> : null}
          <p className="mt-1">{prediction.occurred ? "Reaction predicted to occur." : "No reaction predicted."}</p>
        </div>
      ) : null}

      {tab === "why" ? (
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Why it happens</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            {prediction.reason.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
          {prediction.drivingForce.length ? (
            <>
              <p className="font-semibold">Driving force</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-700">
                {prediction.drivingForce.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === "redox" ? (
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Redox analysis: {prediction.redox.isRedox ? "Yes" : "No"}</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            {prediction.redox.explanation.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
          {prediction.redox.changes.length ? (
            <table className="mt-2 w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-1 text-left">Element</th>
                  <th className="border p-1 text-left">From</th>
                  <th className="border p-1 text-left">To</th>
                  <th className="border p-1 text-left">Species</th>
                </tr>
              </thead>
              <tbody>
                {prediction.redox.changes.map((ch, idx) => (
                  <tr key={idx}>
                    <td className="border p-1">{ch.element}</td>
                    <td className="border p-1">{ch.from}</td>
                    <td className="border p-1">{ch.to}</td>
                    <td className="border p-1">{ch.reactantSpecies}{" -> "}{ch.productSpecies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}

      {tab === "visual" ? <Visualizer prediction={prediction} /> : null}
    </section>
  );
}
