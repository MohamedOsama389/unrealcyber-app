interface LewisDotDiagramProps {
  symbol: string;
  valenceElectrons: number;
}

const positions: Array<[number, number]> = [
  [50, 10],
  [80, 50],
  [50, 90],
  [20, 50],
  [40, 10],
  [80, 40],
  [60, 90],
  [20, 60]
];

export function LewisDotDiagram({ symbol, valenceElectrons }: LewisDotDiagramProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold">Lewis Dots: {symbol}</h3>
      <svg viewBox="0 0 100 100" className="mx-auto h-40 w-40">
        <text x="50" y="58" textAnchor="middle" className="fill-slate-900 text-2xl font-bold">
          {symbol}
        </text>
        {Array.from({ length: Math.min(8, valenceElectrons) }, (_, i) => {
          const [x, y] = positions[i];
          return <circle key={i} cx={x} cy={y} r={3.5} fill="#0f172a" />;
        })}
      </svg>
      <p className="text-xs text-slate-600">Valence electrons: {valenceElectrons}</p>
    </div>
  );
}