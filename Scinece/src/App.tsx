import { useMemo, useRef, useState } from "react";
import { predictReaction } from "./chemistry";
import {
  buildResultId,
  defaultReactionInput,
  reactionTitle
} from "./app/reactionState";
import { ReactantElectronPanel } from "./components/ReactantElectronPanel";
import { ReactionAnimator } from "./components/ReactionAnimator";
import { ReactantPickerModal } from "./components/ReactantPickerModal";
import { ReactantVisualCard } from "./components/ReactantVisualCard";
import type { CurrentResult, ReactantSelection, ReactionInput } from "./app/reactionState";
import type { EquationTerm } from "./chemistry";

interface PredictionScenario {
  displayEquation: string;
  predictEquation: string;
  environmentNote?: string;
}

const formatInputTerm = (formula: string, count: number): string => `${count > 1 ? count : ""}${formula}`;
const formatOxidationNumber = (value: number): string => (value > 0 ? `+${value}` : `${value}`);

const formatEquationWithStates = (reactants: EquationTerm[], products: EquationTerm[], showStates: boolean): string => {
  const formatTerm = (term: EquationTerm): string => {
    const coefficient = term.coefficient === 1 ? "" : `${term.coefficient}`;
    const state = showStates && term.state ? `(${term.state})` : "";
    return `${coefficient}${term.formula}${state}`;
  };

  return `${reactants.map(formatTerm).join(" + ")} -> ${products.map(formatTerm).join(" + ")}`;
};

const buildScenario = (input: ReactionInput): PredictionScenario => {
  const a = input.reactantA ? formatInputTerm(input.reactantA.formula, input.reactantACount) : "A";
  const b = input.reactantB ? formatInputTerm(input.reactantB.formula, input.reactantBCount) : "B";

  if (input.mode === "WATER") {
    if (input.reactantB && input.reactantB.formula !== "H2O") {
      return {
        displayEquation: `${a} + ${b} -> ?`,
        predictEquation: `${a} + H2O -> ?`,
        environmentNote: "Water present"
      };
    }
    return {
      displayEquation: `${a} + H2O -> ?`,
      predictEquation: `${a} + H2O -> ?`
    };
  }

  if (input.mode === "DILUTE_HCL") {
    if (input.reactantB && input.reactantB.formula !== "HCl") {
      return {
        displayEquation: `${a} + ${b} -> ?`,
        predictEquation: `${a} + HCl -> ?`,
        environmentNote: "Dilute HCl present"
      };
    }
    return {
      displayEquation: `${a} + HCl -> ?`,
      predictEquation: `${a} + HCl -> ?`
    };
  }

  return {
    displayEquation: `${a} + ${b} -> ?`,
    predictEquation: `${a} + ${b} -> ?`
  };
};

