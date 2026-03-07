import { getElement, getLikelyIonicCharge, getShellDistribution, getValenceElectrons } from "../engine/chemistry";
import { parseFormula, splitIonicCompound } from "../chemistry";
import type { ReactantSelection } from "../app/reactionState";

interface ReactantElectronPanelProps {
  title: string;
  reactant: ReactantSelection | null;
}

const formatCharge = (charge: number): string => {
  if (charge > 0) {
    return charge === 1 ? "+" : `${charge}+`;
  }
  if (charge < 0) {
    return charge === -1 ? "-" : `${Math.abs(charge)}-`;
  }
  return "0";
};

const countSymbolInFormula = (formula: string, symbol: string): number => {
  try {
    const counts = parseFormula(formula);
    return counts[symbol] ?? 1;
  } catch {
    return 1;
  }
};

const BohrOrbits = ({ symbol, atomicNumber }: { symbol: string; atomicNumber: number }) => {
  const shells = getShellDistribution(atomicNumber);
  const center = 110;

  return (
    <svg viewBox="0 0 220 220" className="mx-auto h-56 w-56">
      <circle cx={center} cy={center} r={14} fill="#1f2937" />
      {shells.map((electronCount, shellIndex) => {
        const radius = 30 + shellIndex * 22;
        return (
          <g key={`${symbol}-shell-${shellIndex}`}>
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#94a3b8" strokeWidth={1.4} />
            {Array.from({ length: electronCount }, (_, electronIndex) => {
              const angle = (2 * Math.PI * electronIndex) / electronCount;
              const x = center + radius * Math.cos(angle);
              const y = center + radius * Math.sin(angle);
              return <circle key={`${symbol}-el-${shellIndex}-${electronIndex}`} cx={x} cy={y} r={3.6} fill="#2563eb" />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

export function ReactantElectronPanel({ title, reactant }: ReactantElectronPanelProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">{title}</h4>

      {!reactant ? (
        <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          Select a reactant
        </div>
      ) : null}

      {reactant?.kind === "element" ? (() => {
        const element = getElement(reactant.formula);
        if (!element) {
          return <p className="text-sm text-slate-600">Unsupported element data.</p>;
        }
        const valence = getValenceElectrons(element);
        return (
          <div className="space-y-2 text-center">
            <BohrOrbits symbol={element.symbol} atomicNumber={element.atomicNumber} />
            <p className="text-3xl font-bold text-slate-900">{element.symbol}</p>
            <p className="text-sm font-semibold text-slate-700">Orbit shells: {getShellDistribution(element.atomicNumber).join(", ")}</p>
            <p className="text-sm text-slate-600">Valence electrons: {valence}</p>
            <p className="text-sm text-slate-600">Common charge: {formatCharge(getLikelyIonicCharge(element))}</p>
          </div>
        );
      })() : null}

      {reactant?.kind === "compound" ? (() => {
        const ionic = splitIonicCompound(reactant.formula);
        if (!ionic) {
          return (
            <div className="grid min-h-44 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
              <p>{reactant.formula} (molecular compound view in MVP)</p>
            </div>
          );
        }

        const cationCount = countSymbolInFormula(reactant.formula, ionic.cation.formula);
        const anionCount = countSymbolInFormula(reactant.formula, ionic.anion.formula);

        return (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Ion view</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                {cationCount > 1 ? `${cationCount}` : ""}{ionic.cation.formula}{formatCharge(ionic.cation.charge)}
              </span>
              <span className="text-slate-400">+</span>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                {anionCount > 1 ? `${anionCount}` : ""}{ionic.anion.formula}{formatCharge(ionic.anion.charge)}
              </span>
            </div>
            <p className="text-xs text-slate-500">{reactant.formula} dissociates into ions in solution.</p>
          </div>
        );
      })() : null}
    </article>
  );
}
