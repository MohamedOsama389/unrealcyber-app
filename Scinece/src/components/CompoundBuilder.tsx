interface CompoundBuilderProps {
  compounds: string[];
  left: string;
  right: string;
  onLeft: (value: string) => void;
  onRight: (value: string) => void;
  onBuild: () => void;
}

export function CompoundBuilder({ compounds, left, right, onLeft, onRight, onBuild }: CompoundBuilderProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Build reactants</h2>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Reactant A</label>
          <input list="compound-list" value={left} onChange={(e) => onLeft(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <span className="text-center text-xl font-bold text-slate-400">+</span>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Reactant B</label>
          <input list="compound-list" value={right} onChange={(e) => onRight(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={onBuild} className="rounded bg-brand-500 px-3 py-2 text-sm font-semibold text-white">
          Use in equation
        </button>
      </div>
      <datalist id="compound-list">
        {compounds.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </section>
  );
}
