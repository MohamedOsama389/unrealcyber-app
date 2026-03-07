interface EquationParserPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export function EquationParserPanel({ value, onChange }: EquationParserPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="eq-input" className="mb-2 block text-sm font-semibold">
        Type equation (example: Zn + CuSO4 -&gt; ?)
      </label>
      <input
        id="eq-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
      />
    </section>
  );
}
