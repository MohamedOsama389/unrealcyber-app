import { getShellDistribution } from "../engine/chemistry";

interface ElectronShellViewerProps {
  symbol: string;
  atomicNumber: number;
  formulaLabel?: string;
  companionSymbol?: string;
  companionAtomicNumber?: number;
  companionLabel?: string;
  companionCount?: number;
  companionNote?: string;
}

const BohrAtom = ({
  cx,
  cy,
  shells,
  electronColor,
  coreRadius
}: {
  cx: number;
  cy: number;
  shells: number[];
  electronColor: string;
  coreRadius: number;
}) => (
  <>
    <circle cx={cx} cy={cy} r={coreRadius} fill="#1f2937" />
    {shells.map((count, index) => {
      const radius = 24 + index * 20;
      return (
        <g key={`${cx}-${cy}-shell-${index}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#94a3b8" strokeWidth={1.2} />
          {Array.from({ length: count }, (_, electronIndex) => {
            const angle = (2 * Math.PI * electronIndex) / count;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            return <circle key={`${cx}-${cy}-el-${index}-${electronIndex}`} cx={x} cy={y} r={3.2} fill={electronColor} />;
          })}
        </g>
      );
    })}
  </>
);

export function ElectronShellViewer({
  symbol,
  atomicNumber,
  formulaLabel,
  companionSymbol,
  companionAtomicNumber,
  companionLabel,
  companionCount = 1,
  companionNote
}: ElectronShellViewerProps) {
  const shells = getShellDistribution(atomicNumber);
  const hasCompanion = Boolean(companionSymbol || companionLabel);
  const size = 260;
  const mainCenterX = hasCompanion ? 98 : size / 2;
  const mainCenterY = size / 2;
  const companionShells = companionAtomicNumber ? getShellDistribution(companionAtomicNumber) : [];
  const companionText = companionLabel ?? companionSymbol;
  const companionVisualCount = Math.max(1, Math.min(companionCount, 3));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold">
        Bohr Shells: {formulaLabel ?? `${symbol}${hasCompanion ? ` + ${companionText}` : ""}`}
      </h3>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-56 w-56">
        <BohrAtom cx={mainCenterX} cy={mainCenterY} shells={shells} electronColor="#3d70e0" coreRadius={12} />
        {hasCompanion ? (
          <>
            <line x1={mainCenterX + 56} y1={mainCenterY - 8} x2={198} y2={74} stroke="#64748b" strokeWidth={1.2} strokeDasharray="4 3" />
            {companionAtomicNumber ? (
              <>
                {Array.from({ length: companionVisualCount }, (_, idx) => {
                  const cx = 202 + (idx - (companionVisualCount - 1) / 2) * 32;
                  const cy = 78 + (idx % 2 === 0 ? 0 : 6);
                  return (
                    <g key={`companion-atom-${idx}`} transform={`translate(${cx} ${cy}) scale(0.56) translate(${-cx} ${-cy})`}>
                      <BohrAtom cx={cx} cy={cy} shells={companionShells} electronColor="#16a34a" coreRadius={8} />
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                <circle cx={202} cy={78} r={22} fill="#ecfeff" stroke="#0ea5e9" strokeWidth={1.4} />
                <text x={202} y={83} textAnchor="middle" className="fill-cyan-700 text-[12px] font-bold">
                  {companionText}
                </text>
              </>
            )}
            <text x={202} y={26} textAnchor="middle" className="fill-slate-700 text-[12px] font-semibold">
              {companionText}
            </text>
          </>
        ) : null}
      </svg>
      <p className="mt-2 text-xs text-slate-600">Shell breakdown: {shells.join(", ")}</p>
      {hasCompanion ? <p className="text-xs text-slate-500">{companionNote ?? `${companionText} is next to ${symbol} in this reactant.`}</p> : null}
    </div>
  );
}
