import type { ElementData } from "../engine/types";

interface PeriodicTablePickerProps {
  elements: ElementData[];
  selectedA?: string;
  selectedB?: string;
  activeSlot: "A" | "B";
  onSlotChange: (slot: "A" | "B") => void;
  onPick: (symbol: string) => void;
}

export function PeriodicTablePicker({
  elements,
  selectedA,
  selectedB,
  activeSlot,
  onSlotChange,
  onPick
}: PeriodicTablePickerProps) {
  const tableMap = new Map(elements.map((element) => [`${element.period}-${element.group}`, element]));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <span className="font-semibold">Pick reactants:</span>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={activeSlot === "A"} onChange={() => onSlotChange("A")} />
          Reactant A ({selectedA ?? "-"})
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={activeSlot === "B"} onChange={() => onSlotChange("B")} />
          Reactant B ({selectedB ?? "-"})
        </label>
      </div>

      <div className="grid grid-cols-9 gap-2 md:grid-cols-18">
        {Array.from({ length: 5 }, (_, periodIndex) => periodIndex + 1).flatMap((period) =>
          Array.from({ length: 18 }, (_, groupIndex) => groupIndex + 1).map((group) => {
            const key = `${period}-${group}`;
            const element = tableMap.get(key);
            if (!element) {
              return <div key={key} className="h-12 rounded border border-transparent" />;
            }

            const isSelected = selectedA === element.symbol || selectedB === element.symbol;
            const categoryClass =
              element.category === "metal"
                ? "bg-orange-50 border-orange-200"
                : element.category === "metalloid"
                  ? "bg-amber-50 border-amber-200"
                  : element.category === "noble-gas"
                    ? "bg-slate-100 border-slate-300"
                    : "bg-sky-50 border-sky-200";

            return (
              <button
                key={key}
                type="button"
                onClick={() => onPick(element.symbol)}
                className={`h-12 rounded border p-1 text-left transition hover:scale-[1.02] ${categoryClass} ${isSelected ? "ring-2 ring-brand-500" : ""}`}
                title={`${element.name} (${element.symbol})`}
              >
                <div className="text-xs text-slate-500">{element.atomicNumber}</div>
                <div className="font-semibold leading-tight">{element.symbol}</div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}