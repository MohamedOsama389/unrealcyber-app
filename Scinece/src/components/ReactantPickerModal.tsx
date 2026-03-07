import { useMemo, useState } from "react";
import commonCompounds from "../chemistry/datasets/commonCompounds.json";
import { getLikelyIonicCharge, getElement, getValenceElectrons, listElements } from "../engine/chemistry";
import type { ReactantSelection } from "../app/reactionState";

interface ReactantPickerModalProps {
  slot: "A" | "B";
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: ReactantSelection) => void;
}

const formatCharge = (charge: number): string => {
  if (charge > 0) {
    return charge === 1 ? "+1" : `+${charge}`;
  }
  if (charge < 0) {
    return `${charge}`;
  }
  return "0";
};

export function ReactantPickerModal({ slot, isOpen, onClose, onSelect }: ReactantPickerModalProps) {
  const [tab, setTab] = useState<"periodic" | "compounds">("periodic");
  const [elementSearch, setElementSearch] = useState("");
  const [compoundSearch, setCompoundSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("Na");

  const elements = useMemo(() => listElements(), []);
  const selectedElement = getElement(selectedSymbol);

  const matchesElement = (symbol: string, name: string): boolean => {
    const query = elementSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return symbol.toLowerCase().includes(query) || name.toLowerCase().includes(query);
  };

  const filteredCompounds = (commonCompounds as string[]).filter((compound) => {
    const query = compoundSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return compound.toLowerCase().includes(query);
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Choose Reactant {slot}</h2>
          <button type="button" onClick={onClose} className="rounded bg-slate-200 px-3 py-1 text-sm">Close</button>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("periodic")}
            className={`rounded px-3 py-1.5 text-sm font-semibold ${tab === "periodic" ? "bg-[#137fec] text-white" : "bg-slate-200 text-slate-700"}`}
          >
            Periodic Table
          </button>
          <button
            type="button"
            onClick={() => setTab("compounds")}
            className={`rounded px-3 py-1.5 text-sm font-semibold ${tab === "compounds" ? "bg-[#137fec] text-white" : "bg-slate-200 text-slate-700"}`}
          >
            Common Compounds
          </button>
        </div>

        {tab === "periodic" ? (
          <div className="space-y-3">
            <input
              value={elementSearch}
              onChange={(event) => setElementSearch(event.target.value)}
              placeholder="Search element by name or symbol"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="grid grid-cols-9 gap-1 md:grid-cols-18">
                {Array.from({ length: 7 }, (_, periodIndex) => periodIndex + 1).flatMap((period) =>
                  Array.from({ length: 18 }, (_, groupIndex) => groupIndex + 1).map((group) => {
                    const element = elements.find((item) => item.period === period && item.group === group);
                    const key = `${period}-${group}`;
                    if (!element) {
                      return <div key={key} className="h-10" />;
                    }

                    const visible = matchesElement(element.symbol, element.name);
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!visible}
                        onClick={() => setSelectedSymbol(element.symbol)}
                        className={`h-10 rounded border text-xs font-semibold transition ${selectedSymbol === element.symbol ? "border-[#137fec] bg-blue-50 text-blue-700" : "border-slate-200"} ${visible ? "" : "cursor-not-allowed opacity-20"}`}
                      >
                        {element.symbol}
                      </button>
                    );
                  })
                )}
              </div>

              <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                {selectedElement ? (
                  <>
                    <p className="text-lg font-bold">{selectedElement.symbol} - {selectedElement.name}</p>
                    <p>Atomic number: {selectedElement.atomicNumber}</p>
                    <p>Group/Period: {selectedElement.group}/{selectedElement.period}</p>
                    <p>Valence electrons: {getValenceElectrons(selectedElement)}</p>
                    <p>Common charge: {formatCharge(getLikelyIonicCharge(selectedElement))}</p>
                    {typeof selectedElement.electronegativity === "number" ? (
                      <p>Electronegativity: {selectedElement.electronegativity}</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({
                          kind: "element",
                          formula: selectedElement.symbol,
                          display: selectedElement.symbol,
                          meta: { name: selectedElement.name }
                        });
                        onClose();
                      }}
                      className="mt-3 rounded bg-[#137fec] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Select as Reactant {slot}
                    </button>
                  </>
                ) : null}
              </aside>
            </div>
          </div>
        ) : null}

        {tab === "compounds" ? (
          <div className="space-y-3">
            <input
              value={compoundSearch}
              onChange={(event) => setCompoundSearch(event.target.value)}
              placeholder="Search common compounds"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompounds.map((compound) => (
                <button
                  key={compound}
                  type="button"
                  onClick={() => {
                    onSelect({ kind: "compound", formula: compound, display: compound });
                    onClose();
                  }}
                  className="rounded border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {compound}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