function App() {
  const [reactionInput, setReactionInput] = useState<ReactionInput>(defaultReactionInput);
  const [reactionResult, setReactionResult] = useState<CurrentResult | null>(null);
  const [pickerSlot, setPickerSlot] = useState<"A" | "B" | null>(null);
  const [showAdvancedStates, setShowAdvancedStates] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const scenario = useMemo(() => buildScenario(reactionInput), [reactionInput]);

  const canPredict = Boolean(
    reactionInput.reactantA && (
      reactionInput.mode !== "NONE" || reactionInput.reactantB
    )
  );

  const updateInput = (updater: (current: ReactionInput) => ReactionInput): void => {
    setReactionInput((current) => updater(current));
    setReactionResult(null);
  };

  const setReactant = (slot: "A" | "B", selection: ReactantSelection): void => {
    updateInput((current) => (
      slot === "A"
        ? { ...current, reactantA: selection, reactantACount: current.reactantACount || 1 }
        : { ...current, reactantB: selection, reactantBCount: current.reactantBCount || 1 }
    ));
  };

  const clearReactant = (slot: "A" | "B"): void => {
    updateInput((current) => (
      slot === "A"
        ? { ...current, reactantA: null, reactantACount: 1 }
        : { ...current, reactantB: null, reactantBCount: 1 }
    ));
  };

  const setReactantCount = (slot: "A" | "B", count: number): void => {
    const safeCount = Math.max(1, Math.min(6, count));
    updateInput((current) => (
      slot === "A"
        ? { ...current, reactantACount: safeCount }
        : { ...current, reactantBCount: safeCount }
    ));
  };

  const resetAll = (): void => {
    setReactionInput(defaultReactionInput);
    setReactionResult(null);
  };

  const predict = (): void => {
    const prediction = predictReaction(scenario.predictEquation);
    const id = buildResultId(prediction, reactionInput);
    setReactionResult({ id, title: reactionTitle(prediction), prediction });
    window.setTimeout(() => {
      if (resultRef.current && typeof resultRef.current.scrollIntoView === "function") {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 30);
  };

  const previewEquation = reactionResult
    ? reactionResult.prediction.occurred
      ? formatEquationWithStates(
        reactionResult.prediction.reactants,
        reactionResult.prediction.products,
        showAdvancedStates
      )
      : `${scenario.displayEquation.replace(" -> ?", "")} -> No reaction`
    : scenario.displayEquation;

  const reasonBullets = reactionResult
    ? reactionResult.prediction.occurred
      ? reactionResult.prediction.reason.slice(0, 3)
      : [
          reactionResult.prediction.reason[0] ?? "No reaction under current high-school rule set.",
          "No driving force (no precipitate/gas/water formed; no displacement; no redox)."
        ]
    : [];

  const oxidationChange = reactionResult?.prediction.redox.changes.find((change) => change.oxidation);
  const reductionChange = reactionResult?.prediction.redox.changes.find((change) => change.reduction);

  return (
    <main className="min-h-screen bg-[#f3f5f7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-md bg-[#137fec] text-xs font-bold text-white">SC</div>
            <h1 className="text-lg font-bold">Cheminal Reactions</h1>
          </div>
          <button type="button" onClick={resetAll} className="rounded bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white">Reset</button>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-8">
        <section className="text-center">
          <h2 className="text-4xl font-bold">Build Your Reaction</h2>
          <p className="mt-2 text-sm text-slate-500">Pick reactants, choose mode, predict, then watch what happens.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div data-testid="reactant-a-btn">
            <ReactantVisualCard
              title="Reactant A"
              reactant={reactionInput.reactantA}
              count={reactionInput.reactantACount}
              onPick={() => setPickerSlot("A")}
              onClear={() => clearReactant("A")}
              onCountChange={(value) => setReactantCount("A", value)}
            />
          </div>
          <div data-testid="reactant-b-btn">
            <ReactantVisualCard
              title="Reactant B"
              reactant={reactionInput.reactantB}
              count={reactionInput.reactantBCount}
              onPick={() => setPickerSlot("B")}
              onClear={() => clearReactant("B")}
              onCountChange={(value) => setReactantCount("B", value)}
            />
          </div>
        </section>

        <section className="flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {([
              { key: "NONE", label: "Normal" },
              { key: "WATER", label: "Water" },
              { key: "DILUTE_HCL", label: "Dilute HCl" }
            ] as const).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => updateInput((current) => ({ ...current, mode: option.key }))}
                className={`rounded-lg px-5 py-2 text-sm font-semibold ${reactionInput.mode === option.key ? "bg-[#137fec] text-white" : "text-slate-500"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#137fec]">Balanced Equation</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{previewEquation}</p>
            {scenario.environmentNote ? <p className="mt-2 text-xs text-slate-500">Environment: {scenario.environmentNote}</p> : null}
          </div>

          <span className="sr-only" data-testid="reactant-a-value">{reactionInput.reactantA?.display ?? "Select"}</span>
          <span className="sr-only" data-testid="reactant-b-value">{reactionInput.reactantB?.display ?? "Select"}</span>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={predict}
              disabled={!canPredict}
              className="rounded-xl bg-[#137fec] px-10 py-3 text-lg font-bold text-white disabled:opacity-40"
            >
              Predict
            </button>
            <button
              type="button"
              aria-pressed={showAdvancedStates}
              onClick={() => setShowAdvancedStates((current) => !current)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                showAdvancedStates ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-600"
              }`}
            >
              Advanced: {showAdvancedStates ? "ON" : "OFF"}
            </button>
          </div>
        </section>

        {(reactionInput.reactantA || reactionInput.reactantB) ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold">Reactant Electron View</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <ReactantElectronPanel title="Reactant A" reactant={reactionInput.reactantA} />
              <ReactantElectronPanel title="Reactant B" reactant={reactionInput.reactantB} />
            </div>
          </section>
        ) : null}

        {reactionResult ? (
          <section ref={resultRef} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Results</h3>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Products + Balanced Equation</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {reactionResult.prediction.occurred
                  ? formatEquationWithStates(
                    reactionResult.prediction.reactants,
                    reactionResult.prediction.products,
                    showAdvancedStates
                  )
                  : "No reaction"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reaction Type</p>
              <p className="text-base font-semibold capitalize">{reactionResult.prediction.reactionType.replace(/_/g, " ")}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Why It Happens</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {reasonBullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Redox Highlights</p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Oxidation</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {oxidationChange
                      ? `${oxidationChange.element}: ${formatOxidationNumber(oxidationChange.from)} -> ${formatOxidationNumber(oxidationChange.to)}`
                      : "No oxidation change"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {oxidationChange ? `${oxidationChange.reactantSpecies} loses electrons.` : "No species is oxidized in this reaction."}
                  </p>
                </div>

                <div className="rounded-lg border border-sky-300 bg-sky-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Reduction</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {reductionChange
                      ? `${reductionChange.element}: ${formatOxidationNumber(reductionChange.from)} -> ${formatOxidationNumber(reductionChange.to)}`
                      : "No reduction change"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {reductionChange ? `${reductionChange.reactantSpecies} gains electrons.` : "No species is reduced in this reaction."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Oxidizing agent: {reactionResult.prediction.redox.oxidizingAgent ?? "none"}
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Reducing agent: {reactionResult.prediction.redox.reducingAgent ?? "none"}
                </span>
                {!reactionResult.prediction.redox.isRedox ? (
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    This reaction is not redox.
                  </span>
                ) : null}
              </div>
            </div>

            <ReactionAnimator prediction={reactionResult.prediction} />
          </section>
        ) : null}
      </div>

      <ReactantPickerModal
        slot={pickerSlot ?? "A"}
        isOpen={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(selection) => {
          if (!pickerSlot) {
            return;
          }
          setReactant(pickerSlot, selection);
          setPickerSlot(null);
        }}
      />
    </main>
  );
}

export default App;
